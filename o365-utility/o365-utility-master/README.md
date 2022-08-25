Created by Jake Fanelli DTLP Class 16 (with help from Mike Rapaport)  
Documentation last updated April 2020

## Production Scripts

In the project directory you should have a build folder

### `node server.js`

When you access the server it will serve files from the build folder.

## Available Dev Scripts

In the project directory, you can run:

### `npm run dev`

Starts the Node/Express server on localhost:8080

### `npm start`

Starts the react frontend on localhost:3000

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

# App Architecture/Documentation

- controllers
  - userController.js -> Responsible for interacting/altering the DB with use of the model for actions on Users
    - Also contains the Asset Tag Data sync, GCloud Data sync, and a dev feature for quickly importing user subsets.
- models
  - User.js -> where a User object is defined with its fields/variables
- public
  - icons, manifest, etc
  - index.html -> React App default template/O365 Header
- src
  - components -> contains relevant non-template code
    - Data.js -> The component responsible for the data table. Column + Row data will be populated from DB
    - DataButtonBar.js -> Component responsible for the bottom portion of the page with buttons
    - Navbar.js -> Header + Logout dropdown button
    - NoMatch.js -> just a 404 page for when a URL is hit that we don't have a component for
    - RotorModalInput -> Rotor Modal and takes in an email address to send the report to
  - App.css -> Custom CSS styling
  - App.js -> Main React starting point
  - adalConfig -> Azure AD support for React JS
  - index.css -> Out of the box React styling
  - index.js -> utility code for logging in using ADAL/CosmosDB
  - indexapp.js -> Out of the box loading App.js into DOM
  - serviceworker.js -> webserver utility code from React template
  - setupTests.js -> more template/boilerplate utility code from React
- README.md -> Documentation (This File)
- error_log.log -> generated file containing error logging
- helpers.js -> helper functions as follows:
  - has sql db connection for asset tag data
  - formats BU based on UPN
  - calculates USPerson based on display name
  - determines com and gov license status
  - grabs API token for each tenant/cloud
  - fetches Azure AD Data using Microsoft Graph API
  - imports users to CosmosDB
  - Syncs C cloud and G cloud data
  - calculates type of user (Admin, Collins, Pratt etc)
  - Creates email connection to utc mailhub
- package.json npm scripts/packages/etc.
- server.js -> Web Server code, async calls, console logging
