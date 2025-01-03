from typing import Any, NotRequired, TypedDict

from pydantic import TypeAdapter


class SSHAuth(TypedDict):
    username: str
    password: str


class ProvisioningConfig(TypedDict):
    ssh_auth: SSHAuth


class Device(TypedDict):
    enabled: NotRequired[bool]
    model_id: str
    ipaddr: str
    hostname: str
    tags: NotRequired[dict[str, str | list[str]]]
    provisioning_config: NotRequired[ProvisioningConfig]


PackageProfile = TypedDict("PackageProfile", {".if": str, "packages": list[str]})


ConfigsNotReset = TypedDict(
    "ConfigsNotReset", {".if": str, "configs": NotRequired[list[str]]}
)


class Config(TypedDict):
    system: NotRequired[dict]
    network: NotRequired[dict]
    firewall: NotRequired[dict]
    dhcp: NotRequired[dict]
    wireless: NotRequired[dict]


class ONCConfig(TypedDict):
    devices: NotRequired[list[Device]]
    package_profiles: NotRequired[list[PackageProfile]]
    configs_to_not_reset: NotRequired[list[ConfigsNotReset]]
    config: NotRequired[Config]


ONCConfigValidator = TypeAdapter(ONCConfig)
