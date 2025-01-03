import React from "react";

import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";

import { SignalBadge } from "../utils.jsx";

import * as Icon from "react-bootstrap-icons";

const renderWiFiDevice = (wifiDevice) => {
  const channel = wifiDevice?.iwinfo?.channel;
  const frequency = wifiDevice?.iwinfo?.frequency / 1000;
  var bitrate;
  for (var intf of wifiDevice?.interfaces) {
    bitrate = bitrate || intf?.iwinfo?.bitrate;
  }
  const modes = wifiDevice?.iwinfo?.hwmodes?.join("");
  status = wifiDevice?.disabled ? "Disabled" : wifiDevice?.up ? "Up" : "Down";

  const wifiDeviceItem = (
    <ListGroup.Item
      as="li"
      key={wifiDevice?.iwinfo?.phy}
      className="d-flex justify-content-between align-items-start"
    >
      <div className="ms-2 me-auto">
        <div className="h3">
          {wifiDevice?.iwinfo?.hardware?.name} {modes ? "802.11" + modes : ""}
        </div>
        <div>
          <b>Channel:</b> {channel} ({frequency} GHz)
        </div>
        <div>
          <b>Bitrate:</b> {bitrate / 1000} Mbps
        </div>
      </div>
      <Badge
        pill
        bg={
          status === "Disabled"
            ? "secondary"
            : status === "Up"
              ? "success"
              : "failure"
        }
      >
        {status}
      </Badge>
    </ListGroup.Item>
  );

  return (
    <>
      {wifiDeviceItem}
      {wifiDevice?.interfaces.map((val) => renderWiFiNetwork(val))}
    </>
  );
};

const renderWiFiNetwork = (wifiNetwork) => {
  const ssid = wifiNetwork?.iwinfo?.ssid;
  const mode = wifiNetwork?.iwinfo?.mode;
  const bssid = wifiNetwork?.iwinfo?.bssid;
  const encryption = formatWifiEncryption(wifiNetwork?.iwinfo?.encryption);
  const signal = wifiNetwork?.iwinfo?.signal;
  const noise = wifiNetwork?.iwinfo?.noise;
  const quality = wifiNetwork?.iwinfo?.quality;
  const qualityMax = wifiNetwork?.iwinfo?.quality_max;

  return (
    <ListGroup.Item
      as="li"
      key={wifiNetwork?.iwinfo?.ifname}
      className="d-flex justify-content-between align-items-start"
    >
      <div className="ms-2 me-auto">
        <div>
          <b>SSID:</b> {ssid}
        </div>
        <div>
          <b>Mode:</b> {mode}
        </div>
        <div>
          <b>BSSID:</b> {bssid}
        </div>
        <div>
          <b>Encryption:</b> {encryption}
        </div>
      </div>
      <SignalBadge
        signal={signal}
        noise={noise}
        quality={quality}
        qualityMax={qualityMax}
      />
    </ListGroup.Item>
  );
};

const renderWiFi = ({ state }) => {
  const wireless = state.wireless_config,
    wirelessDevices = state.wirelessDevices;
  var radios = [];
  for (var wl in wireless) {
    if (wireless[wl][".type"] === "wifi-device")
      radios.push(renderWiFiDevice(wirelessDevices[wireless[wl][".name"]]));
  }
  return (
    <Card>
      <ListGroup as="ul" variant="flush">
        {radios}
      </ListGroup>
    </Card>
  );
};

function formatWifiEncryption(enc) {
  if (!enc?.enabled) return "None";

  var ciphers = Array.isArray(enc.ciphers)
    ? enc.ciphers.map(function (c) {
        return c.toUpperCase();
      })
    : ["NONE"];

  if (Array.isArray(enc.wep)) {
    var has_open = false,
      has_shared = false;

    for (var i = 0; i < enc.wep.length; i++)
      if (enc.wep[i] == "open") has_open = true;
      else if (enc.wep[i] == "shared") has_shared = true;

    if (has_open && has_shared)
      return "WEP Open/Shared (%s)".format(ciphers.join(", "));
    else if (has_open) return "WEP Open System (%s)".format(ciphers.join(", "));
    else if (has_shared)
      return "WEP Shared Auth (%s)".format(ciphers.join(", "));

    return "WEP";
  }

  if (Array.isArray(enc.wpa)) {
    var versions = [],
      suites = Array.isArray(enc.authentication)
        ? enc.authentication.map(function (a) {
            return a.toUpperCase();
          })
        : ["NONE"];

    for (var i = 0; i < enc.wpa.length; i++)
      switch (enc.wpa[i]) {
        case 1:
          versions.push("WPA");
          break;

        default:
          versions.push(`WPA${enc.wpa[i]}`);
          break;
      }

    if (versions.length > 1)
      return `mixed ${versions.join("/")} ${suites.join(", ")} (${ciphers.join(", ")})`;

    return `${versions[0]} ${suites.join(", ")} (${ciphers.join(", ")})`;
  }

  return "Unknown";
}

export default renderWiFi;
