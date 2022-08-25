import React, { Component } from "react";
import { AgGridReact } from "ag-grid-react";
import { allModules } from "ag-grid-enterprise";
import axios from "axios";
import DataButtonBar from "./DataButtonBar";

class Data extends Component {
  constructor(props) {
    super(props);
    this.handleExportClick = this.handleExportClick.bind(this);
    this.handleEmailClick = this.handleEmailClick.bind(this);
  }
  state = {
    columnDefs: [
      {
        filter: false,
        suppressColumnsToolPanel: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        checkboxSelection: true,
        lockPosition: true,
        lockVisible: true,
        width: 40,
        minWidth: 40,
        maxWidth: 40,
        suppressSizeToFit: true,
        pinned: "left"
      },
      {
        headerName: "Name",
        field: "fullName"
      },
      {
        headerName: "Title",
        field: "title"
      },
      {
        headerName: "Stub Created",
        field: "stubCreated"
      },
      {
        headerName: "Licensed",
        field: "licensed"
      },
      {
        headerName: "Sofware Distributed",
        field: "softwareDistributed"
      },
      /*{
        headerName: "MFA",
        field: "mfa"
      },*/
      {
        headerName: "UPN",
        field: "upn"
      },
      {
        headerName: "Full UPN",
        field: "fullUpn"
      },
      {
        headerName: "US Person",
        field: "usPerson"
      },
      {
        headerName: "Email",
        field: "email"
      },
      {
        headerName: "BU",
        field: "bu"
      },
      {
        headerName: "Building",
        field: "building"
      },
      {
        headerName: "Address",
        field: "streetAddress"
      },
      {
        headerName: "City",
        field: "city"
      },
      {
        headerName: "State",
        field: "state"
      },
      {
        headerName: "Postal Code",
        field: "postalCode"
      },
      {
        headerName: "Country",
        field: "country"
      },
      {
        headerName: "Comm o365",
        field: "commO365"
      },
      {
        headerName: "Asset Tag",
        field: "assetTag"
      },
      {
        headerName: "OS",
        field: "OS"
      }
    ],
    rowSelection: "multiple",
    rowData: null,
    defaultColDef: {
      sortable: true,
      filter: "agTextColumnFilter",
      resizable: true,
      suppressMenu: true
    },
    statusBar: {
      statusPanels: [
        {
          statusPanel: "agSelectedRowCountComponent"
        }
      ]
    },
    sideBar: {
      toolPanels: [
        {
          id: "columns",
          labelDefault: "Columns",
          labelKey: "columns",
          iconKey: "columns",
          toolPanel: "agColumnsToolPanel",
          toolPanelParams: {
            suppressValues: true,
            suppressPivots: true,
            suppressPivotMode: true,
            suppressRowGroups: true
          }
        }
      ],
      defaultToolPanel: null
    }
  };

  onGridReady = async params => {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    const res = await axios.get(
      `/getUsers/?requester=${this.props.user.upn}&email=${this.props.emailAddress}`
    );
    if (res.status === 200) {
      this.setState({ rowData: res.data });
      var allColIds = this.gridColumnApi
        .getAllColumns()
        .map(column => column.colId);
      this.gridColumnApi.autoSizeColumns(allColIds, false);
    }
  };

  handleExportClick() {
    this.gridApi.exportDataAsCsv({ onlySelectedAllPages: true });
  }

  handleEmailClick = async email => {
    const res = await axios.post("/sendReport", {
      email: this.props.emailAddress,
      data: this.gridApi.getDataAsCsv({ onlySelectedAllPages: true })
    });
    return res;
  };

  render() {
    return (
      <div className="content-container">
        <div className="ag-theme-balham">
          <AgGridReact
            columnDefs={this.state.columnDefs}
            rowData={this.state.rowData}
            pagination={true}
            defaultColDef={this.state.defaultColDef}
            rowSelection={this.state.rowSelection}
            onGridReady={this.onGridReady}
            suppressRowClickSelection={true}
            animateRows={true}
            floatingFilter={true}
            allModules={allModules}
            statusBar={this.state.statusBar}
            sideBar={this.state.sideBar}
            suppressColumnVirtualisation={true}
          ></AgGridReact>
        </div>
        <DataButtonBar
          handleExportClick={this.handleExportClick}
          handleEmailClick={this.handleEmailClick}
          emailAddress={this.props.emailAddress}
        />
      </div>
    );
  }
}

export default Data;
