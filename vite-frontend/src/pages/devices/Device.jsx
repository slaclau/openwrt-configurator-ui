import React from "react";

import Advanced from "./advanced/Advanced.jsx";
import Basic from "./basic/Basic.jsx";
import Settings from "./settings/Settings.jsx";

import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Tab from "react-bootstrap/Tab";

import * as Icon from "react-bootstrap-icons";

import { api } from "../../api.js";

class Device extends React.Component {
  state = {
    device_config: {},
    wirelessDevices: {},
    networkDevices: {},
    networks: {},
    network_config: {},
    wireless_config: {},
    system_config: {},
    hostHints: {},
    system_info: {},
    board_info: {},
    boardJSON: {},
    assoclist: {},
    hardware: {},
    params: {},
    old: {},
  };

  componentDidMount() {
    const getDevice = () => {
      const queries = [
        {
          method: "call",
          params: ["luci-rpc", "getWirelessDevices", {}],
        },
        {
          method: "call",
          params: ["luci-rpc", "getNetworkDevices", {}],
        },
        {
          method: "call",
          params: ["network.interface", "dump", {}],
        },
        {
          method: "call",
          params: ["uci", "get", { config: "network" }],
        },
        {
          method: "call",
          params: ["uci", "get", { config: "wireless" }],
        },
        {
          method: "call",
          params: ["uci", "get", { config: "system" }],
        },
        {
          method: "call",
          params: ["luci-rpc", "getHostHints", {}],
        },
        {
          method: "call",
          params: ["system", "info", {}],
        },
        {
          method: "call",
          params: ["system", "board", {}],
        },
        {
          method: "call",
          params: ["luci-rpc", "getBoardJSON", {}],
        },
        {
          method: "call",
          params: ["controller", "assoclist", {}],
        },
        {
          method: "call",
          params: ["controller", "hardware", {}],
        },
      ];
      api.post(`/ubus/${this.props.hostname}`, queries).then((response) => {
        this.setState({
          wirelessDevices: response.data[0],
          networkDevices: response.data[1],
          networks: response.data[2],
          network_config: response.data[3].values,
          wireless_config: response.data[4].values,
          system_config: response.data[5].values,
          hostHints: response.data[6],
          system_info: response.data[7],
          board_info: response.data[8],
          boardJSON: response.data[9],
          assoclist: response.data[10],
          hardware: response.data[11],
          params: this.props.params,
          old: this.state,
        });
        console.debug("all", this.state);
      });
      api
        .get(`/configuration/devices/${this.props.hostname}`)
        .then((response) => this.setState({ device_config: response.data }));
    };
    getDevice();
    this.interval = setInterval(getDevice, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <Container>
        <Tab.Container defaultActiveKey="basic" class="my-tabs">
          <Nav variant="pills" className="flex-row" justify>
            <Nav.Item>
              <Nav.Link eventKey="basic">
                <Icon.Binoculars />
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="graphs">
                <Icon.BarChart />
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="settings">
                <Icon.Gear />
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="advanced">
                <Icon.TicketDetailed />
              </Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content>
            <Tab.Pane eventKey="basic">
              <Basic state={this.state} />
            </Tab.Pane>
            <Tab.Pane eventKey="settings">
              <Settings state={this.state} />
            </Tab.Pane>
            <Tab.Pane eventKey="advanced">
              <Advanced state={this.state} />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Container>
    );
  }
}

export default Device;
