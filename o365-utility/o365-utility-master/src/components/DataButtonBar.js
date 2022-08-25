import React, { Component } from "react";
import { wc } from "@utdx/rotor-react-wc-shim";
import { NotificationManager } from "react-notifications";
import RotorModal from "./RotorModal";

class DataButtonBar extends Component {
  constructor(props) {
    super(props);
    this.handleModalConfirm = this.handleModalConfirm.bind(this);
    this.toggleModalActive = this.toggleModalActive.bind(this);
    this.state = {
      isModalActive: false
    };
  }

  handleModalConfirm = async () => {
    try {
      this.toggleModalActive();
      let res = await this.props.handleEmailClick();
      if (res.status === 200) {
        NotificationManager.success(
          "Email successfully sent",
          "Success!",
          4000
        );
      }
    } catch (err) {
      if (err.response) {
        NotificationManager.error(
          "An error occured, please try again later",
          "Error",
          4000
        );
      }
    }
  };

  toggleModalActive() {
    this.setState({
      isModalActive: !this.state.isModalActive
    });
  }

  render() {
    return (
      <div className="data-button-bar">
        <rotor-button
          class="export-button"
          ref={wc({
            events: { rotorclick: this.props.handleExportClick },
            variant: "outline"
          })}
        >
          Export
        </rotor-button>
        <rotor-button
          class="email-button"
          ref={wc({
            events: { rotorclick: this.toggleModalActive },
            variant: "outline"
          })}
        >
          Email
        </rotor-button>
        <RotorModal
          toggleModalActive={this.toggleModalActive}
          handleModalConfirm={this.handleModalConfirm}
          isModalActive={this.state.isModalActive}
          emailAddress={this.props.emailAddress}
        />
      </div>
    );
  }
}

export default DataButtonBar;
