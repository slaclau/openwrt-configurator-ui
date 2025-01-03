import React from "react";

import Masonry from "@mui/lab/Masonry";

import BasicInfo from "./BasicInfo.jsx";
import Clients from "./Clients.jsx";
import OtherInfo from "./OtherInfo.jsx";
import RadioPerformance from "./RadioPerformance.jsx";
import UplinkPerformance from "./UplinkPerformance.jsx";

const Basic = ({ state }) => {
  return (
    <Masonry columns={{ xs: 1, sm: 1, md: 2, lg: 3 }}>
      <UplinkPerformance state={state} mode="basic" />
      <RadioPerformance state={state} />
      <Clients state={state} />
      <BasicInfo state={state} />
      <OtherInfo state={state} />
      <UplinkPerformance state={state} mode="advanced" />
    </Masonry>
  );
};

export default Basic;
