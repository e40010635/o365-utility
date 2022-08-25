const mongoose = require("mongoose");
const User = mongoose.model("users");
const {
  getBU,
  determineUsPerson,
  determineCommLicensed,
  determineGovLicensed,
  determineIsAdmin
} = require("../helpers");
const cache = require("memory-cache");
let memCache = new cache.Cache();

//function that queries our MongoDB to get all users
//if user is an admin, they see all data. Otherwise data is all users
//where the BU equals the same BU as the requestor - both DB and requesters BU is based on UPN
exports.getUsers = async (req, res) => {
  let bu;
  if (await determineIsAdmin(req.query.requester)) {
    bu = ["Corporate", "Pratt & Whitney", "PWC", "Collins Aerospace", "UTRC"];
  } else {
    bu = getBU(req.query.requester, req.query.email);
  }
  let cacheContent = memCache.get(bu);
  if (cacheContent) {
    console.log("Cached mem found");
    res.send(cacheContent);
  } else {
    console.log("No cached mem found");
    User.find({ bu: { $in: bu } }, function (err, result) {
      if (err) {
        res.send(err);
      } else {
        let now = new Date();
        let hoursToCache = 24 - now.getHours() + 3;
        let mSecondsToCache = hoursToCache * 60 * 60 * 1000;
        console.log(`Cached for ${hoursToCache} hrs`);
        console.log(`Cached for ${mSecondsToCache} ms`);
        memCache.put(bu, result, mSecondsToCache);
        res.send(result);
      }
    });
  }
};

exports.getEmailAddress = async (req, res) => {
  if (req.query.requester) {
    User.findOne({ fullUpn: req.query.requester.toLowerCase() }, function (
      err,
      result
    ) {
      if (err) {
        res.status(500).send(err);
      } else {
        if (result) {
          res.status(200).send(result.email);
        } else {
          res.status(500).send(result);
        }
      }
    });
  }
};

//Function that takes in an array via req
//Looping through the array we can check if the user exists in our DB
//if they do, we update their document. If they don't we create them a document.
exports.syncCCloudData = async (req, res) => {
  for (const user of req) {
    const doesUserExist = await User.findOne({
      fullUpn: user.userPrincipalName.toLowerCase()
    });
    //this person doesn't exist in our DB yet
    if (doesUserExist === null) {
      //this user is not terminated
      if (!user.displayName.startsWith("*T")) {
        const userObj = {
          fullName: `${user.givenName} ${user.surname}`,
          title: user.jobTitle,
          stubCreated: false,
          licensed: "false",
          upn: user.userPrincipalName
            .slice(0, user.userPrincipalName.indexOf("@"))
            .toLowerCase(),
          fullUpn: user.userPrincipalName.toLowerCase(),
          usPerson: determineUsPerson(user.displayName),
          email: user.mail,
          bu: getBU(user.userPrincipalName, user.mail),
          building: user.officeLocation,
          streetAddress: user.streetAddress,
          city: user.city,
          state: user.state,
          postalCode: user.postalCode,
          country: user.country,
          commO365: determineCommLicensed(user.assignedLicenses)
        };
        //inserts user to DB
        await User.create(userObj);
      }
    } else {
      //this person exists in our DB, we need to update it
      //this person is not terminated
      if (!user.displayName.startsWith("*T")) {
        await User.findOneAndUpdate(
          { fullUpn: user.userPrincipalName.toLowerCase() },
          {
            $set: {
              fullName: `${user.givenName} ${user.surname}`,
              title: user.jobTitle,
              upn: user.userPrincipalName
                .slice(0, user.userPrincipalName.indexOf("@"))
                .toLowerCase(),
              fullUpn: user.userPrincipalName.toLowerCase(),
              usPerson: determineUsPerson(user.displayName),
              email: user.mail,
              bu: getBU(user.userPrincipalName, user.mail),
              building: user.officeLocation,
              streetAddress: user.streetAddress,
              city: user.city,
              state: user.state,
              postalCode: user.postalCode,
              country: user.country,
              commO365: determineCommLicensed(user.assignedLicenses)
            }
          }
        );
      } else {
        //this person is terminated -- we need to remove them from the DB
        await User.findOneAndDelete({
          fullUpn: user.userPrincipalName.toLowerCase()
        });
      }
    }
  }
};

//Function that takes in an array via req
//Looping through the array we check to see if the user exists in our DB
//if they do exist we update that document
exports.syncGCloudData = async (req, res) => {
  for (const user of req) {
    if (user.userPrincipalName.includes("@azg.")) {
      await User.findOneAndUpdate(
        {
          fullUpn: user.userPrincipalName.split("@azg.").join("@").toLowerCase()
        },
        {
          $set: {
            stubCreated: true,
            licensed: determineGovLicensed(user.assignedLicenses)
          }
        }
      );
    }
  }
};

//Function that takes in an array via req
//Loops through each obj to check if the asset tag user exists in our DB
//If they do exist, we update that document
exports.syncAssetTagData = async (req, res) => {
  for (const user of req.recordset) {
    if (user.SCCM_UserName && user.TAG_NUMBER) {
      await User.findOneAndUpdate(
        { upn: user.SCCM_UserName.toLowerCase() },
        {
          $set: {
            assetTag: user.TAG_NUMBER.toLowerCase(),
            OS: user.ActiveDirectoryOS
          }
        }
      );
    }
  }
};

exports.syncSoftwareDistributed = async (req, res) => {
  for (const user of req.recordset) {
    if (user.NAME) {
      await User.findOneAndUpdate(
        { assetTag: user.NAME.toLowerCase() },
        {
          $set: {
            softwareDistributed: user.DeploymentStateMessage
          }
        }
      );
    }
  }
};
