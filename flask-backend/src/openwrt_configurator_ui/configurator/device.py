import json
import re

import paramiko.auth_strategy
from fabric import Connection, config

from openwrt_configurator_ui.configurator.schema.config import Config
from openwrt_configurator_ui.configurator.schema.config import Device as ConfigDevice
from openwrt_configurator_ui.configurator.schema.config import ONCConfig
from openwrt_configurator_ui.configurator.schema.device import (
    BoardJson,
    BoardJsonValidator,
)
from openwrt_configurator_ui.configurator.schema.device import Device as DeviceSchema
from openwrt_configurator_ui.configurator.schema.device import (
    DeviceSchemaValidator,
    SchemaPort,
)
from openwrt_configurator_ui.configurator.schema.openwrt import (
    OpenWrtConfig,
    OpenWrtState,
)


def get_state(
    config: ONCConfig, device_config: ConfigDevice, schema: DeviceSchema
) -> OpenWrtState:
    openwrt_config = get_openwrt_config(config, device_config, schema)

    try:
        packages = [
            package
            for package_profile in config["package_profiles"]
            for package in package_profile["packages"]
            if _condition_matches(package_profile.get(".if", ""), device_config, schema)
        ]
    except KeyError:
        packages = []

    packages_to_install = [
        {
            "package_name": package.split("@")[0],
            "version": (package.split("@")[1] if len(package.split("@")) > 1 else ""),
        }
        for package in packages
        if not package.startswith("-")
    ]
    packages_to_install = [
        (
            {"package_name": package["package_name"]}
            if package["version"] == ""
            else package
        )
        for package in packages_to_install
    ]
    packages_to_remove = [
        package[1:] for package in packages if package.startswith("-")
    ]

    config_sections = schema["config_sections"] if "config_sections" in schema else {}

    _to_not_reset = (
        config["configs_to_not_reset"] if "configs_to_not_reset" in config else []
    )
    config_sections_to_not_reset = [
        config_section
        for group in _to_not_reset
        for config_section in group["configs"]
        if _condition_matches(group.get(".if", ""), device_config, schema)
    ]
    config_sections_to_reset: dict[str, list[str]] = {}
    for config_key in config_sections:
        if f"{config_key}.*" in config_sections_to_not_reset:
            continue
        section_keys = [
            section_key
            for section_key in config_sections[config_key]
            if not f"{config_key}.{section_key}" in config_sections_to_not_reset
        ]
        if config_key not in config_sections_to_reset:
            config_sections_to_reset[config_key] = []
        config_sections_to_reset[config_key] += section_keys

    return {
        "config": openwrt_config,
        "packages_to_install": packages_to_install,
        "packages_to_remove": packages_to_remove,
        "config_sections_to_reset": config_sections_to_reset,
    }


def get_openwrt_config(
    config: ONCConfig, device_config: ConfigDevice, schema: DeviceSchema
) -> OpenWrtConfig:
    sw_config = schema["sw_config"]
    ports = schema.get("ports", [])
    try:
        cpu_port = [port for port in ports if "sw_config_cpu_name" in port][0]
    except IndexError:
        cpu_port = None
    physical_ports = ports.copy()
    if cpu_port in ports:
        physical_ports.remove(cpu_port)

    resolved_config = resolve_config(device_config, schema, config)
    bridged_devices = [
        port
        for device in resolved_config.get("network", {}).get("device", [])
        for port in device
    ]

    interfaced_devices = [
        interface["device"]
        for interface in resolved_config.get("network", {}).get("interface", [])
        if "device" in interface
    ]

    used_devices = bridged_devices + interfaced_devices

    unused_physical_ports = [
        port for port in physical_ports if port["name"] not in used_devices
    ]

    sw_config_untagged_ports = [
        port
        for switch_vlan in resolved_config.get("network", {}).get("switch_vlan", [])
        for port in switch_vlan
        if len(port.split(":")) == 1 or "t" not in port.split(":")[1]
    ]

    sw_config_ports_can_be_untagged = [
        port for port in physical_ports if port["name"] not in sw_config_untagged_ports
    ]

    def get_device_ports(device_name: str) -> list[str]:
        try:
            device_section = [
                device
                for device in resolved_config.get("network", {}).get("device", [])
                if device["name"] == device_name
            ][0]
        except IndexError as e:
            return []
        if isinstance(device_section.get("ports", []), list):
            ports = device_section.get("ports", [])
        elif device_section.get("ports") == "*":
            ports = [port["name"] for port in unused_physical_ports]
        else:
            ports = []

        rtn = [
            (
                port
                if not port.startswith("@cpu_port")
                else f"{cpu_port["sw_config_cpu_name"]}{"." + port.split(".")[1] if len(port.split(".")) > 1 else ""}"
            )
            for port in ports
        ]
        return rtn

    def sanitize_name(name: str) -> str:
        return re.sub(r"[^0-9a-z]", "", name)

    openwrt_config: OpenWrtConfig = {}

    for config_key, _config in resolved_config.items():
        config = {}
        if config_key == "wireless":
            continue
        for section_key, _sections in _config.items():
            sections = []
            i = 0
            for _section in _sections:
                section = _section.copy()
                default_name = sanitize_name(f"{section_key}{i}")
                i += 1
                name = section.get(".name", default_name)
                section[".name"] = name

                if config_key == "system" and section_key == "system":
                    section["hostname"] = device_config["hostname"]
                    section["description"] = device_config["description"]
                elif config_key == "network" and section_key == "device":
                    new_ports = get_device_ports(section["name"])
                    section["ports"] = new_ports
                elif (
                    not sw_config
                    and config_key == "network"
                    and section_key == "bridge-vlan"
                ):
                    if section["ports"] == "*":
                        section["ports"] = get_device_ports(section["device"])
                    elif section["ports"] == "*t":
                        section["ports"] = [
                            f"{port}:t" for port in get_device_ports(section["device"])
                        ]
                    elif isinstance(section["ports"], str):
                        section["ports"] = []
                elif (
                    sw_config
                    and config_key == "network"
                    and section_key == "switch_vlan"
                ):
                    assert cpu_port is not None
                    _ports = [f"{cpu_port["name"]}:t"]
                    if isinstance(section["ports"], str) and section[
                        "ports"
                    ].startswith("*"):
                        _ports += [
                            f"{port["name"]}{":t" if "t" in section["ports"] else ""}"
                            for port in sw_config_ports_can_be_untagged
                        ]
                    else:
                        _ports += section["ports"]

                    section["ports"] = " ".join(
                        [port.replace("eth", "").replace(":", "") for port in _ports]
                    )

                sections.append(section)

            config[section_key] = sections

        openwrt_config[config_key] = config

    default_channels = {
        "2g": 11,
        "5g": 36,
        "6g": 36,
        "60g": 36,
    }

    radios = schema.get("radios", [])

    radios_and_devices = []
    for radio in radios:
        devices = [
            device
            for device in resolved_config.get("wireless", {}).get("wifi-device", [])
            if device["band"] == radio["band"]
        ]
        if len(devices) > 0:
            radios_and_devices.append(
                (
                    radio,
                    devices[0],
                )
            )

    wifi_devices: list[dict[str, str]] = []
    i = 0
    for radio, device in radios_and_devices:
        default_name = sanitize_name(f"wifidevice{i}")
        i += 1
        name = device.get(".name", default_name)
        wifi_devices.append(
            {
                **device,
                ".name": name,
                "channel": device.get("channel", default_channels[radio["band"]]),
                "type": radio["type"],
                "band": radio["band"],
                "path": radio["path"],
            }
        )

    wifi_interfaces: list[dict[str, str]] = []
    i = 0
    for interface in resolved_config.get("wireless", {}).get("wifi-iface", []):
        radio_device_names = [device[".name"] for device in wifi_devices]
        if isinstance(interface.get("device", "*"), str):
            devices = (
                radio_device_names
                if interface["device"] == "*"
                else [interface["device"]]
            )
        else:
            devices = interface["device"]

        j = 0
        for device in devices:
            wifi_interfaces.append(
                {
                    ".name": f"wifinet{i}{j}",
                    **interface,
                    "device": device,
                }
            )
            j += 1
        i += 1

    if len(radios) > 0:
        openwrt_config["wireless"] = {
            "wifi-device": wifi_devices,
            "wifi-iface": wifi_interfaces,
        }

    return openwrt_config


def resolve_config(
    device_config: ConfigDevice, schema: DeviceSchema, config: ONCConfig
) -> Config:

    resolved_config: Config = {}

    def resolve(config_or_section):
        condition = config_or_section.get(".if", None)
        matches = _condition_matches(condition, device_config, schema)
        if not matches:
            return {}
        __overrides = config_or_section.get(".overrides", [])
        _overrides = [
            override["override"]
            for override in __overrides
            if _condition_matches(override.get(".if", ""), device_config, schema)
        ]
        overrides = {k: v for override in _overrides for k, v in override.items()}

        rtn = {**config_or_section, **overrides}
        rtn = {k: v for k, v in rtn.items() if k not in [".if", ".overrides"]}
        return rtn

    for config_key, _config in config["config"].items():
        _config = resolve(_config)
        resolved = {}
        for section_key, sections in _config.items():
            resolved_sections = [resolve(section) for section in sections]
            resolved_sections = [
                section for section in resolved_sections if len(section) > 0
            ]
            resolved[section_key] = resolved_sections
        resolved_config[config_key] = resolved

    return resolved_config


def _condition_matches(
    condition: str | None, device_config: ConfigDevice, schema: DeviceSchema
) -> bool:
    if condition in ["", "*"]:
        return True
    if condition is None:
        return True

    mapping = {
        "device.sw_config": schema["sw_config"],
        "device.hostname": device_config["hostname"],
        "device.ipaddr": device_config["ipaddr"],
        "device.model_id": device_config["model_id"],
        "device.version": schema["version"],
        "true": True,
        "false": False,
    }
    for k, v in mapping.items():
        condition = condition.replace(k, str(v))
    for tag in device_config.get("tags", []):
        condition = condition.replace(
            f"device.tag.{tag}", f"'{device_config["tags"][tag]}'"
        )

    if "==" in condition:
        sides = condition.split("==")
        lhs = sides[0].strip()
        rhs = sides[1].strip()
        rtn = lhs == rhs
    elif "!=" in condition:
        sides = condition.split("!=")
        lhs = sides[0].strip()
        rhs = sides[1].strip()
        rtn = lhs != rhs
    else:
        raise ValueError(f"Invalid condition {condition}")
    return rtn


def get_connection(device: ConfigDevice) -> Connection:
    if device.get("provisioning_config", None) is not None:
        password = device["provisioning_config"]["ssh_auth"]["password"]
        connect_kwargs = (
            {
                "auth_strategy": paramiko.auth_strategy.NoneAuth(
                    device["provisioning_config"]["ssh_auth"]["username"]
                )
            }
            if password == ""
            else {"password": password}
        )
        connection = Connection(
            device["ipaddr"],
            user=device["provisioning_config"]["ssh_auth"]["username"],
            connect_kwargs=connect_kwargs,
            config=config.Config(overrides={"run": {"hide": True}}),
        )
    else:
        connection = Connection(
            device["ipaddr"], user="root", connect_kwargs={"look_for_keys": False}
        )

    return connection


def get_schema(device: ConfigDevice) -> DeviceSchema:
    connection = get_connection(device)

    board_json, radios, config_sections, version = (
        get_board_json(connection),
        get_radios(connection),
        get_config_sections(connection),
        get_device_version(connection),
    )

    sw_config = True if "switch" in board_json else False
    ports: list[SchemaPort] = []
    if sw_config:
        for port in board_json["switch"]["switch0"]["ports"]:
            ports.append(
                {
                    "name": f"eth{port["num"]}",
                    "default_role": port["role"],
                    "sw_config_cpu_name": port["device"],
                }
            )
    else:
        if "ports" in board_json["network"]["lan"]:
            for _port in board_json["network"]["lan"]["ports"]:
                ports.append({"name": _port, "default_role": "lan"})
        if "wan" in board_json and "ports" in board_json["network"]["wan"]:
            for _port in board_json["network"]["lan"]["ports"]:
                ports.append({"name": _port, "default_role": "wan"})
        if "wan" in board_json and "device" in board_json["network"]["wan"]:
            ports.append(
                {"name": board_json["network"]["wan"]["device"], "default_role": "wan"}
            )

    if not ports:
        if True:
            ports = [{"name": "eth0", "default_role": "lan"}]
        else:
            raise RuntimeError(
                f"Found no ports for {device["model_id"]} at {device["ipaddr"]}. Expected at least one port."
            )

    device_schema: DeviceSchema = {
        "name": device["model_id"],
        "version": version,
        "sw_config": sw_config,
        "config_sections": config_sections,
        "ports": ports,
    }

    if len(radios) > 0:
        device_schema["radios"] = [
            {
                "name": radio[".name"],
                "type": radio["type"],
                "path": radio["path"],
                "band": radio["band"],
            }
            for radio in radios.values()
        ]

    if not DeviceSchemaValidator.validate_python(device_schema):
        raise RuntimeError

    if sw_config:
        try:
            cpu_port = [port for port in ports if port["sw_config_cpu_name"]][0]
        except IndexError as e:
            raise RuntimeError(
                f"Found no CPU port for swConfig device {device["model_id"]} at {device["ipaddr"]}. Expected at least one CPU port."
            ) from e

    return device_schema


def get_board_json(connection: Connection) -> BoardJson:
    board_json_loc = "/etc/board.json"
    rtn = connection.run(f"cat {board_json_loc}").stdout
    if BoardJsonValidator.validate_json(rtn):
        return json.loads(rtn)
    raise ValueError


def get_radios(connection: Connection):
    radio_status = connection.run(
        """ubus call uci get '{"config": "wireless", "type": "wifi-device"}'"""
    )
    if not radio_status.stdout or radio_status.return_code != 0:
        if radio_status.stderr in [
            "Command failed: Not found",
            """Command failed: ubus call uci get {"config": "wireless", "type": "wifi-device"} (Not found)""",
        ]:
            return []
        else:
            raise RuntimeError(radio_status.stderr)
    return json.loads(radio_status.stdout)["values"]


def _parse_sections(config_string: str) -> dict[str, list[str]]:
    config_lines = config_string.split("\n")
    parsed_lines = [
        " ".join(line.replace("\t", "").split(" ")[0:2])
        for line in config_lines
        if line.replace("\t", "").startswith("package")
        or line.replace("\t", "").startswith("config")
    ]

    config = ""
    sections: dict[str, list[str]] = {}

    for line in parsed_lines:
        type, name = line.split(" ")
        if type == "package":
            config = name
            if config not in sections:
                sections[config] = []
        elif type == "config":
            sections[config].append(name)
        else:
            raise RuntimeError

    return sections


def get_config_sections(connection: Connection):
    command = connection.run("uci export")
    if not command.stdout or command.return_code != 0:
        raise RuntimeError(command.stderr)

    config_string = command.stdout
    config_sections = _parse_sections(config_string)
    return config_sections


def get_device_version(connection: Connection):
    version_result = connection.run("cat /etc/openwrt_release")
    lines = version_result.stdout.split("\n")
    distrib_release_line = [
        line for line in lines if line.startswith("DISTRIB_RELEASE")
    ][0]
    if not distrib_release_line:
        raise RuntimeError("Failed to determine device version in /etc/openwrt_release")
    return distrib_release_line.split("=")[1].replace("'", "")
