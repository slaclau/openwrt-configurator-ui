import Badge from "react-bootstrap/Badge";

import * as Icon from "react-bootstrap-icons";

export const SignalBadge = ({ signal, noise, quality, qualityMax }) => {
  const signalPercent = (100 * quality) / qualityMax;
  return (
    <Badge
      pill
      bg={
        signalPercent
          ? signalPercent < 30
            ? "danger"
            : signalPercent < 70
              ? "primary"
              : "success"
          : "secondary"
      }
    >
      {signal ? signal : "--"} / {noise}
      {"  "}
      {signalIcon(signalPercent)}
    </Badge>
  );
};

export const signalIcon = ({ signalPercent }) => {
  return signalPercent ? (
    signalPercent < 25 ? (
      <Icon.Reception1 />
    ) : signalPercent < 50 ? (
      <Icon.Reception2 />
    ) : signalPercent < 75 ? (
      <Icon.Reception3 />
    ) : (
      <Icon.Reception4 />
    )
  ) : (
    <Icon.Reception0 />
  );
};

export const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds - h * 3600) / 60);
  const s = seconds - h * 3600 - m * 60;

  return `${h ? String(h) + ":" + String(m).padStart(2, "0") : m}:${String(s).padStart(2, "0")}`;
};

export const bandMap = {
  "2g": "2.4 GHz",
  "5g": "5 GHz",
};
export const htMap = {
  HT20: "20 MHz",
};

export const getGeneration = (hwModes) => {
  if (hwModes.includes("bn")) return "WiFi 8";
  if (hwModes.includes("be")) return "WiFi 7";
  if (hwModes.includes("ax")) return "WiFi 6";
  if (hwModes.includes("ac")) return "WiFi 5";
  if (hwModes.includes("n")) return "WiFi 4";
  if (hwModes.includes("g")) return "WiFi 3";
  if (hwModes.includes("a")) return "WiFi 2";
  if (hwModes.includes("b")) return "WiFi 1";
  return "WiFi 0";
};
