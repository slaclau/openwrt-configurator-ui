import React from "react";

import * as Icon from "react-bootstrap-icons";

import ClickableListGroup from "../../components/ClickableListGroup";
import ModalListGroup from "../../components/ModalListGroup";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";

import { api } from "../../api.js";

class WiFiSection extends React.Component {
  state = {
    show: "",
    header: "",
    changed: false,
    wifis: [],
    provisioning: false,
  };

  componentDidMount() {
    this.setState({ wifis: this.props.wifis });
  }

  WiFiItem = (wifi) => {
    return (
      <ClickableListGroup.Item
        key={wifi.name}
        name={wifi.name}
        onClick={() => this.setState({ show: wifi.name })}
      >
        tbc
      </ClickableListGroup.Item>
    );
  };
  onChange = () => this.setState({ changed: true });

  onSubmit = (e, key) => {
    e.preventDefault();
    const config = Array.from(e.target.elements).reduce((acc, el) => {
      acc[el.name] = el.value;
      return acc;
    }, {});

    const submission = {
      key: key,
      name: config.Name,
      network: "lan",
      security: { encryption: "psk2", key: config.Password },
    };

    api
      .put(`/configuration/wireless/${key}`, submission)
      .then((response) => console.log(response))
      .then(() => {
        api
          .get("/configuration/wireless")
          .then((response) => {
            this.setState({ wifis: response.data });
            this.setState({ provisioning: true });
          })
          .then(() =>
            api
              .get("/provision")
              .then(() => this.setState({ provisioning: false }))
          );
      })
      .then(() => this.setState({ show: "" }));
  };

  render() {
    if (this.state.provisioning)
      return (
        <Card className="d-flex align-items-center">
          <div>Provisioning</div>
          <div>
            <Spinner type="border"></Spinner>
          </div>
        </Card>
      );
    if (this.state.show === "") {
      return (
        <>
          <div className="d-flex justify-content-end">
            <Button
              variant="light"
              onClick={() => this.setState({ show: " " })}
            >
              Add New
            </Button>
          </div>
          <ClickableListGroup>
            {this.state.wifis.map((wifi) => this.WiFiItem(wifi))}
          </ClickableListGroup>
        </>
      );
    } else {
      var wifi = this.state.wifis.find((val) => val.name == this.state.show);
      if (!wifi) wifi = {};
      console.log("disabled", !this.state.changed);
      return (
        <Form onSubmit={(e) => this.onSubmit(e, wifi.key)}>
          <div className="d-flex justify-content-between">
            <Button variant="light" onClick={() => this.setState({ show: "" })}>
              Cancel
            </Button>
            <Button
              variant="light"
              disabled={!this.state.changed}
              type="submit"
            >
              Save
            </Button>
          </div>
          <ClickableListGroup>
            <ClickableListGroup.Item
              name="Name"
              key="name"
              value={wifi.name}
              editable
              onChange={this.onChange}
            />
            <ClickableListGroup.Item
              name="Password"
              key="password"
              value={wifi.security?.key}
              editable
              password
              onChange={this.onChange}
            />
          </ClickableListGroup>
          <ClickableListGroup>
            <ClickableListGroup.Item
              name="Network"
              key="network"
              value={
                this.props.networks.find((val) => val.key == wifi.network)?.name
              }
              onChange={this.onChange}
            />
            <ClickableListGroup.Item
              name="Broadcasting APs"
              key="broadcasting"
              value="tbc"
              onChange={this.onChange}
            />
          </ClickableListGroup>
          <ClickableListGroup>
            <ClickableListGroup.Item name="Pause" nameClass="text-primary" />
            <ClickableListGroup.Item name="Remove" nameClass="text-danger" />
          </ClickableListGroup>
          <b>Advanced</b>
          <ClickableListGroup>
            <ClickableListGroup.Item
              name="Private Pre-Shared Keys"
              bool
              onChange={this.onChange}
            />
            <ClickableListGroup.Item
              name="Hotspot Portal"
              bool
              onChange={this.onChange}
            />
          </ClickableListGroup>
          <ClickableListGroup>
            <ClickableListGroup.Item
              name="WiFi Band"
              bool
              onChange={this.onChange}
            />
            <ClickableListGroup.Item
              name="Band Steering"
              bool
              onChange={this.onChange}
            />
            <ClickableListGroup.Item
              name="Hide WiFi Name"
              bool
              onChange={this.onChange}
            />
            <ClickableListGroup.Item
              name="Client Device Isolation"
              bool
              onChange={this.onChange}
            />
            <ClickableListGroup.Item
              name="Proxy ARP"
              bool
              onChange={this.onChange}
            />
            <ClickableListGroup.Item
              name="BSS Transition"
              bool
              onChange={this.onChange}
            />
            <ClickableListGroup.Item
              name="UAPSD"
              bool
              onChange={this.onChange}
            />
            <ClickableListGroup.Item
              name="Fast Roaming"
              bool
              onChange={this.onChange}
            />
            <ClickableListGroup.Item name="WiFi Speed Limit" />
            <ClickableListGroup.Item
              name="Multicast Enhancement"
              bool
              onChange={this.onChange}
            />
            <ClickableListGroup.Item name="Multicast and Broadcast Control" />
            <ClickableListGroup.Item name="802.11 DTIM Period" />
            <ClickableListGroup.Item name="Minimum Data Rate Control" />
            <ClickableListGroup.Item name="MAC Address Filter" />
            <ClickableListGroup.Item name="RADIUS MAC Authentication" />
            <ClickableListGroup.Item name="Security" />
          </ClickableListGroup>
          <ClickableListGroup>
            <ClickableListGroup.Item name="WiFi Scheduler" />
          </ClickableListGroup>
        </Form>
      );
    }
  }
}

class NetworkSection extends React.Component {
  state = { show: "", networks: [], changed: false, provisioning: false };

  componentDidMount() {
    this.setState({ networks: this.props.networks });
  }

  NetworkItem = (network) => {
    return (
      <ClickableListGroup.Item
        name={network.name}
        subtitle={network.cidr}
        onClick={() => this.setState({ show: network.key })}
      >
        tbc
      </ClickableListGroup.Item>
    );
  };

  onChange = () => this.setState({ changed: true });

  onSubmit = (e, key) => {
    e.preventDefault();
    const config = Array.from(e.target.elements).reduce((acc, el) => {
      acc[el.name] = el.value;
      return acc;
    }, {});

    const submission = {
      key: key,
      name: config.Name,
      vlan_id: config["VLAN ID"],
    };

    api
      .put(`/configuration/networks/${key}`, submission)
      .then((response) => console.log(response))
      .then(() => {
        api
          .get("/configuration/networks")
          .then((response) => {
            this.setState({ networks: response.data });
            this.setState({ provisioning: true });
          })
          .then(() =>
            api
              .get("/provision")
              .then(() => this.setState({ provisioning: false }))
          );
      })
      .then(() => this.setState({ show: "" }));
  };

  render() {
    if (this.state.provisioning)
      return (
        <Card className="d-flex align-items-center">
          <div>Provisioning</div>
          <div>
            <Spinner type="border"></Spinner>
          </div>
        </Card>
      );
    if (this.state.show === "") {
      return (
        <>
          <div className="d-flex justify-content-end">
            <Button variant="light">Add New</Button>
          </div>
          <ClickableListGroup>
            {this.state.networks.map((network) => this.NetworkItem(network))}
          </ClickableListGroup>
        </>
      );
    } else {
      const network = this.state.networks.find(
        (val) => val.key == this.state.show
      );
      return (
        <Form onSubmit={(e) => this.onSubmit(e, network.key)}>
          <div className="d-flex justify-content-between">
            <Button variant="light" onClick={() => this.setState({ show: "" })}>
              Cancel
            </Button>
            <Button
              variant="light"
              type="submit"
              disabled={!this.state.changed}
            >
              Save
            </Button>
          </div>
          <ClickableListGroup>
            <ClickableListGroup.Item
              key="name"
              name="Name"
              value={network.name}
              editable
              onChange={this.onChange}
            />
            <ClickableListGroup.Item key="router" name="Router">
              tbc
            </ClickableListGroup.Item>
            <ClickableListGroup.Item key="cidr" name="Gateway IP/Subnet">
              tbc
            </ClickableListGroup.Item>
          </ClickableListGroup>
          <ClickableListGroup>
            <ClickableListGroup.Item
              key="gateway"
              name="Gateway IP"
              value={network.gateway}
            />
            <ClickableListGroup.Item
              key="broadcast"
              name="Broadcast IP"
              value={network.broadcast_address}
            />
            <ClickableListGroup.Item
              key="nips"
              name="Usable IPs"
              value={network.usable_ips}
            />
            <ClickableListGroup.Item
              key="ips"
              name="IP Range"
              value={network.range[0] + " - " + network.range[1]}
            />
            <ClickableListGroup.Item
              key="subnetmask"
              name="Subnet Mask"
              value={network.subnet_mask}
            />
          </ClickableListGroup>
          <ClickableListGroup>
            <ClickableListGroup.Item
              key="pause"
              name="Pause"
              nameClass="text-primary"
            />
            <ClickableListGroup.Item
              key="remove"
              name="Remove"
              nameClass="text-danger"
            />
          </ClickableListGroup>
          <b>Advanced</b>
          <ClickableListGroup>
            <ClickableListGroup.Item
              key="vlan"
              name="VLAN ID"
              value={network.vlan_id}
              editable
              onChange={this.onChange}
            />
            <ClickableListGroup.Item key="guest" name="Guest Network" bool />
            <ClickableListGroup.Item
              key="inet"
              name="Allow Internet Access"
              bool
              onChange={this.onChange}
            />
            <ClickableListGroup.Item
              key="snooping"
              name="IGMP Snooping"
              bool
              onChange={this.onChange}
            />
            <ClickableListGroup.Item
              key="mdns"
              name="Multicast DNS"
              bool
              onChange={this.onChange}
            />
          </ClickableListGroup>
          <ClickableListGroup>
            <ClickableListGroup.Item key="dhcp" name="DHCP">
              tbc
            </ClickableListGroup.Item>
          </ClickableListGroup>
        </Form>
      );
    }
  }
}

class BasicSettings extends React.Component {
  state = {
    wifis: [],
    networks: [],
    showWifi: "",
  };

  componentDidMount = () => {
    api.get("/configuration/wireless").then((response) => {
      this.setState({ wifis: response.data });
      console.log("wifis", this.state.wifis);
    });
    api.get("/configuration/networks").then((response) => {
      this.setState({ networks: response.data });
      console.log("networks", this.state.networks);
    });
  };

  render() {
    return (
      <ModalListGroup>
        <ModalListGroup.Item
          key="wifi"
          name={
            <>
              <Icon.Wifi /> WiFi
            </>
          }
        >
          <WiFiSection
            wifis={this.state.wifis}
            networks={this.state.networks}
          />
        </ModalListGroup.Item>
        <ModalListGroup.Item
          key="networks"
          name={
            <>
              <Icon.Diagram3 /> Networks
            </>
          }
        >
          <NetworkSection networks={this.state.networks} />
        </ModalListGroup.Item>
        <ModalListGroup.Item
          key="internet"
          name={
            <>
              <Icon.Globe /> Internet
            </>
          }
          disabled
        ></ModalListGroup.Item>
      </ModalListGroup>
    );
  }
}

export default BasicSettings;
