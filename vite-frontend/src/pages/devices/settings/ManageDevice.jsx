import React from "react";

import { useState } from "react";

import ClickableListGroup from "../../../components/ClickableListGroup";

import { api } from "../../../api.js";

const ManageDevice = ({ state }) => {
  const [locating, setLocating] = useState(false);

  function restart(hostname) {
    api.get(`/manage/restart/${hostname}`).then((response) => {});
  }

  function locate(hostname) {
    if (!locating) {
      api.get(`/manage/locate/${hostname}`).then((response) => {});
      setLocating(true);
    } else {
      api.delete(`/manage/locate/${hostname}`).then((response) => {});
      setLocating(false);
    }
  }

  return (
    <>
      <div>
        <b>Manage Device</b>
        <ClickableListGroup>
          <ClickableListGroup.Item
            key="Locate"
            name={locating ? "Stop Locating Device" : "Locate Device"}
            nameClass="text-primary"
            info={{
              title: "Locating Devices",
              text: "Tapping Locate Device in a device's management panel will cause its LED light or LCM screen to blink rapidly so you can find a specific network device.",
            }}
            onClick={() => locate(state.device_config.hostname)}
            confirm={
              !locating
                ? {
                    title: `Locate ${state.device_config.description}`,
                    text: `Would you like to locate ${state.device_config.description}? Its LED light or LCM screen will blink rapidly while it's being located.`,
                    yes: "Locate",
                  }
                : ""
            }
          />
          <ClickableListGroup.Item
            key="Restart"
            name="Restart"
            nameClass="text-primary"
            onClick={() => restart(state.device_config.hostname)}
            info={{
              title: "Restarting Devices",
              text: "Devices cannot be managed while they restart. Also, please note that some devices may cause momentary internet disruption while they restart.",
            }}
            confirm={{
              title: `Restart ${state.device_config.description}`,
              text: "Are you sure you want to restart this device",
              yes: "Restart",
            }}
          />
          <ClickableListGroup.Item
            key="Provision"
            name="Provision"
            nameClass="text-primary"
            info={{
              title: "Provisioning Devices",
              text: "Provisioning a device ensures that it is configured with all of the latest settings.",
            }}
            confirm={{
              title: `Provision ${state.device_config.description}`,
              text: "Provisioning this device will configure it with the latest settings. Are you sure you want to continue",
              yes: "Provision",
            }}
          />
        </ClickableListGroup>
      </div>
      <ClickableListGroup>
        <ClickableListGroup.Item
          key="Disable"
          name="Disable"
          nameClass="text-danger"
          info={{
            title: "Disabling Device",
            text: "Disabled devices will not be accounted for in dashboard data or appear on your device list. Their respective LED and WLAN indicators will be off.",
          }}
          confirm={{
            title: `Disable ${state.device_config.description}`,
            text: "Are you sure you want to disable this device?",
            yes: "Disable",
            variant: "danger",
          }}
        />
        <ClickableListGroup.Item
          key="Remove"
          name="Remove"
          nameClass="text-danger"
          info={{
            title: "Removing Device",
            text: "Remove a device from your network, restore it to factory settings, and erase its usage history.",
          }}
          confirm={{
            title: `Remove ${state.device_config.description}`,
            text: "This device will be restored to default factory settings and you will no longer be able to manaeg it with this console. Are you sure you want to continue?",
            yes: "Remove",
            variant: "danger",
          }}
        />
      </ClickableListGroup>
      <ClickableListGroup>
        <ClickableListGroup.Item
          key="Configuration"
          name="Copying Configurations"
        />
        <ClickableListGroup.Item key="Firmware" name="Custom Firmware Update" />
      </ClickableListGroup>
    </>
  );
};

export default ManageDevice;
