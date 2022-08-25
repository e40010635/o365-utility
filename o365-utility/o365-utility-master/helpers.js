require("dotenv").config();
const userController = require("./controllers/userController");
const qs = require("qs");
const axios = require("axios");
const sql = require("mssql");
const nodemailer = require("nodemailer");
const fs = require("fs");
const util = require("util");

//mssql config
const sqlConfig = {
  user: process.env.sqlUsername,
  password: process.env.sqlPassword,
  server: process.env.sqlServer,
  database: process.env.sqlDB,
  requestTimeout: 100000,
  options: {
    encrypt: false,
    enableArithAbort: true
  }
};

module.exports.handleError = err => {
  console.log("Catching Error!!!");
  console.log(err);
};

module.exports.getBU = (upn, email) => {
  if (
    [
      "@utccgl.com",
      "@utc.com",
      "@ap.corp.utc.com",
      "@eu.corp.utc.com",
      "@corp.utc.com"
    ].some(el => upn.toLowerCase().includes(el))
  ) {
    return "Corporate";
  } else if (
    ["@utcaus.com", "@collins.com", "@hs.utc.com", "@hs.utcitar.us"].some(el =>
      upn.toLowerCase().includes(el)
    )
  ) {
    return "Collins Aerospace";
  } else if (["@utcain.com"].some(el => upn.toLowerCase().includes(el))) {
    const emailEnding = email.split("@")[1];
    if (emailEnding === "prattwhitney.com") {
      return "Pratt & Whitney";
    } else if (emailEnding === "pwc.ca" || emailEnding === "nox.pwc.ca") {
      return "PWC";
    } else if (emailEnding === "utrc.utc.com") {
      return "UTRC";
    } else {
      return "Collins Aerospace";
    }
  } else if (
    ["@pwus.us", "@pwintl.us"].some(el => upn.toLowerCase().includes(el))
  ) {
    return "Pratt & Whitney";
  } else if (
    ["@corp.utcitar.us", "@utcitar.us"].some(el =>
      upn.toLowerCase().includes(el)
    )
  ) {
    return "UTRC";
  } else if (
    ["@pwc.ca", "@pwc.utcitar.us", "@pwc.utc.com"].some(el =>
      upn.toLowerCase().includes(el)
    )
  ) {
    return "PWC";
  }
};

module.exports.determineUsPerson = displayName => {
  return displayName.toLowerCase().includes("export license required")
    ? false
    : true;
};

//Donna advised these are the possible skuId's a user would have if they are c cloud o365 licensed
//First is E3, second is Pro-Plus. If they have one or the other, this field will be true
module.exports.determineCommLicensed = assignedLicenses => {
  return assignedLicenses.some(
    obj =>
      obj.skuId == "6fd2c87f-b296-42f0-b197-1e91e994b900" ||
      obj.skuId == "c2273bd0-dff7-4215-9ef5-2c7bcfb06425"
  );
};

//Donna advised these are the possible skuId's a user would have if they are g cloud o365 licensed
//First is G3, second is G1. If they have both, we set the value to G1 & G3. If they only have one or the
//other we set it to that value, or we set it to blank if they have neither.
module.exports.determineGovLicensed = assignedLicenses => {
  if (
    assignedLicenses.some(
      obj => obj.skuId === "2e8b4075-8ddc-4b43-bdfa-e91a762a8e45"
    ) &&
    assignedLicenses.some(
      obj => obj.skuId === "3d8d13d7-77e0-4d18-8758-e16fa925c3dd"
    )
  ) {
    return "G1 & G3";
  } else if (
    assignedLicenses.some(
      obj => obj.skuId === "2e8b4075-8ddc-4b43-bdfa-e91a762a8e45"
    )
  ) {
    return "G3";
  } else if (
    assignedLicenses.some(
      obj => obj.skuId === "3d8d13d7-77e0-4d18-8758-e16fa925c3dd"
    )
  ) {
    return "G1";
  } else {
    return "false";
  }
};

/*
*
*
*
Fetching data functions to eventually fill DB below
*
*
*
*/

//Function that fetches an API token based on the tenant and client id/secret
//It can generate a token for different teanants/clouds
module.exports.fetchToken = async (tokenEndpoint, client_id, client_secret) => {
  try {
    const res = await axios.post(
      tokenEndpoint,
      qs.stringify({
        client_id,
        client_secret,
        grant_type: "client_credentials",
        scope: process.env.scope
      })
    );
    return res.data.access_token;
  } catch (err) {
    this.handleError(err);
  }
};

//Function that fetches 'data' from a url with authorization of a bearer token
//This function will usually be called after fetchToken() so you can supply a token
module.exports.fetchData = async (bearer, url) => {
  try {
    const res = await axios.get(url, {
      headers: {
        Authorization: bearer
      }
    });
    return res;
  } catch (err) {
    this.handleError(err);
  }
};

//Function that fetches user data
//Gets a bearer token for authorization from fetchToken()
//fetchData is called and we supply it our bearer token, our MS Graph API endpoint, and query that you supply
//A response includes data, and a url for more data
//We will loop and continue fetching data until a url is not supplied from a response
module.exports.fetchUsers = async (
  tokenEndpoint,
  client_id,
  client_secret,
  query
) => {
  try {
    let allUsers = [];
    let bearer = `Bearer ${await this.fetchToken(
      tokenEndpoint,
      client_id,
      client_secret
    )}`;
    let res = await this.fetchData(bearer, `${process.env.msAPI}${query}`);
    if (res.status === 200) {
      allUsers.push(...res.data.value);
      console.log(allUsers.length);
      let nextURL = res.data["@odata.nextLink"];
      while (nextURL != undefined) {
        bearer = `Bearer ${await this.fetchToken(
          tokenEndpoint,
          client_id,
          client_secret
        )}`;
        res = await this.fetchData(bearer, nextURL);
        allUsers.push(...res.data.value);
        nextURL = res.data["@odata.nextLink"];
        console.log(allUsers.length);
      }
    }
    return allUsers;
  } catch (err) {
    this.handleError(err);
  }
};

//Function that gets an array from fetchUsers(), then passes it to userController.importUsers()
//This adds the Azure AD users to our CosmosDB
//Only used for dev purposes, otherwise the DB should be populated via cron job
module.exports.importUsers = async () => {
  try {
    const allUsers = await fetchUsers(
      process.env.tokenEndpoint_cCloud,
      process.env.client_id_cCloud,
      process.env.client_secret_cCloud,
      process.env.cCloudQuery
    );
    userController.importUsers(allUsers);
    return allUsers;
  } catch (err) {
    this.handleError(err);
  }
};

//Function that gets all C cloud users in an array
//passes the array to userController.syncCCloudData
module.exports.syncCCloudData = async () => {
  try {
    const cCloudUsers = await this.fetchUsers(
      process.env.tokenEndpoint_cCloud,
      process.env.client_id_cCloud,
      process.env.client_secret_cCloud,
      process.env.cCloudQuery
    );
    return await userController.syncCCloudData(cCloudUsers);
  } catch (err) {
    this.handleError(err);
  }
};

//Function that gets all G cloud users in an array
//passes the array to userController.syncGCloudData
module.exports.syncGCloudData = async () => {
  try {
    const gCloudUsers = await this.fetchUsers(
      process.env.tokenEndpoint_gCloud,
      process.env.client_id_gCloud,
      process.env.client_secret_gCloud,
      process.env.gCloudQuery
    );
    return await userController.syncGCloudData(gCloudUsers);
  } catch (err) {
    this.handleError(err);
  }
};

//Function that connects to our SQL DB
//queries all users from User_Devices
//closes sql connection
module.exports.fetchSqlData = async queryString => {
  try {
    await sql.connect(sqlConfig);
    const results = await sql.query(queryString);
    await sql.close();
    return results;
  } catch (err) {
    this.handleError(err);
  }
};

module.exports.syncSoftwareDistributed = async () => {
  try {
    const sqlData = await this.fetchSqlData(
      `SELECT NAME, DeploymentStateMessage FROM vwPR_Microsoft_Office_365_ProPlus WHERE DeploymentName='Install Microsoft Office 365 ProPlus - r5.7 (SCCM)'`
    );
    await userController.syncSoftwareDistributed(sqlData);
  } catch (err) {
    this.handleError(err);
  }
};

//Function that gets all sql data from our sql DB
//Passes the array of sql data to syncAssetTagData in userController
module.exports.syncAssetTagData = async () => {
  try {
    const sqlData = await this.fetchSqlData(
      `SELECT TAG_NUMBER, ActiveDirectoryOS, SCCM_UserName FROM vw_SCCMPatchStatus`
    );
    await userController.syncAssetTagData(sqlData);
  } catch (err) {
    this.handleError(err);
  }
};

//Function that determins whether user accessing web app is a GUI Admin
//GUI Admins should be in the Azure AD Group 'O365-GUI-Admin'
module.exports.determineIsAdmin = async upn => {
  let bearer = `Bearer ${await this.fetchToken(
    process.env.tokenEndpoint_cCloud,
    process.env.client_id_cCloud,
    process.env.client_secret_cCloud
  )}`;
  let res = await this.fetchData(
    bearer,
    `${process.env.msAPI}${process.env.cCloudAdminQuery}`
  );
  if (res.status === 200) {
    return res.data.value.some(el => upn.includes(el.userPrincipalName));
  } else {
    return false;
  }
};

//Email stuff:
//TODO:
//SMTP Logging is on and must be searchable
//if connection to mailhub fails, failover to another mailhub
//if sending message fails, message is queued and retried in a few minutes
//from address needs to be working mailbox to receive returned error messages
//end server should have DNS reverse lookup record
//eventually app will need to be registered but current process is retired
module.exports.sendReport = async (req, res) => {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "mailhub.utc.com",
    port: 25,
    secure: false, // true for 465, false for other ports
    tls: {
      rejectUnauthorized: false
    }
  });

  // send mail with defined transport object
  transporter.sendMail(
    {
      from: '"Office 365" <O365Utility@rtx.com>', // sender address
      to: '"GP UTCHQ 0365 Program" <O365_Program@utc.com>', // list of receivers
      cc: req.body.email,
      subject: "O365 Export", // Subject line
      text: "", // plain text body
      html: "", // html body
      attachments: [
        {
          filename: "export.csv",
          content: req.body.data
        }
      ]
    },
    (err, info) => {
      if (err) {
        const today = new Date();
        const today_date =
          today.getFullYear() +
          "-" +
          (today.getMonth() + 1) +
          "-" +
          today.getDate();
        const today_time =
          today.getHours() +
          ":" +
          today.getMinutes() +
          ":" +
          today.getSeconds();
        const email_log_path = "./error_log.log"; //depends if linux or windows, ie: C:\\Users\\Rapapomi-a\\Desktop\\o365-utility\\email_log.log

        fs.appendFile(
          email_log_path,
          "\n" + today_date + " " + today_time + "\n" + util.format(err) + "\n",
          function (err) {
            if (err) throw err;
            console.log("Saved!");
          }
        );
        const log_stdout = process.stdout;
        log_stdout.write(util.format(err) + "\n");
        res.status(500).send(err);
      } else {
        res.status(200).send(info);
      }
    }
  );
};
