import React from "react";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import ListGroup from "react-bootstrap/ListGroup";
import Offcanvas from "react-bootstrap/Offcanvas";

import * as Icon from "react-bootstrap-icons";

class ClickableListGroup extends React.Component {
  state = {
    show: "",
  };

  handleClose = () => this.setState({ show: "" });

  render() {
    if (!this.props.children) return;
    if (Array.isArray(this.props.children)) var children = this.props.children;
    else var children = [this.props.children];
    children = children.map((child) =>
      React.cloneElement(child, {
        onClick: () => {
          this.setState({
            show: child.props.name,
          });
          child.onClick();
        },
      })
    );
    return (
      <>
        {this.props.title ? <b>{this.props.title}</b> : ""}
        <Card className="clickable-list-group">
          <ListGroup as="ul" variant="flush">
            {this.props.children}
          </ListGroup>
        </Card>
      </>
    );
  }
}

class ClickableListGroupItem extends React.Component {
  state = {
    showConfirm: false,
    showInfo: false,
    current: "",
    password: this.props.password,
  };

  componentDidMount() {
    this.setState({ current: this.props.value });
  }

  render() {
    const _onClick = this.props.onClick;
    const onClick = this.props.confirm
      ? () => this.setState({ showConfirm: !this.state.showConfirm })
      : _onClick;

    const onChange = (value) => {
      this.setState({ current: value });
      this.props.onChange();
    };

    return (
      <ListGroup.Item
        className={_onClick ? "list-group-item-action" : ""}
        onClick={onClick}
        style={_onClick ? { cursor: "pointer" } : {}}
      >
        <div className="d-flex justify-content-between">
          <div className={this.props.nameClass}>{this.props.name}</div>
          <div className={this.props.editable ? "" : "text-secondary"}>
            {this.props.bool === true ? (
              <Form.Switch
                name={this.props.name}
                value={this.state.current === true}
                onChange={(e) => onChange(e.target.checked)}
                size="lg"
              />
            ) : this.props.editable === true ? (
              <InputGroup>
                <Form.Control
                  name={this.props.name}
                  defaultValue={this.state.current}
                  type={this.state.password ? "password" : ""}
                  onChange={(e) => onChange(e.target.value)}
                />{" "}
                {this.props.password ? (
                  <Icon.Eye
                    size={24}
                    className="text-secondary"
                    onClick={() =>
                      this.setState({ password: !this.state.password })
                    }
                  />
                ) : (
                  ""
                )}
              </InputGroup>
            ) : (
              this.state.current
            )}
            {this.props.info ? (
              <Icon.InfoCircle
                className="text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  this.setState({ showInfo: true });
                }}
                style={{ cursor: "pointer" }}
              />
            ) : (
              ""
            )}
            {this.props.children ? <Icon.ChevronRight /> : ""}
          </div>
        </div>
        <small className="text-secondary">{this.props.subtitle}</small>
        {this.props.confirm ? (
          <Offcanvas
            show={this.state.showConfirm}
            onHide={() => this.setState({ showConfirm: false })}
            placement="bottom"
          >
            <Offcanvas.Header className="text-center">
              <b>{this.props.confirm.title}</b>
            </Offcanvas.Header>
            <Offcanvas.Body>
              {this.props.confirm.text}
              <div className="d-grid gap-2">
                <Button
                  variant={
                    this.props.confirm.variant
                      ? this.props.confirm.variant
                      : "primary"
                  }
                  onClick={this.props.onClick}
                >
                  {this.props.confirm.yes ? this.props.confirm.yes : "OK"}
                </Button>
                <Button variant="light" className="text-primary">
                  {this.props.confirm.no ? this.props.confirm.no : "Cancel"}
                </Button>
              </div>
            </Offcanvas.Body>
          </Offcanvas>
        ) : (
          ""
        )}
        {this.props.info ? (
          <Offcanvas
            show={this.state.showInfo}
            onHide={(e) => this.setState({ showInfo: false })}
            placement="bottom"
          >
            <Offcanvas.Header className="text-center">
              <b>{this.props.info.title ? this.props.info.title : "Info"}</b>
            </Offcanvas.Header>
            <Offcanvas.Body>
              {this.props.info.text}
              <div className="d-grid gap-2">
                <Button
                  variant="light"
                  onClick={(e) => {
                    e.stopPropagation();
                    this.setState({ showInfo: false });
                  }}
                >
                  {this.props.info.close ? this.props.info.close : "Close"}
                </Button>
              </div>
            </Offcanvas.Body>
          </Offcanvas>
        ) : (
          ""
        )}
      </ListGroup.Item>
    );
  }
}

export default Object.assign(ClickableListGroup, {
  Item: ClickableListGroupItem,
});
