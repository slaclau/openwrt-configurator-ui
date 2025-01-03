import React from "react";

import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";

import * as Icon from "react-bootstrap-icons";

import ClickRow from "./ClickRow";

class ModalListGroup extends React.Component {
  state = {
    show: "",
    modalBody: "",
    modalHeader: "",
  };

  handleClose = () => this.setState({ show: "" });

  renderModalHeader = ({ show }) => {
    return (
      <div>
        <Icon.ChevronLeft onClick={() => this.setState({ show: "" })} />
        {show}
      </div>
    );
  };

  render() {
    if (!this.props.children) return;
    if (Array.isArray(this.props.children)) var children = this.props.children;
    else var children = [this.props.children];
    const getBody = (children) => {
      console.log("c", children);
      if (!children) return;
      if (!Array.isArray(children)) children = [children];
      return children.filter((val) => val.type !== ModalListGroupItemHeader);
    };
    const getHeader = (children) => {
      if (!children) return;
      if (!Array.isArray(children)) children = [children];
      var header = children.find(
        (val) => val.type === ModalListGroupItemHeader,
      );
      if (header) return header;
    };
    children = children.map((child) =>
      React.cloneElement(child, {
        onClick: () => {
          this.setState({
            show: child.props.name,
            modalBody: getBody(child.props.children),
            modalHeader: getHeader(child.props.children),
          });
          console.log("children", child.props.children);
        },
      }),
    );
    return (
      <Card>
        <ListGroup as="ul" variant="flush">
          {children}
        </ListGroup>
        <Modal
          show={this.state.show}
          onHide={this.handleClose}
          fullscreen="md-down"
        >
          <Modal.Header>
            {this.state.modalHeader
              ? this.state.modalHeader
              : this.renderModalHeader({ show: this.state.show })}
          </Modal.Header>
          <Modal.Body>{this.state.modalBody}</Modal.Body>
        </Modal>
      </Card>
    );
  }
}

class ModalListGroupItem extends React.Component {
  render() {
    return (
      <ClickRow
        show={this.props.name}
        onClick={"disabled" in this.props ? "" : this.props.onClick}
        value={this.props.value}
        disabled={this.props.disabled ? true : false}
      />
    );
  }
}
class ModalListGroupItemHeader extends React.Component {
  render() {
    return this.props.children;
  }
}

export default Object.assign(ModalListGroup, {
  Item: Object.assign(ModalListGroupItem, { Header: ModalListGroupItemHeader }),
});
