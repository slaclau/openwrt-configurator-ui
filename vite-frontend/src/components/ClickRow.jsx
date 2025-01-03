import React from "react";

import ListGroup from "react-bootstrap/ListGroup";

import * as Icon from "react-bootstrap-icons";

const ClickRow = ({ show, onClick, value, disabled }) => {
  return (
    <ListGroup.Item
      as="li"
      className="d-flex justify-content-between list-group-item-action"
      onClick={onClick}
      key={show}
      style={onClick ? { cursor: "pointer" } : {}}
      disabled={disabled ? true : false}
    >
      <div>{show}</div>
      <div>
        <span className="text-secondary">{value}</span>
        <Icon.ChevronRight />
      </div>
    </ListGroup.Item>
  );
};

export default ClickRow;
