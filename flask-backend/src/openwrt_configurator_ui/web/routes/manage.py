import time

import requests
from flask import Blueprint, abort, request

from openwrt_configurator_ui.web.db import db
from openwrt_configurator_ui.web.models import Devices

manage = Blueprint("manage", __name__)


@manage.route("/restart/<hostname>")
def restart(hostname):
    try:
        rtn = requests.post(
            f"http://localhost:5173/api/ubus/{hostname}",
            json={
                "method": "call",
                "params": ["system", "reboot", {}],
            },
        )
    except Exception as e:
        print(e)
        abort(500)
    return {}


LEDS: dict[str, list[dict[str, int]]] = {"ubnt,unifi": {"green:dome": 255}}


@manage.route("/locate/<hostname>", methods=["GET", "DELETE"])
def locate(hostname):
    try:
        model = db.session.get(Devices, hostname).model_id
        if model not in LEDS:
            abort(400, model)
        leds = LEDS[model]
        if request.method == "GET":
            rtn = requests.post(
                f"http://localhost:5173/api/ubus/{hostname}",
                json={
                    "method": "call",
                    "params": [
                        "led",
                        "set",
                        {
                            "leds": {led: [0, 255] for led in leds},
                            "on": 100,
                            "off": 100,
                            "blink": 5,
                        },
                    ],
                },
            )
        elif request.method == "DELETE":
            rtn = requests.post(
                f"http://localhost:5173/api/ubus/{hostname}",
                json={
                    "method": "call",
                    "params": [
                        "led",
                        "set",
                        {
                            "leds": leds,
                        },
                    ],
                },
            )
    except Exception as e:
        print(e)
        abort(500)
    print(rtn)
    return {}
