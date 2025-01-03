import React from "react";
import { useState } from "react";

import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";

import * as Icon from "react-bootstrap-icons";

import { formatTime } from "../utils.jsx";
import { HSpacer } from "../../../utils/Spacer.jsx";

import { bandMap, signalIcon } from "../utils.jsx";

const UplinkPerformance = ({ state, mode }) => {
  const [expand, setExpand] = useState("");

  const uplinks = Object.keys(state.wirelessDevices)
    .map((radio) =>
      state.wirelessDevices[radio]?.interfaces
        .filter((val) => val.config.mode == "sta")
        .map((item) => {
          return {
            radio: radio,
            ...item,
          };
        }),
    )
    .reduce((acc, val) => [...acc, ...val], []);
  if (!uplinks) return;

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
  const basicItem = (
    <ListGroup.Item className="d-flex">
      <Icon.Broadcast size="24" />
      <HSpacer width="1ch" />
      <div className="vstack">
        {state.system_config?.["system0"]?.description ||
          state.system_config?.["system0"]?.hostname}
        {uplinks
          .filter((uplink) => uplink?.iwinfo?.signal)
          .map((uplink) => (
            <small className="text-secondary">
              Connected to: {uplink?.iwinfo?.ssid} (
              {bandMap[state.wirelessDevices[uplink?.radio].config.band]}){" "}
              {signalIcon({
                signalPercent:
                  (100 * uplink?.iwinfo?.quality) / uplink?.iwinfo?.quality_max,
              })}
            </small>
          ))}
      </div>
    </ListGroup.Item>
  );

  const advancedItem = (uplink) => {
    return (
      <>
        {row("Device", uplink?.iwinfo?.ssid)}
        {row(
          "Signal",
          `${((100 * uplink.iwinfo.quality) / uplink.iwinfo.quality_max).toFixed(0)}% (${uplink?.iwinfo?.signal} dBm)`,
        )}
        {row(
          "RX / TX Rate",
          state.assoclist[uplink?.ifname].results[0]?.tx.rate / 1000 +
            " Mbps / " +
            state.assoclist[uplink?.ifname].results[0]?.rx.rate / 1000 +
            " Mbps",
        )}
        {row(
          "Down Pkts/Bytes",
          `${(state.assoclist[uplink?.ifname].results[0]?.rx.packets / 1000).toFixed(1)}k / ${(state.assoclist[uplink?.ifname].results[0]?.rx.bytes / 1000000).toFixed(1)} MB`,
        )}
        {row(
          "Up Pkts/Bytes",
          `${(state.assoclist[uplink?.ifname].results[0]?.tx.packets / 1000).toFixed(1)}k / ${(state.assoclist[uplink?.ifname].results[0]?.tx.bytes / 1000000).toFixed(1)} MB`,
        )}
      </>
    );
  };

  return (
    <div>
      {mode == "advanced" ? <b>Parent Device</b> : ""}
      <Card>
        <ListGroup variant="flush">
          {mode === "basic" ? basicItem : ""}
          {mode === "advanced"
            ? uplinks
                .filter((uplink) => uplink?.iwinfo?.signal)
                .map((uplink, index) => advancedItem(uplink, index))
            : ""}
        </ListGroup>
      </Card>
    </div>
  );
};

export default UplinkPerformance;
