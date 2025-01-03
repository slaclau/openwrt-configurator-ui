import React from "react";

import Card from "react-bootstrap/Card";

import * as Icon from "react-bootstrap-icons";

import { bandMap, htMap, getGeneration, formatTime } from "../utils.jsx";

const renderRadio = (state, radio) => {
  const radioInfo = state.wirelessDevices[radio];
  var antennas = state.hardware[radioInfo.iwinfo.phy].antennas.split(" ");
  antennas = parseInt(antennas[3]) + "x" + parseInt(antennas[1]);
  const clients = state.wirelessDevices[radio]?.interfaces
    .filter((val) => val.config.mode == "ap")
    .map((val) => state.assoclist?.[val.ifname]?.results)
    .reduce((acc, val) => [...acc, ...val], []).length;
  return (
    <tr>
      <td>
        <b>Ch. {radioInfo?.iwinfo?.channel}</b> (
        {bandMap[radioInfo?.config?.band]}, {htMap[radioInfo?.config?.htmode]})
      </td>
      <td>{antennas}</td>
      <td>{getGeneration(radioInfo?.iwinfo.hwmodes)}</td>
      <td align="right">
        {clients > 0
          ? clients == 1
            ? "1 client"
            : `${clients} clients`
          : "No clients"}
      </td>
    </tr>
  );
};

const getIfRates = (state, iface) => {
  const rxoldbytes = state.old.networkDevices?.[iface.ifname]?.stats.rx_bytes;
  const rxbytes = state.networkDevices?.[iface.ifname]?.stats.rx_bytes;
  const txoldbytes = state.old.networkDevices?.[iface.ifname]?.stats.tx_bytes;
  const txbytes = state.networkDevices?.[iface.ifname]?.stats.tx_bytes;
  return [(rxbytes - rxoldbytes) / 5, (txbytes - txoldbytes) / 5];
};

const RadioPerformance = ({ state }) => {
  const wirelessDevices = state.wirelessDevices,
    assoclist = state.assoclist,
    hostHints = state.hostHints;
  var tx_rate = 0;
  var rx_rate = 0;
  for (var radio in wirelessDevices) {
    for (var iface of wirelessDevices[radio]?.interfaces) {
      const rates = getIfRates(state, iface);
      tx_rate += rates[0];
      rx_rate += rates[1];
    }
  }

  var radios = [];
  for (var radio in wirelessDevices) {
    radios.push(renderRadio(state, radio));
  }
  return (
    <Card>
      <div className="mx-3 my-2">
        <div>
          <b>WiFi performance</b>
        </div>
        <div className="d-flex justify-content-between">
          <div>
            <span className={rx_rate ? "download" : "text-secondary"}>
              <Icon.ArrowDown />
              {(rx_rate / 125000).toFixed(2)} Mbps
            </span>{" "}
            <span className={tx_rate ? "upload" : "text-secondary"}>
              <Icon.ArrowUp />
              {(tx_rate / 125000).toFixed(2)} Mbps
            </span>
          </div>
          <div>
            <b>{formatTime(state.system_info.uptime)}</b>
          </div>
        </div>
        <table width="100%">
          <tbody>{radios}</tbody>
        </table>
      </div>
    </Card>
  );
};

export default RadioPerformance;
