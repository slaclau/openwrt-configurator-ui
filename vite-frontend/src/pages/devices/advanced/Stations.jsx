import React from "react";

import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";

import { SignalBadge } from "../utils.jsx";

const renderStationItem = (iface, station, hostHints) => {
  return (
    <ListGroup.Item
      as="li"
      key={station.mac}
      className="d-flex justify-content-between align-items-start"
    >
      <div className="ms-2 me-auto">
        <div>
          <b>Network: </b>
          {iface.iwinfo.ssid} ({iface.ifname})
        </div>
        <div>
          <b>MAC: </b>
          {station.mac}
        </div>
        {hostHints?.[station.mac]?.ipaddrs ? (
          <div>
            <b>IPV4: </b>
            {hostHints?.[station.mac]?.ipaddrs.join(", ")}
          </div>
        ) : (
          ""
        )}
        {hostHints?.[station.mac]?.ip6addrs ? (
          <div>
            <b>IPV6: </b>
            {hostHints?.[station.mac]?.ip6addrs.join(", ")}
          </div>
        ) : (
          ""
        )}
        <div>
          <b>RX:</b> {station.rx.rate / 1000} Mbps, {station.rx.mhz} MHz, MCS{" "}
          {station.rx.mcs}
          {station.rx.short_gi ? ", Short GI" : ""}
        </div>
        <div>
          <b>TX:</b> {station.tx.rate / 1000} Mbps, {station.tx.mhz} MHz, MCS{" "}
          {station.tx.mcs}
          {station.tx.short_gi ? ", Short GI" : ""}
        </div>
      </div>
      <SignalBadge
        signal={station.signal}
        noise={station.noise}
        quality={station.signal + 110}
        qualityMax={70}
      />
    </ListGroup.Item>
  );
};

const renderStations = ({ state }) => {
  const wirelessDevices = state.wirelessDevices,
    assoclist = state.assoclist,
    hostHints = state.hostHints;
  const stationItems = [];
  for (var radio in wirelessDevices) {
    for (var iface of wirelessDevices[radio]?.interfaces) {
      for (var station of assoclist?.[iface.ifname]?.results) {
        stationItems.push(renderStationItem(iface, station, hostHints));
      }
    }
  }
  var networks = [];
  return (
    <Card>
      <ListGroup as="ul" variant="flush">
        {stationItems}
      </ListGroup>
    </Card>
  );
};

export default renderStations;
