import React from "react";

import Nav from "react-bootstrap/Nav";
import Tab from "react-bootstrap/Tab";

import ClickableListGroup from "../../../components/ClickableListGroup";
import ModalListGroup from "../../../components/ModalListGroup";
import { bandMap } from "../utils";

const RadioSection = ({ radio }) => {
  console.log("r", radio);
  return (
    <ClickableListGroup title={bandMap[radio.config.band]}>
      <ClickableListGroup.Item
        key="width"
        name="Channel Width"
        value={radio.config.htmode}
      />
      <ClickableListGroup.Item
        key="channel"
        name="Channel"
        value={
          radio.config.channel[0].toUpperCase() + radio.config.channel.slice(1)
        }
      />
      <ClickableListGroup.Item
        key="power"
        name="Transmit Power"
        value={radio.config.txpower ? radio.config.txpower : "Auto"}
      />
      <ClickableListGroup.Item
        key="minimum_rssi"
        name="Enable Minimum RSSI"
        value="tbc"
      />
    </ClickableListGroup>
  );
};

const NetworkSection = ({ state }) => {
  return (
    <>
      <b>Configure IP</b>
      <Tab.Container
        defaultActiveKey={state.device_config.static ? "static" : "dhcp"}
      >
        <Nav variant="pills" className="flex-row" justify>
          <Nav.Item>
            <Nav.Link eventKey="dhcp">Using DHCP</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="static">Static IP</Nav.Link>
          </Nav.Item>
        </Nav>
        <Tab.Content>
          <Tab.Pane eventKey="static">
            <ClickableListGroup>
              <ClickableListGroup.Item
                name="IP Address"
                value={state.device_config.ipaddr}
              />
              <ClickableListGroup.Item name="Subnet Mask" />
              <ClickableListGroup.Item name="Gateway" />
              <ClickableListGroup.Item name="Preferred DNS" />
              <ClickableListGroup.Item name="Alternate DNS" />
              <ClickableListGroup.Item name="DNS Suffix" />
            </ClickableListGroup>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </>
  );
};

const SettingsList = ({ state }) => {
  return (
    <ModalListGroup>
      <ModalListGroup.Item
        key="Name"
        name="Name"
        value={state.system_config?.system0?.description}
      >
        <ClickableListGroup>
          <ClickableListGroup.Item
            key="Name"
            name="Name"
            value={state.system_config?.system0?.description}
          ></ClickableListGroup.Item>
        </ClickableListGroup>
      </ModalListGroup.Item>
      <ModalListGroup.Item key="LED" name="LED">
        <ClickableListGroup>
          <ClickableListGroup.Item
            key="Enable"
            name="Enable LED"
          ></ClickableListGroup.Item>
          <ClickableListGroup.Item
            key="Color"
            name="Color"
          ></ClickableListGroup.Item>
          <ClickableListGroup.Item
            key="Brightness"
            name="Brightness"
          ></ClickableListGroup.Item>
        </ClickableListGroup>
      </ModalListGroup.Item>
      <ModalListGroup.Item key="Outdoor Mode" name="Outdoor Mode">
        <ClickableListGroup>
          <ClickableListGroup.Item
            key="site"
            name="Use Site Settings"
          ></ClickableListGroup.Item>
          <ClickableListGroup.Item key="on" name="On"></ClickableListGroup.Item>
          <ClickableListGroup.Item
            key="off"
            name="Off"
          ></ClickableListGroup.Item>
        </ClickableListGroup>
      </ModalListGroup.Item>
      <ModalListGroup.Item key="Radios" name="Radios">
        {Object.keys(state.wirelessDevices).map((radio) => (
          <RadioSection radio={state.wirelessDevices[radio]} />
        ))}
      </ModalListGroup.Item>
      <ModalListGroup.Item
        key="Network"
        name="Network"
        value={state.device_config.static ? "Static IP" : "UsingDHCP"}
      >
        <NetworkSection state={state} />
      </ModalListGroup.Item>
      <ModalListGroup.Item key="Services" name="Services">
        <ClickableListGroup>
          <ClickableListGroup.Item name="Management VLAN"></ClickableListGroup.Item>
        </ClickableListGroup>
        <b>SNMP</b>
        <ClickableListGroup>
          <ClickableListGroup.Item name="Location"></ClickableListGroup.Item>
          <ClickableListGroup.Item name="Contact"></ClickableListGroup.Item>
        </ClickableListGroup>
      </ModalListGroup.Item>
    </ModalListGroup>
  );
};

export default SettingsList;
