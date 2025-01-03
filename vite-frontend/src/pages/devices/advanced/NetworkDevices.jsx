import React from "react";

import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";

const renderDevice = (device, devices) => {
  var type;
  switch (devices?.[device].devtype) {
    case "ethernet":
      type = "Network device";
      break;
    case "wlan":
      type = "Wireless adapter";
      break;
    case "bridge":
      type = "Bridge device";
      break;
    case "vlan":
      type = "VLAN (802.1q)";
      break;
  }
  return (
    <ListGroup.Item
      as="li"
      key={device}
      className="d-flex justify-content-between align-items-start"
    >
      <div className="ms-2 me-auto">
        <div>
          <b>Device: </b>
          {device}
        </div>
        <div>
          <b>Type: </b>
          {type}
        </div>
        <div>
          <b>MAC: </b>
          {devices?.[device].mac}
        </div>
        <div>
          <b>MTU: </b>
          {devices?.[device].mtu}
        </div>
      </div>
    </ListGroup.Item>
  );
};

const renderDevices = ({ state }) => {
  const devices = state.networkDevices;
  const deviceItems = [];
  {
    for (var device in devices)
      if (device !== "lo") deviceItems.push(renderDevice(device, devices));
  }
  return (
    <Card>
      <ListGroup as="ul" variant="flush">
        {deviceItems}
      </ListGroup>
    </Card>
  );
};

export default renderDevices;
