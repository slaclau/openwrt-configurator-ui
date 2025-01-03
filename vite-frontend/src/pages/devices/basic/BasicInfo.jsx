import React from "react";
import { useState } from "react";

import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";

import { formatTime } from "../utils.jsx";
import { HSpacer } from "../../../utils/Spacer.jsx";

const BasicInfo = ({ state }) => {
  const [expand, setExpand] = useState("");

  const ips = new Set(
    Object.keys(state.networkDevices)
      .filter((val) => val != "lo")
      .map((val) => state.networkDevices[val].ipaddrs)
      .reduce((acc, val) => [...acc, ...val.map((ip) => ip.address)], []),
  );
  const wifis = new Set(
    Object.keys(state.wirelessDevices)
      .reduce(
        (acc, val) => [...acc, ...state.wirelessDevices[val].interfaces],
        [],
      )
      .filter((val) => val.config.mode == "ap")
      .map((val) => val.config.ssid),
  );
  const row = (name, val) => {
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
          className={
            "text-secondary" + (expand != name ? " text-truncate" : "")
          }
        >
          {text}
        </div>
      </ListGroup.Item>
    );
  };
  return (
    <Card>
      <ListGroup variant="flush">
        {row("Model", state.board_info.model)}
        {row("IP Address", [...ips])}
        {row(
          "MAC Address",
          state?.boardJSON?.system?.label_macaddr.toUpperCase(),
        )}
        {row("Version", state?.board_info?.release?.version)}
        {row("WiFi Name", [...wifis])}
        {row("WiFi Exp.", "tbc")}
        {row("Uptime", formatTime(state.system_info.uptime))}
        {row(
          "Memory Usage",
          (
            (100 *
              (state?.system_info?.memory?.total -
                state?.system_info?.memory?.free)) /
            state?.system_info?.memory?.total
          ).toFixed(0) + " %",
        )}
        {row(
          "Load Average",
          state?.system_info?.load
            ? state?.system_info?.load
                .map((val) => (val / 65536).toFixed(2))
                .join(" / ")
            : "",
        )}
        {row("AP Group", "All APs tbc")}
      </ListGroup>
    </Card>
  );
};

export default BasicInfo;
