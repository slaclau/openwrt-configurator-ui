from openwrt_configurator_ui.configurator.schema.openwrt import (
    OpenWrtConfig,
    OpenWrtState,
)


def get_commands(state: OpenWrtState) -> list[str]:
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

    uci_commands = get_uci_commands(state["config"])

    return commands + uci_commands + ["uci commit", "reload_config", "wifi up"]


def get_uci_commands(config: OpenWrtConfig) -> list[str]:
    commands: list[str] = []
    for config_key, _config in config.items():
        for section_key, sections in _config.items():
            for section in sections:
                identifier = f"{config_key}.{section[".name"]}"
                commands.append(f"uci set {identifier}={section_key}")
                for k, v in section.items():
                    if k == ".name":
                        continue
                    if isinstance(v, list):
                        for l in v:
                            l = l if not isinstance(l, bool) else 1 if l else 0
                            commands.append(f"uci add_list {identifier}.{k}='{l}'")
                    else:
                        v = v if not isinstance(v, bool) else 1 if v else 0
                        commands.append(f"uci set {identifier}.{k}='{v}'")

    return commands
