import ipaddress
import json

import pydantic_core
from flask import Blueprint, abort, request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.inspection import inspect

from openwrt_configurator_ui.configurator.schema.config import ONCConfigValidator
from openwrt_configurator_ui.web.db import db
from openwrt_configurator_ui.web.models import Clients, Devices, Networks, Wireless

config = Blueprint("config", __name__)

management_vlan = 1


@config.route("/build")
def build():
    _devices = _table("devices")
    _networks = _table("networks")
    _wireless = _table("wireless")

    with open("static.json", encoding="UTF-8") as f:
        static = json.load(f)

    wifi_ifaces = [
        {
            "mode": "ap",
            "device": "*",
            "network": iface["network"],
            "ssid": iface["name"],
            "encryption": (
                iface["security"]["encryption"] if "security" in iface else None
            ),
            "key": iface["security"]["key"] if "security" in iface else None,
        }
        for iface in _wireless
    ]

    network_overrides = []
    network_interfaces = []
    bridge_vlans = []
    for network in _networks:
        if "vlan_id" in network and network["vlan_id"] == management_vlan:
            proto = "dhcp"
            ports = "*"
            network_overrides = [
                {
                    ".if": f"device.hostname == {device["hostname"]}",
                    "override": {
                        "proto": "static",
                        "ipaddr": device["ipaddr"],
                        "netmask": str(ipaddress.IPv4Network("192.168.0.0/24").netmask),
                    },
                }
                for device in _devices
                if device["static"]
            ]
        else:
            proto = "none"
            ports = "*t"
        network_interfaces.append(
            {
                ".overrides": network_overrides,
                ".name": network["key"],
                "device": (
                    f"br0.{network["vlan_id"]}" if "vlan_id" in network else "br0"
                ),
                "proto": proto,
            }
        )
        bridge_vlans.append(
            {
                "device": "br0",
                "vlan": network["vlan_id"],
                "ports": ports,
            }
        )

    rtn = static
    rtn["devices"] = _devices

    rtn["config"]["network"]["bridge-vlan"] += bridge_vlans
    rtn["config"]["network"]["interface"] += network_interfaces

    rtn["config"]["wireless"]["wifi-iface"] += wifi_ifaces

    try:
        assert ONCConfigValidator.validate_python(rtn)
    except pydantic_core.ValidationError as e:
        print(f"{e}: {rtn}")
    return rtn


@config.route("/", methods=["GET"])
@config.route("/<table>", methods=["GET", "PUT", "DELETE", "POST"])
@config.route("/<table>/<key>", methods=["GET", "PUT", "DELETE", "POST"])
def _table(table=None, key=None):
    table_map = {
        "devices": Devices,
        "networks": Networks,
        "wireless": Wireless,
        "clients": Clients,
    }
    if table is None:
        return {table: _table(table) for table in table_map}

    try:
        Table = table_map[table]
    except KeyError:
        abort(404, f"Unknown table {table}")

    try:
        if request.method == "GET" and key is None:
            return [item.to_config() for item in db.session.query(Table).all()]
        elif request.method == "GET":
            item = db.session.get(Table, key)
        elif request.method == "PUT":
            item = Table(**request.json)
            if item.__getattribute__(inspect(Table).primary_key[0].name) != key:
                abort(400)
            db.session.merge(item)
            db.session.commit()
        elif request.method == "DELETE":
            item = db.session.get(Table, key)
            if item is None:
                abort(404, "nothing to delete")
            db.session.delete(item)
            db.session.commit()
            item = Table()
        elif request.method == "POST" and key is None:
            item = Table(**request.json)
            db.session.add(item)
            db.session.commit()
        else:
            abort(405)
    except IntegrityError as e:
        abort(400, f"statement: {e.statement}, params: {e.params}")

    if item is None:
        abort(404, "Nothing to return")
    return item.to_config()
