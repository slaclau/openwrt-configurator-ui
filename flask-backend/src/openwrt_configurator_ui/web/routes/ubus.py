import requests
from flask import Blueprint, abort, request

from openwrt_configurator_ui.web.db import db
from openwrt_configurator_ui.web.models import Devices

ubus = Blueprint("ubus", __name__)


@ubus.route("/ubus/<hostname>", methods=["POST"])
def call_ubus(hostname):
    data = request.json
    if isinstance(data, list):
        for datum in data:
            datum["jsonrpc"] = "2.0"
            datum["id"] = "1"
    else:
        data["jsonrpc"] = "2.0"
        data["id"] = "1"
    rtn = do_ubus_request(hostname, data)

    if "error" in rtn or isinstance(rtn, list) and "error" in rtn[0]:
        print("Authorizing")
        device = db.session.get(Devices, hostname)
        auth_data = {
            "jsonrpc": "2.0",
            "id": "1",
            "method": "call",
            "params": [
                "00000000000000000000000000000000",
                "session",
                "login",
                {
                    "username": device.provisioning_config["ssh_auth"]["username"],
                    "password": device.provisioning_config["ssh_auth"]["password"],
                },
            ],
        }
        device.rpc_session = requests.post(
            f"http://{device.ipaddr}/ubus", json=auth_data
        ).json()["result"][-1]["ubus_rpc_session"]
        db.session.merge(device)
        db.session.commit()
        rtn = do_ubus_request(hostname, request.json)
    try:
        if isinstance(rtn, list):
            return [item["result"][-1] for item in rtn]
        return rtn["result"][-1]
    except KeyError:
        print(rtn)
        abort(500)


def do_ubus_request(hostname, data):
    device = db.session.get(Devices, hostname)
    rpc_session = device.rpc_session
    if isinstance(data, list):
        for datum in data:
            datum["params"] = [rpc_session] + datum["params"]
    else:
        data["params"] = [rpc_session] + data["params"]
    path = f"http://{device.ipaddr}/ubus"
    return requests.post(path, json=data).json()
