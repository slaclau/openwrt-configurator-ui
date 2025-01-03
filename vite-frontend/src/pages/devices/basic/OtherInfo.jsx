import React from "react";

import { useState } from "react";

import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";

import * as Icon from "react-bootstrap-icons";

import { toVendor } from "@network-utils/vendor-lookup";

import { signalIcon, bandMap, htMap } from "../utils.jsx";
import { HSpacer } from "../../../utils/Spacer.jsx";

import Client from "../../Client.jsx";

import ClickRow from "../../../components/ClickRow.jsx";

const getRadioStats = (state, radio) => {
  var rxpackets = 0;
  var rxbytes = 0;
  var txpackets = 0;
  var txbytes = 0;
  for (var iface of state.wirelessDevices[radio].interfaces) {
    const stats = state.networkDevices?.[iface.ifname].stats;
    rxpackets += stats.rx_packets;
    rxbytes += stats.rx_bytes;
    txpackets += stats.tx_packets;
    txbytes += stats.tx_bytes;
  }
  return {
    rx: { packets: rxpackets, bytes: rxbytes },
    tx: { packets: txpackets, bytes: txbytes },
  };
};

const OtherInfo = ({ state }) => {
  const [show, setShow] = useState("");
  const [expand, setExpand] = useState("");

  const handleClose = () => setShow("");

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
    .reduce((acc, val) => val, [])
    .reduce((acc, val) => val, []);
  const handleShow = (type) => {
    setShow(type);
  };

  const row = (name, val, text_class) => {
    if (!text_class) {
      text_class = "text-secondary";
    }
    const revealHiddenOverflow = (d) => {
      if (expand == name) {
        setExpand("");
      } else {
        setExpand(name);
      }
    };
    var text;
    if (Array.isArray(val)) {
      text = val.join(", ");
    } else {
      text = val;
    }
    if (!text) {
      return;
    }
    return (
      <ListGroup.Item
        onClick={revealHiddenOverflow}
        className={
          "d-flex justify-content-between list-group-item-action" +
          (expand != name ? " text-truncate" : "")
        }
      >
        <div>{name}</div>
        <HSpacer width="1em" />
        <div
          align="right"
          className={text_class + (expand != name ? " text-truncate" : "")}
        >
          {text}
        </div>
      </ListGroup.Item>
    );
  };

  const renderModalHeader = ({ show }) => {
    return (
      <div>
        <Icon.ChevronLeft onClick={() => setShow("")} />
        {show}
      </div>
    );
  };
  const renderModalBody = ({ show }) => {
    const callback = () => {
      console.log("cb");
      handleClose();
    };
    if (show === "Air Stats") {
      const tabs = Object.keys(state.wirelessDevices)
        .map((radio) => [state.wirelessDevices[radio]])
        .reduce((acc, val) => [...acc, ...val], [])
        .map((val) => (
          <Nav.Item>
            <Nav.Link eventKey={val.config.band}>
              {bandMap[val?.config?.band]}
            </Nav.Link>
          </Nav.Item>
        ));
      const bodies = Object.keys(state.wirelessDevices)
        .map((radio) => ({
          stats: getRadioStats(state, radio),
          ...state.wirelessDevices[radio],
        }))
        .map((val) => (
          <Tab.Pane eventKey={val.config.band}>
            <ListGroup>
              {row("Transmit Power", val?.iwinfo?.txpower + " dBm")}
              {row(
                "TX Pkts/Bytes",
                `${(val.stats.tx.packets / 1000).toFixed(1)}k / ${(val.stats.tx.bytes / 1000000).toFixed(1)} MB`,
              )}
              {row(
                "RX Pkts/Bytes",
                `${(val.stats.rx.packets / 1000).toFixed(1)}k / ${(val.stats.rx.bytes / 1000000).toFixed(1)} MB`,
              )}
              {row("TX Retry/Dropped", "")}
              {row("RX Retry/Dropped", "")}
              {row("Ch. Util. (Busy/RX/TX)", "")}
            </ListGroup>
          </Tab.Pane>
        ));
      return (
        <Tab.Container
          defaultActiveKey={
            state.wirelessDevices[Object.keys(state.wirelessDevices)[0]].config
              .band
          }
        >
          <Nav variant="pills" className="flex-row" justify>
            {tabs}
          </Nav>
          <Tab.Content>{bodies}</Tab.Content>
        </Tab.Container>
      );
    }
    if (show === "WLANs") {
      const tabs = Object.keys(state.wirelessDevices)
        .map((radio) => [state.wirelessDevices[radio]])
        .reduce((acc, val) => [...acc, ...val], [])
        .map((val) => (
          <Nav.Item>
            <Nav.Link eventKey={val.config.band}>
              {bandMap[val?.config?.band]}
            </Nav.Link>
          </Nav.Item>
        ));
      const bodies = Object.keys(state.wirelessDevices)
        .map((radio) => state.wirelessDevices[radio])
        .map((radio) => (
          <Tab.Pane eventKey={radio.config.band}>
            <ListGroup>
              {radio.interfaces
                .filter((val) => val.config.mode === "ap")
                .map((val) => (
                  <ListGroup.Item>
                    <b>
                      <div className="d-flex justify-content-between">
                        <div>{val.ifname}</div>
                        <div>
                          <small>{val.config.ssid}</small>
                        </div>
                      </div>
                    </b>
                    <small>
                      <div className="d-flex justify-content-between">
                        <div>
                          {val?.iwinfo?.channel
                            ? "Channel " +
                              val?.iwinfo?.channel +
                              " / " +
                              htMap[radio.config.htmode]
                            : ""}{" "}
                        </div>
                        <div>{val.iwinfo.bssid}</div>
                      </div>
                    </small>
                  </ListGroup.Item>
                ))}
            </ListGroup>
          </Tab.Pane>
        ));
      return (
        <>
          <Tab.Container
            id="left-tabs-example"
            defaultActiveKey={
              state.wirelessDevices[Object.keys(state.wirelessDevices)[0]]
                ?.config.band
            }
          >
            <Nav variant="pills" className="flex-row" justify>
              {tabs}
            </Nav>
            <Tab.Content>{bodies}</Tab.Content>
          </Tab.Container>
        </>
      );
    }
    if (show === "AP Group") {
      return (
        <ListGroup>
          <ListGroup.Item>All APs tbc</ListGroup.Item>
        </ListGroup>
      );
    }
  };

  return (
    <Card>
      <ListGroup as="ul" variant="flush">
        <ClickRow show="Air Stats" onClick={() => handleShow("Air Stats")} />
        <ClickRow show="WLANs" onClick={() => handleShow("WLANs")} />
        <ClickRow show="AP Group" onClick={() => handleShow("AP Group")} />
      </ListGroup>
      <Modal show={show} onHide={handleClose} fullscreen="md-down">
        <Modal.Header>{renderModalHeader({ show })}</Modal.Header>
        <Modal.Body>{renderModalBody({ show })}</Modal.Body>
      </Modal>
    </Card>
  );
};

export default OtherInfo;
