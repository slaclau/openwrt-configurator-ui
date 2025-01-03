import json

import invoke.exceptions
import paramiko.ssh_exception

from openwrt_configurator_ui.configurator import device
from openwrt_configurator_ui.configurator.commands import get_commands
from openwrt_configurator_ui.configurator.device import get_board_json, get_connection
from openwrt_configurator_ui.configurator.schema.config import Device, ONCConfig
from openwrt_configurator_ui.configurator.schema.openwrt import OpenWrtState
from openwrt_configurator_ui.configurator.ubus import get_ubus_commands

PROVISION_MODE = "ssh"


def provision_onc_config(config: ONCConfig) -> tuple[bool, list[str]]:
    device_configs: list[Device] = (
        [
            device
            for device in config["devices"]
            if "enabled" not in device or device["enabled"]
        ]
        if "devices" in config
        else []
    )
    failed: list[str] = []
    for device_config in device_configs:
        try:
            state = get_state(config, device_config)
            provision_device(device_config, state)
        except RuntimeError:
            failed.append(device_config["hostname"])
        except paramiko.ssh_exception.NoValidConnectionsError:
            failed.append(device_config["hostname"])
    if len(failed) > 0:
        return False, failed
    return True, []


def get_state(config: ONCConfig, device_config: Device):
    schema = device.get_schema(device_config)
    state = device.get_state(config, device_config, schema)
    return state


def provision_device(device_config: Device, state: OpenWrtState) -> None:
    connection = get_connection(device_config)
    print(f"Provisioning {device_config["hostname"]} @ {device_config["ipaddr"]}...")
    print("Verifying...")
    board_json = get_board_json(connection)
    if board_json["model"]["id"] != device_config["model_id"]:
        raise ValueError("Model id does not match")
    print("Verified")
    if "ubus" in PROVISION_MODE:
        data = {
            "username": device_config["provisioning_config"]["ssh_auth"]["username"],
            "password": device_config["provisioning_config"]["ssh_auth"]["password"],
            "timeout": 300,
        }
        session_key = json.loads(
            connection.run(f"ubus call session login '{json.dumps(data)}'").stdout
        )["ubus_rpc_session"]
        print(session_key)
        commands = get_ubus_commands(state, session_key)
    else:
        commands = get_commands(state)

    if "print" in PROVISION_MODE:
        for command in commands:
            print(command)
    if "ssh" in PROVISION_MODE:
        for command in commands:
            print(f"Running {command}")
            try:
                rtn = connection.run(command)
                if rtn.return_code != 0:
                    print(
                        f"Command {command} failed with return code {rtn.return_code}"
                    )
                    print("Reverting")
                    rtn = connection.run(
                        "for i in $(ls /etc/config); do uci revert $i; done"
                    )
                    if rtn.return_code != 0:
                        raise RuntimeError(
                            f"Failed to revert with return code {rtn.return_code}"
                        )
                    raise RuntimeError(f"Failed to provision, reverted")
            except invoke.exceptions.UnexpectedExit as e:
                print(f"Command {command} failed with return code {e}")
                print("Reverting")
                rtn = connection.run(
                    "for i in $(ls /etc/config); do uci revert $i; done"
                )
                if rtn.return_code != 0:
                    raise RuntimeError(
                        f"Failed to revert with return code {rtn.return_code}"
                    )
                raise RuntimeError(f"Failed to provision, reverted")
        if "ubus" in PROVISION_MODE:
            print("Confirming ubus apply...")
            if session_key is None:
                command = "ubus call uci confirm '{}' && reboot"
            else:
                command = f"ubus call uci confirm '{
                    json.dumps({"ubus_rpc_session": session_key})}' && reboot"
            print(f"Running {command}")
            connection.run(command)
            print("Confirmed ubus apply")
    print("Provisioned")
