import React from "react";

import { useEffect, useRef, useState } from "react";

import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";

import * as Icon from "react-bootstrap-icons";

import { signalIcon, bandMap } from "../utils.jsx";
import { HSpacer } from "../../../utils/Spacer.jsx";

import { api } from "../../../api.js";

import Client from "../../Client.jsx";

const Clients = ({ state }) => {
  const [show, setShow] = useState(false);
  const [showClient, setShowClient] = useState("");
  const [hostnames, setHostnames] = useState({});

  const handleClose = () => setShow(false);

  const clients = Object.keys(state.wirelessDevices)
    .map((radio) =>
      state.wirelessDevices[radio]?.interfaces
        .filter((val) => val.config.mode == "ap")
        .map((val) =>
          state.assoclist?.[val.ifname]?.results.map((item) => {
            return {
              ifname: val.ifname,
              radio: radio,
              ap: state.system_config.system0.hostname,
              ...item,
            };
          }),
        ),
    )
    .reduce((acc, val) => [...acc, ...val], [])
    .reduce((acc, val) => [...acc, ...val], []);
  useEffect(() => {
    api.get("/clients").then((response) => {
      setHostnames(response.data);
    });
    const macs = clients
      .map((val) => val.mac)
      .filter((val) => !Object.keys(hostnames).includes(val));
    if (macs) {
      api.post("/clients", { macs: macs }).then((response) => {
        setHostnames({ hostnames, ...response.data });
      });
    }
  }, [clients.length]);
  const handleShow = () => {
    if (clients.length == 0) return;
    setShow(true);
    setShowClient("");
  };
  const row = (client) => {
    const ssid = Object.keys(state.wirelessDevices)
      .map((val) => state.wirelessDevices[val]?.interfaces)
      .reduce((acc, val) => [...acc, ...val])
      .find((val) => val.ifname === client.ifname).config.ssid;
    const band = bandMap[state.wirelessDevices[client.radio].config.band];
    return (
      <ListGroup.Item
        as="li"
        key={client.mac}
        onClick={() => setShowClient(client.mac)}
      >
        <div className="d-flex justify-content-between">
          <div>{hostnames[client.mac] || client.mac}</div>
          <div>
            <small className="text-secondary">
              {state.hostHints?.[client.mac]?.ipaddrs.join(", ")}
            </small>
          </div>
        </div>
        <div className="d-flex">
          <div>
            <Icon.Broadcast />{" "}
            <small className="text-secondary">
              {state.system_config.system0.description ||
                state.system_config.system0.hostname}
            </small>
          </div>
          <HSpacer width="1em" />
          <div>
            {signalIcon({ signalPercent: "50" })}{" "}
            <small className="text-secondary">
              {ssid} ({band})
            </small>
          </div>
        </div>
      </ListGroup.Item>
    );
  };
  const renderModalHeader = ({ showClient }) => {
    if (showClient === "") {
      return <Icon.ChevronLeft onClick={handleClose} />;
    }
    return <Icon.ChevronLeft onClick={() => setShowClient("")} />;
  };
  const renderModalBody = ({ showClient }) => {
    if (showClient === "") {
      return <ListGroup as="ul">{clients.map((val) => row(val))}</ListGroup>;
    }
    return (
      <Client
        client={clients.find((val) => val.mac === showClient)}
        state={state}
        hostnames={hostnames}
        callback={handleClose}
      />
    );
  };
  return (
    <Card>
      <ListGroup as="ul" variant="flush">
        <ListGroup.Item
          as="li"
          className="d-flex justify-content-between list-group-item-action"
          onClick={handleShow}
        >
          <div>Clients</div>
          <div>
            {clients.length}
            <Icon.ChevronRight />
          </div>
        </ListGroup.Item>
      </ListGroup>
      <Modal show={show} onHide={handleClose} fullscreen="md-down">
        <Modal.Header>{renderModalHeader({ showClient })}</Modal.Header>
        <Modal.Body>{renderModalBody({ showClient })}</Modal.Body>
      </Modal>
    </Card>
  );
};

export default Clients;
