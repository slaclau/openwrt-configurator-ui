import React from "react";

import Masonry from "@mui/lab/Masonry";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";

import Interfaces from "./Interfaces.jsx";
import NetworkDevices from "./NetworkDevices.jsx";
import WiFi from "./WiFi.jsx";
import Stations from "./Stations.jsx";

const Advanced = ({ state }) => {
  const networks = state.networks;
  const devices = state.networkDevices;
  const wirelessDevices = state.wirelessDevices;
  const network_config = state.network_config;
  const wireless_config = state.wireless_config;
  return (
    <Tab.Container defaultActiveKey="wifi">
      <Nav variant="pills" className="flex-row" justify>
        <Nav.Item>
          <Nav.Link eventKey="wifi">WiFi</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="stations">Stations</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="interfaces">Interfaces</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="devices">Devices</Nav.Link>
        </Nav.Item>
      </Nav>
      <Tab.Content>
        <Tab.Pane eventKey="wifi">
          <WiFi state={state} />
        </Tab.Pane>
        <Tab.Pane eventKey="stations">
          <Stations state={state} />
        </Tab.Pane>
        <Tab.Pane eventKey="interfaces">
          <Interfaces state={state} />
        </Tab.Pane>
        <Tab.Pane eventKey="devices">
          <NetworkDevices state={state} />
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  );
};

export default Advanced;
