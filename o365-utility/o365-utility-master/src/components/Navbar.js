import React, { Component } from "react";
import { authContext } from "../adalConfig";

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    authContext.logOut();
  }
  render() {
    return (
      <rotor-nav>
        <rotor-nav-brand>
          <rotor-icon size="fill" name="logo" />
          <rotor-nav-brand-title>
            O365 Utility
            <rotor-nav-brand-subtitle></rotor-nav-brand-subtitle>
          </rotor-nav-brand-title>
        </rotor-nav-brand>
        <rotor-nav-items>
          <rotor-nav-dropdown
            label={`${this.props.user.given_name} ${this.props.user.family_name}`}
            mode="light"
            size="standard"
            icon="user"
          >
            <rotor-nav-item>
              <span className="rotor-nav-link" onClick={this.handleClick}>
                Logout
              </span>
            </rotor-nav-item>
          </rotor-nav-dropdown>
        </rotor-nav-items>
      </rotor-nav>
    );
  }
}

export default Navbar;
