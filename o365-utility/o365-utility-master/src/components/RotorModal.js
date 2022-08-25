import React, { Component } from "react";
import { wc } from "@utdx/rotor-react-wc-shim";

class RotorModal extends Component {
  render() {
    return (
      <rotor-action-modal
        heading="Email Report"
        key="modal"
        ref={wc({
          events: {
            rotorconfirm: this.props.handleModalConfirm,
            rotorclose: this.props.toggleModalActive,
            rotorcancel: this.props.toggleModalActive
          },
          isActive: this.props.isModalActive,
          accent: "accent-3",
          cancelText: "Cancel",
          confirmText: "Confirm"
        })}
      >
        <p>
          This report will be sent out for provisioning. It will be sent to the
          O365 team and {this.props.emailAddress}.
        </p>
      </rotor-action-modal>
    );
  }
}

export default RotorModal;
