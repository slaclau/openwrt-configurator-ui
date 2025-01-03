import React from "react";

import Masonry from "@mui/lab/Masonry";
import BasicSettings from "./BasicSettings";

class Settings extends React.Component {
  render() {
    return (
      <Masonry columns={{ xs: 1, sm: 1, md: 2, lg: 3 }}>
        <BasicSettings />
      </Masonry>
    );
  }
}

export default Settings;
