import React from "react";

import Nav from "react-bootstrap/Nav";
import Table from "react-bootstrap/Table";

import io from "socket.io-client";

import Device from "./Device";

class Devices extends React.Component {
  state = {
    body: "",
    devices: [],
  };

  componentWillUnmount() {
    this.socket.close();
    clearInterval(this.interval);
  }

  componentDidMount() {
    console.debug("Mounted Devices Component", this);
    this.socket = io.connect("http://" + location.host, {
      reconnection: true,
    });
    console.debug("Created socket", this.socket);
    this.socket.send("status_request");
    console.debug("Requested status from ws");
    this.socket.on("status", (message) => {
      this.setState({ devices: message });
      console.debug("Received from ws", message);
    });

    function query(socket) {
      socket.send("status_request");
      console.debug("Requested status from ws after 5s");
    }
    this.interval = setInterval(query, 5000, this.socket);
  }

  renderTableData = () => {
    return this.state.devices?.map((val) => (
      <tr key={val.hostname}>
        <td>
          <Nav.Link onClick={() => this.setState({ body: val.hostname })}>
            {val.description}
          </Nav.Link>
        </td>
        <td>{val.ipaddr}</td>
        <td>{val.up === true ? "Up" : "Down"}</td>
        <td>{val.timestamp}</td>
      </tr>
    ));
  };

  render() {
    if (this.state.body === "") {
      return (
        <React.Fragment>
          <h1>Devices</h1>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>IP Address</th>
                <th>Status</th>
                <th>Last contact</th>
              </tr>
            </thead>
            <tbody>{this.renderTableData()}</tbody>
          </Table>
        </React.Fragment>
      );
    } else {
      return <Device hostname={this.state.body} />;
    }
  }
}

export default Devices;
