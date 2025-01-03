from typing import Literal, NotRequired, TypedDict, Union

from pydantic import TypeAdapter


class SchemaPort(TypedDict):
    name: NotRequired[str]
    default_role: NotRequired[Union[Literal["lan"], Literal["wan"]]]
    sw_config_cpu_name: NotRequired[str]


class _SchemaRadio(TypedDict):
    name: NotRequired[str]
    path: NotRequired[str]
    type: NotRequired[Literal["mac80211"] | Literal["broadcom"] | Literal["brcm47xx"]]
    band: NotRequired[Literal["2g"] | Literal["5g"] | Literal["6g"] | Literal["60g"]]
    htmodes: NotRequired[
        list[
            Literal["HT20"]
            | Literal["HT40-"]
            | Literal["HT40+"]
            | Literal["HT40"]
            | Literal["VHT20"]
            | Literal["VHT40"]
            | Literal["VHT80"]
            | Literal["VHT160"]
            | Literal["NOHT"]
            | Literal["HE20"]
            | Literal["HE40"]
            | Literal["HE80"]
            | Literal["HE160"]
        ]
    ]


class Device(TypedDict):
    name: NotRequired[str]
    sw_config: NotRequired[bool]
    version: NotRequired[str]
    config_sections: NotRequired[dict[str, list[str]]]
    ports: NotRequired[list[SchemaPort]]
    radios: NotRequired[list[_SchemaRadio]]


DeviceSchemaValidator = TypeAdapter(Device)


class _BoardModel(TypedDict):
    id: str
    name: NotRequired[str]


class BoardPort(TypedDict):
    num: int
    role: NotRequired[Union[Literal["lan"], Literal["wan"]]]
    device: NotRequired[str]


class _BoardSwitch(TypedDict):
    enable: bool
    reset: bool
    ports: NotRequired[list[BoardPort]]


class _Network(TypedDict):
    device: NotRequired[str]
    protocol: str
    ports: NotRequired[list[str]]


class _BoardNetwork(TypedDict):
    lan: _Network
    wan: NotRequired[_Network]


class BoardJson(TypedDict):
    model: _BoardModel
    switch: NotRequired[dict[str, _BoardSwitch]]
    network: _BoardNetwork


BoardJsonValidator = TypeAdapter(BoardJson)
