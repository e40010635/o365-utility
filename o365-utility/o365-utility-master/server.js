const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const cron = require("node-cron");
const https = require("https");
const fs = require("fs");
require("dotenv").config();
require("./models/User");
const userController = require("./controllers/userController");
const {
  syncCCloudData,
  syncGCloudData,
  syncAssetTagData,
  syncSoftwareDistributed,
  sendReport
} = require("./helpers");

mongoose.Promise = global.Promise;
mongoose.set("useFindAndModify", false);
//mongoDB connection
mongoose
  .connect(process.env.mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("Connection to CosmosDB successful"))
  .catch(err => console.error(err));

app.use(bodyParser.json());
app.use("/", router);
app.use(express.static(path.join(__dirname, "build")));

router.get("/getUsers", userController.getUsers);
router.get("/getEmailAddress", userController.getEmailAddress);
router.post("/sendReport", sendReport);

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const server = https
  .createServer(
    {
      key: fs.readFileSync("./o365.key"),
      cert: fs.readFileSync("./cert.pem"),
      passphrase: process.env.passphrase
    },
    app
  )
  .listen(process.env.SERVERPORT || 8080, () => {
    console.log(`Server is running on Port: ${server.address().port}`);
  });

/*
*
*
*
Cron Jobs below for when we need to update the DB on a schedule
Use the data fetching functions above
*
*
*
*/

// Cron Job to run every day at 11PM EST
// and update our CosmosDB
cron.schedule("0 23 * * *", async () => {
  let starting = new Date();
  console.log(
    `Starting Cron Job ${starting.getHours()}:${starting.getMinutes()}:${starting.getSeconds()}`
  );
  let syncC = new Date();
  console.log(
    `Syncing C cloud data ${syncC.getHours()}:${syncC.getMinutes()}:${syncC.getSeconds()}`
  );
  await syncCCloudData();
  let syncCComplete = new Date();
  console.log(
    `Completed syncing C cloud data ${syncCComplete.getHours()}:${syncCComplete.getMinutes()}:${syncCComplete.getSeconds()}`
  );
  let syncG = new Date();
  console.log(
    `Syncing G cloud Data ${syncG.getHours()}:${syncG.getMinutes()}:${syncG.getSeconds()}`
  );
  await syncGCloudData();
  let syncGComplete = new Date();
  console.log(
    `Completed syncing G cloud data ${syncGComplete.getHours()}:${syncGComplete.getMinutes()}:${syncGComplete.getSeconds()}`
  );
  console.log("Syncing SQL data");
  await syncAssetTagData();
  console.log("Completed syncing SQL data");
  console.log("Syncing Software Distributed data");
  await syncSoftwareDistributed();
  console.log("Completed syncing Software Distributed data");
  let ending = new Date();
  console.log(
    `Ending Cron Job ${ending.getHours()}:${ending.getMinutes()}:${ending.getSeconds()}`
  );
});
