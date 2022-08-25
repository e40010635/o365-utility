import React, { Component } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { defineCustomElements } from "@utdx/rotor-web-components/dist/loader";
import { authContext } from "./adalConfig";
import { NotificationContainer } from "react-notifications";
import axios from "axios";
import "react-notifications/lib/notifications.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-balham.css";
import "@utdx/rotor-web-components/dist/rotor.css";
import "./App.css";
import NoMatch from "./components/NoMatch";
import Data from "./components/Data";
import Navbar from "./components/Navbar";

defineCustomElements(window);

class App extends Component {
  constructor(props) {
    super(props);
    this.state.user = authContext._user.profile;
  }
  async componentDidMount() {
    const res = await axios.get(
      `/getEmailAddress/?requester=${this.state.user.upn}`
    );
    if (res.status === 200) {
      this.setState({ emailAddress: res.data });
    }
  }
  state = {};
  render() {
    return (
      <Router>
        <Navbar user={this.state.user} />
        <NotificationContainer />
        <Switch>
          <Route
            exact
            path="/"
            render={props => (
              <Data
                {...props}
                user={this.state.user}
                emailAddress={this.state.emailAddress}
              />
            )}
          />
          <Route path="*">
            <NoMatch />
          </Route>
        </Switch>
      </Router>
    );
  }
}

export default App;
