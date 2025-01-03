import React from "react";

import Masonry from "@mui/lab/Masonry";

import ManageDevice from "./ManageDevice";
import SettingsList from "./SettingsList";

const Settings = ({ state }) => {
  return (
    <Masonry columns={{ xs: 1, sm: 1, md: 2, lg: 3 }}>
      <SettingsList state={state} />
      <ManageDevice state={state} />
    </Masonry>
  );
};

export default Settings;
