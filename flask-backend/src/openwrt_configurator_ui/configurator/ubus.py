import json

from openwrt_configurator_ui.configurator.schema.openwrt import (
    OpenWrtConfig,
    OpenWrtState,
)


def get_ubus_commands(state: OpenWrtState, session_key: str | None = None) -> list[str]:
    commands = []
    if len(state["packages_to_remove"]) > 0:
        commands.append(
            f"opkg remove --force-removal-of-dependent-packages {" ".join(state["packages_to_remove"])}"
        )

    if len(state["packages_to_install"]) > 0:
        commands.append("opkg update")
        commands.append(
            f"opkg install {" ".join([package["package_name"] for package in state["packages_to_install"]])}"
        )
    sections = {
        f"{config_key}.@{section_key}"
        for config_key, sections in state["config_sections_to_reset"].items()
        for section_key in sections
    }
    for section in sections:
        commands.append(f"while uci -q delete {section}[0]; do :; done")

    uci_commands = _get_uci_commands(state["config"], session_key)

    return commands + uci_commands


def _get_uci_commands(
    config: OpenWrtConfig, session_key: str | None = None
) -> list[str]:
    commands: list[str] = []
    for config_key, _config in config.items():
        for section_key, sections in _config.items():
            for section in sections:
                data = {
                    "config": config_key,
                    "type": section_key,
                    "name": section[".name"],
                }

                if session_key is not None:
                    data["rpc_session_key"] = session_key
                commands.append(f"ubus call uci add '{json.dumps(data)}'")
                values = {k: v for k, v in section.items() if k != ".name"}
                data = {
                    "config": config_key,
                    "section": section[".name"],
                    "values": values,
                }
                if session_key is not None:
                    data["ubus_rpc_session"] = session_key
                commands.append(f"ubus call uci set '{json.dumps(data)}'")

    data = {"rollback": True, "timeout": 30}
    if session_key is not None:
        data["ubus_rpc_session"] = session_key

    commands.append(f"ubus call uci apply '{json.dumps(data)}'")

    return commands
