import React from "react";

import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

import "./App.css";

import Devices from "./pages/devices/Devices";
import Settings from "./pages/settings/Settings";
import Status from "./pages/Status";

class App extends React.Component {
  state = { body: "status" };
  render_body = () => {
    switch (this.state.body) {
      case "status":
        return <Status />;
      case "devices":
        return <Devices />;
      case "settings":
        return <Settings />;
    }
  };
  render() {
    return (
      <>
        <Navbar expand="lg" className="navbar navbar-dark bg-primary fixed-top">
          <Container>
            <Nav.Link onClick={() => this.setState({ body: "status" })}>
              <Navbar.Brand>OpenWRT Controller</Navbar.Brand>
            </Nav.Link>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link
                  onClick={() => {
                    this.setState({ body: "" });
                    this.setState({ body: "devices" });
                  }}
                >
                  Devices
                </Nav.Link>
                <Nav.Link onClick={() => this.setState({ body: "settings" })}>
                  Settings
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        {this.render_body()}
      </>
    );
  }
}

export default App;
