from typing import NotRequired, TypedDict

from pydantic import TypeAdapter


class OpenWrtConfig(TypedDict):
    system: NotRequired[dict]
    network: NotRequired[dict]
    firewall: NotRequired[dict]
    dhcp: NotRequired[dict]
    wireless: NotRequired[dict]


OpenWrtConfigValidator = TypeAdapter(OpenWrtConfig)


class Package(TypedDict):
    package_name: str
    version: NotRequired[str]


class OpenWrtState(TypedDict):
    config: OpenWrtConfig
    packages_to_install: NotRequired[list[Package]]
    packages_to_remove: NotRequired[list[str]]
    config_sections_to_reset: NotRequired[dict[str, list[str]]]
