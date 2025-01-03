import React from "react";

import Badge from "react-bootstrap/Badge";
import ListGroup from "react-bootstrap/ListGroup";
import Card from "react-bootstrap/Card";

import { formatTime } from "../utils.jsx";

class Interface {
  constructor(iface, networks, devices, network_config) {
    this.interface = iface.interface;
    this.proto = iface.proto;
    switch (iface.proto) {
      case "static":
        this.proto_name = "Static address";
        break;
      case "dhcp":
        this.proto_name = "DHCP client";
        break;
      default:
        this.proto_name = this.proto;
    }
    this.up = iface.up;
    this.uptime = iface.uptime;
    this.parent = iface?.["l3-device"] || iface?.device;
    this.dev = devices[this.parent];
    this.mac = this.dev?.mac;
    this.rxbytes = this.dev?.stats?.rx_bytes || 0;
    this.rxpackets = this.dev?.stats?.rx_packets || 0;
    this.txbytes = this.dev?.stats?.tx_bytes || 0;
    this.txpackets = this.dev?.stats?.tx_packets || 0;
    this.ip4 = iface?.["ipv4-address"];
  }
}

class RelayInterface extends Interface {
  constructor(iface, networks, devices, network_config) {
    super(iface, networks, devices, network_config);
    this.proto = "relayd";
    this.proto_name = `Relay bridge (${network_config?.[iface.interface]?.network.join(", ")})`;
    const network_interfaces = network_config?.[iface.interface]?.network.map(
      (_iface) => networks?.interface.find((val) => val.interface == _iface),
    );
    this.up = network_interfaces.map((val) => val.up).every((val) => val);
    this.uptime = Math.max.apply(
      Math,
      network_interfaces.map((val) => val.uptime),
    );
    const interface0 = MakeInterface(
      network_interfaces[0],
      networks,
      devices,
      network_config,
    );
  }
}

const protoHandlerMap = { relay: RelayInterface };

const MakeInterface = (iface, networks, devices, network_config) => {
  var proto;
  if (iface?.proto == "none") {
    proto = network_config?.[iface?.interface]?.proto;
  } else {
    proto = iface?.proto;
  }
  var parsedInterface;
  if (proto in protoHandlerMap) {
    parsedInterface = new protoHandlerMap[proto](
      iface,
      networks,
      devices,
      network_config,
    );
  } else {
    parsedInterface = new Interface(iface, networks, devices, network_config);
  }
  return parsedInterface;
};

const renderInterface = (iface, networks, devices, network_config) => {
  const parsedInterface = MakeInterface(
    iface,
    networks,
    devices,
    network_config,
  );
  return (
    <ListGroup.Item
      as="li"
      key={parsedInterface?.interface}
      className="d-flex justify-content-between align-items-start"
    >
      <div className="ms-2 me-auto">
        <div>
          <b>Interface:</b> {parsedInterface?.interface}
        </div>
        <div>
          <b>Protocol:</b> {parsedInterface?.proto_name}
        </div>
        {parsedInterface.parent ? (
          <div>
            <b>Device:</b> {parsedInterface.parent}
          </div>
        ) : (
          ""
        )}
        {parsedInterface.mac ? (
          <div>
            <b>MAC:</b> {parsedInterface.mac}
          </div>
        ) : (
          ""
        )}
        <div>
          <b>RX:</b> {parsedInterface.rxbytes / 1000000} MB (
          {parsedInterface.rxpackets} Pkts)
        </div>
        <div>
          <b>TX:</b> {parsedInterface.txbytes / 1000000} MB (
          {parsedInterface.txpackets} Pkts)
        </div>
        {parsedInterface.ip4 ? (
          <div>
            <b>IPV4:</b>{" "}
            {parsedInterface.ip4.map((val) => `${val.address}/${val.mask}`)}
          </div>
        ) : (
          ""
        )}
      </div>
      <Badge pill bg={parsedInterface?.up ? "success" : "secondary"}>
        {parsedInterface?.up ? formatTime(parsedInterface?.uptime) : "Down"}
      </Badge>
    </ListGroup.Item>
  );
};

export const renderInterfaces = ({ state }) => {
  const networks = state.networks,
    devices = state.networkDevices,
    network_config = state.network_config;
  var interfaces = networks?.interface;
  if (interfaces) {
    interfaces = interfaces.map((val, index) => {
      if (val.interface !== "loopback")
        return renderInterface(val, networks, devices, network_config);
    });
  }
  return (
    <Card>
      <ListGroup as="ul" variant="flush">
        {interfaces}
      </ListGroup>
    </Card>
  );
};

export default renderInterfaces;
