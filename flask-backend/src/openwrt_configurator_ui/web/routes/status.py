import datetime
import itertools
import json
import socket

import pydantic
import requests
from flask import Blueprint, abort, request
from flask_socketio import emit, send

from openwrt_configurator_ui.configurator.device import get_connection
from openwrt_configurator_ui.configurator.provision import (
    get_state,
    provision_onc_config,
)
from openwrt_configurator_ui.configurator.schema.config import ONCConfigValidator
from openwrt_configurator_ui.web.app import socketio
from openwrt_configurator_ui.web.db import db
from openwrt_configurator_ui.web.models import Clients, Collectd, Devices
from openwrt_configurator_ui.web.routes.config import build
from openwrt_configurator_ui.web.routes.ubus import do_ubus_request

status = Blueprint("status", __name__)


@status.route("/config/<hostname>", methods=["GET"])
def get_config_json(hostname=None) -> dict:
    devices = [device.to_config() for device in db.session.query(Devices).all()]

    with open("config.json", encoding="UTF-8") as f:
        static = json.load(f)
        print("Static config loaded from config.json")
    config = {**static, "devices": devices}
    if hostname is None:
        return config
    device_config = db.session.get(Devices, hostname).to_config()
    print(f"dc: {device_config}")
    return get_state(config, device_config)["config"]


@status.route("/provision", methods=["GET"])
def provision(config=None):
    if config is None:
        config = build()  # get_config_json()
    result, failed = provision_onc_config(config)
    if result:
        with open("provisioned_config.json", "w", encoding="UTF-8") as f:
            json.dump(config, f)
            print("Provisioned config written to provisioned_config.json")
        return config
    abort(400, f"Failed on {failed}, did not write new config")


def get_static_from_config(config):
    static = config.copy()
    static.pop("devices")
    return static


@status.route("/config", methods=["PUT"])
def set_config_json():
    config = request.json
    rtn = set_config(config)
    return rtn


def set_config(config: dict):
    old_config = get_config_json()
    try:
        ONCConfigValidator.validate_python(config)
    except pydantic.ValidationError:
        abort(400, "Invalid configuration")
    devices = config["devices"]
    for device in devices:
        db.session.merge(Devices(**device))
    db.session.commit()

    with open("config.json", "w", encoding="UTF-8") as f:
        json.dump(get_static_from_config(config), f)
        print("Static config written to config.json")

    current_config = get_config_json()
    if False and config != current_config:
        print("New config not set correctly, reverting")
        print(f"Read: {current_config}")
        print(f"Expected: {config}")
        return set_config(old_config)
    print("New config set correctly")
    return current_config


@status.route("/inform", methods=["POST"])
def inform():
    data = request.json
    timestamp = datetime.datetime.now()
    ipaddr = request.remote_addr

    if data["hostname"] == "":
        abort(400)

    old = db.session.get(Devices, data["hostname"])
    if old is not None and ipaddr != old.ipaddr:
        print(f"IP changed from {old.ipaddr} to {ipaddr}")
    devices = Devices(
        hostname=data["hostname"],
        description=data["description"],
        ipaddr=ipaddr,
        timestamp=timestamp,
    )
    db.session.merge(devices)
    db.session.commit()
    return {}, 200


@socketio.on("message")
def emit_status(message):
    if message == "status_request":
        emit("status", query_status())


@status.route("/status")
@status.route("/status/<hostname>")
def query_status(hostname=None):
    if hostname is None:
        rtn = []
        for hostname in db.session.query(Devices.hostname).all():
            rtn.append(query(hostname))
        return rtn
    return query(hostname)


@status.route("/collectd/<host_name>")
@status.route("/collectd/<host_name>/<plugin_name>")
@status.route("/collectd/<host_name>/<plugin_name>/<type_instance>")
def query_collect(host_name, plugin_name=None, type_instance=None):
    query = db.session.query(Collectd).filter(Collectd.host_name == host_name)
    plugin_names = [row.plugin_instance for row in query.all()]
    plugin_instances = [row.plugin_instance for row in query.all()]
    type_names = [row.type_name for row in query.all()]
    type_instances = [row.type_instance for row in query.all()]
    if plugin_name is None:
        rtn = []
        for plugin_name in list(set(plugin_names)):
            query = query.filter(Collectd.plugin_name == plugin_name)
            for type_instance in list(set(type_instances)):
                rtn.append(
                    make_query_return(
                        query.filter(Collectd.type_instance == type_instance)
                    )
                )
        return rtn

    query = query.filter(Collectd.plugin_name == plugin_name)
    if type_instance is None:
        rtn = []
        for type_instance in list(set(type_instances)):
            rtn.append(
                make_query_return(query.filter(Collectd.type_instance == type_instance))
            )
        return rtn

    query = query.filter(Collectd.type_instance == type_instance)
    return make_query_return(query)


@status.post("/rdns")
def do_rdns_lookup():
    addrs = request.json["addrs"]
    rtn = {}
    for addr in addrs:
        rtn[addr] = get_rdns(addr)

    return rtn


@status.route("/rdns/<addr>")
def get_rdns(addr):
    try:
        rtn = socket.getnameinfo((addr, 0), 0)[0]
    except socket.gaierror as e:
        print(f"{addr}: {e}")
        return ""
    return ".".join(rtn.split(".")[0:-1])


@status.route("/clients/<mac>")
def get_hostname(mac):
    print(f"Looking up hostname for {mac}")
    client = db.session.get(Clients, mac)
    try:
        return client.hostname
    except AttributeError:
        for device in db.session.query(Devices).all():
            hosthints = get_hosthints(device.hostname)
            if mac in hosthints:
                ipaddrs = hosthints[mac]["ipaddrs"]
                for ipaddr in ipaddrs:
                    hn = get_rdns(ipaddr)
                    print(f"Found {hn} for {ipaddr}")
                    if hn != "":
                        client = Clients(mac=mac, hostname=hn)
                        db.session.merge(client)
                        db.session.commit()
                        return hn


@status.route("/clients", methods=["GET", "POST"])
def get_clients():
    if request.method == "GET":
        return {
            client.mac: client.hostname for client in db.session.query(Clients).all()
        }
    if request.method == "POST":
        macs = request.json["macs"]
        rtn = {mac: get_hostname(mac) for mac in macs}
        return rtn


def get_hosthints(hostname):
    rtn = requests.post(
        f"http://localhost:5173/api/ubus/{hostname}",
        json={
            "method": "call",
            "params": ["luci-rpc", "getHostHints", {}],
        },
    )
    return rtn.json()


def make_query_return(query):
    rtn = [
        {
            "timestamp": row.timestamp,
            "value": row.value,
        }
        for row in query.all()
    ]
    plugin_instances = [row.plugin_instance for row in query.all()]
    type_names = [row.type_name for row in query.all()]

    # assert len(set(plugin_instances)) == 1
    # assert len(set(type_names)) == 1

    try:
        return {
            "plugin_name": query.first().plugin_name,
            "plugin_instance": plugin_instances[0],
            "type_name": type_names[0],
            "type_instance": query.first().type_instance,
            "values": rtn,
        }
    except AttributeError:
        return {}


def query(hostname):
    device = db.session.get(Devices, hostname)
    if device is not None:
        rtn = device.to_config()
        try:
            up = requests.get(f"http://{device.ipaddr}", timeout=0.1).status_code == 200
            timestamp = datetime.datetime.now()
        except requests.Timeout:
            up = False
            timestamp = device.timestamp
        except requests.ConnectionError:
            up = False
            timestamp = device.timestamp
        rtn["up"] = up
        rtn["timestamp"] = timestamp.strftime("%H:%M:%S")
        rtn.pop("provisioning_config")
        return rtn
    abort(404, f"No device with hostname {hostname}")
