import React, { useEffect, useState } from "react";

import * as Icon from "react-bootstrap-icons";

import Masonry from "@mui/lab/Masonry";

import ListGroup from "react-bootstrap/ListGroup";

import { toVendor } from "@network-utils/vendor-lookup";

import { HSpacer } from "../utils/Spacer.jsx";
import { bandMap, formatTime } from "./devices/utils.jsx";

import { api } from "../api.js";

const getStandard = (client) => {
  if (client.rx.he || client.tx.he) return 6;
  if (client.rx.vht || client.tx.vht) return 5;
  if (client.rx.ht || client.tx.ht) return 4;
  return 3;
};

const getMIMO = (client) => {
  const get = (x) => {
    return x.he_nss || x.vht_nss || (Math.floor(x.mcs / 8) + 1) | 1;
  };
  return get(client.rx) + "x" + get(client.tx);
};

const getRates = (state, client) => {
  console.log("client", client);
  const rxoldbytes = state.old.assoclist?.[client.ifname]?.results.find(
    (val) => val.mac == [client.mac],
  ).rx.bytes;
  const rxbytes = state.assoclist?.[client.ifname]?.results.find(
    (val) => val.mac == [client.mac],
  ).rx.bytes;
  const txoldbytes = state.old.assoclist?.[client.ifname]?.results.find(
    (val) => val.mac == [client.mac],
  ).tx.bytes;
  const txbytes = state.assoclist?.[client.ifname]?.results.find(
    (val) => val.mac == [client.mac],
  ).tx.bytes;
  return [(rxbytes - rxoldbytes) / 5, (txbytes - txoldbytes) / 5];
};
const Client = ({ client, state, hostnames, callback }) => {
  const [expand, setExpand] = useState("");
  const [ap, setAp] = useState({});

  const radio = state?.wirelessDevices[client.radio];
  const iface = radio?.interfaces.find((val) => val.ifname === client.ifname);

  const quality = (100 * (110 + client.signal)) / 70;
  const standard = getStandard(client);
  const mimo = getMIMO(client);
  const rates = getRates(state, client);
  const rx_rate = rates[1];
  const tx_rate = rates[0];

  useEffect(() => {
    api.get(`/status/${client.ap}`).then((response) => setAp(response.data));
  }, []);

  const ap_name =
    state?.system_config?.system0?.description ||
    state?.system_config?.system0?.hostname ||
    ap.description;

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
  return (
    <Masonry columns="1">
      <ListGroup>
        <ListGroup.Item>
          <div>{hostnames[client.mac] || client.mac}</div>
          {callback ? (
            <div>
              <small className="text-secondary">
                Connected to: <div onClick={callback}>{ap_name}</div>
              </small>
            </div>
          ) : (
            <div>
              <small className="text-secondary">
                Connected to: <div>{ap_name}</div>
              </small>
            </div>
          )}
        </ListGroup.Item>
      </ListGroup>
      <ListGroup>
        <ListGroup.Item>
          <div>
            <b>WiFi Experience</b>
          </div>
          <div className="d-flex justify-content-between">
            <div>
              <span className={rx_rate > 0 ? "download" : "text-secondary"}>
                <Icon.ArrowDown />
                {(rx_rate / 125000).toFixed(2)} Mbps
              </span>{" "}
              <span className={tx_rate > 0 ? "upload" : "text-secondary"}>
                <Icon.ArrowUp />
                {(tx_rate / 125000).toFixed(2)} Mbps
              </span>
            </div>
            <div>
              <b>{formatTime(client.connected_time)}</b>
            </div>
          </div>
        </ListGroup.Item>
      </ListGroup>
      <ListGroup>
        {row("Network", "tbc")}
        {row("WiFi Name", iface?.config?.ssid)}
        {row(
          "Channel",
          `${iface.iwinfo.channel} (${bandMap[radio?.config?.band]})`,
        )}
        {row("Signal", `${client.signal} dBm`)}
        {row(
          "AP/Client Balance",
          quality < 25
            ? "Poor"
            : quality < 50
              ? "Ok"
              : quality < 75
                ? "Good"
                : "Excellent",
          quality < 50
            ? "text-danger"
            : quality < 50
              ? "text-secondary"
              : "text-success",
        )}
        {row("Standard", "WiFi " + standard)}
        {row("MIMO Configuration", mimo)}
        {row(
          "RX Rate / TX Rate",
          `${client.rx.rate / 1000} Mbps / ${client.tx.rate / 1000} Mbps`,
        )}
        {row("IP Address", state?.hostHints?.[client.mac]?.ipaddrs)}
        {row("MAC Address", client.mac)}
        {row("Manufacturer", toVendor(client.mac))}
        {row(
          "Down Pkts/Bytes",
          `${(client.rx.packets / 1000).toFixed(1)}k / ${(client.rx.bytes / 1000000).toFixed(1)} MB`,
        )}
        {row(
          "Up Pkts/Bytes",
          `${(client.tx.packets / 1000).toFixed(1)}k / ${(client.tx.bytes / 1000000).toFixed(1)} MB`,
        )}
      </ListGroup>
    </Masonry>
  );
};

export default Client;
