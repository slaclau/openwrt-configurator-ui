import ipaddress
from typing import Any, TypedDict

from openwrt_configurator_ui.configurator.schema.config import ProvisioningConfig
from openwrt_configurator_ui.web.db import db


class Devices(db.Model):
    __tablename__ = "devices"
    hostname = db.Column(db.String(4096), primary_key=True)
    description = db.Column(db.String(4096))
    model_id = db.Column(db.String(4096), nullable=True)
    ipaddr = db.Column(db.String(4096))
    static = db.Column(db.Integer)
    tags: db.Mapped[dict[str, str] | None] = db.mapped_column(type_=db.JSON)
    provisioning_config: db.Mapped[ProvisioningConfig | None] = db.mapped_column(
        type_=db.JSON
    )
    timestamp = db.Column(db.DateTime)
    rpc_session = db.Column(db.String(4096))

    def to_config(self):
        return {
            "hostname": self.hostname,
            "description": self.description,
            "model_id": self.model_id,
            "ipaddr": self.ipaddr,
            "static": self.static,
            "tags": self.tags,
            "provisioning_config": self.provisioning_config,
        }


class Clients(db.Model):
    __tablename__ = "clients"
    mac = db.Column(db.String(4096), primary_key=True)
    hostname = db.Column(db.String(4096))

    def to_config(self):
        return {"mac": self.mac, "hostname": self.hostname}


class Networks(db.Model):
    __tablename__ = "networks"
    key = db.Column(db.String(4), primary_key=True)
    name = db.Column(db.String(4096), nullable=False)
    vlan_id = db.Column(db.Integer, nullable=False)
    cidr = db.Column(db.String(4096))
    gateway = db.Column(db.String(4096))

    def to_config(self):
        network = ipaddress.IPv4Network(self.cidr) if self.cidr else None
        hosts = list(network.hosts()) if network else None
        return {
            "key": self.key,
            "name": self.name,
            "vlan_id": self.vlan_id,
            "cidr": self.cidr,
            "network_address": network.network_address.exploded if network else None,
            "subnet_mask": network.netmask.exploded if network else None,
            "gateway": (
                ipaddress.IPv4Address(self.gateway).exploded if self.gateway else ""
            ),
            "broadcast_address": (
                network.broadcast_address.exploded if network else None
            ),
            "usable_ips": network.num_addresses if network else None,
            "range": [hosts[0].exploded, hosts[-1].exploded] if hosts else None,
        }


class Security(TypedDict):
    encryption: str
    key: str | None


class Wireless(db.Model):
    __tablename__ = "wireless"
    key = db.Column(db.String(4), primary_key=True)
    name = db.Column(db.String(4096))
    network = db.Column(db.String(4), db.ForeignKey("networks.key"))
    security: db.Mapped[Security] = db.Column(db.JSON)

    def to_config(self):
        return {
            "key": self.key,
            "name": self.name,
            "network": self.network,
            "security": self.security,
        }


class Collectd(db.Model):
    __tablename__ = "collectd"
    primary = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.DateTime)
    interval = db.Column(db.Float)
    host_name = db.Column(db.String(4096))
    plugin_name = db.Column(db.String(4096))
    plugin_instance = db.Column(db.String(4096))
    type_name = db.Column(db.String(4096))
    type_instance = db.Column(db.String(4096))
    value: db.Mapped[dict | list | Any] = db.mapped_column(type_=db.JSON)
