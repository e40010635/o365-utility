const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = new Schema({
  fullName: {
    type: String
  },
  title: {
    type: String
  },
  status: {
    type: String
  },
  stubCreated: {
    type: Boolean
  },
  licensed: {
    type: String
  },
  softwareDistributed: {
    type: String
  },
  mfa: {
    type: Boolean
  },
  upn: {
    type: String
  },
  fullUpn: {
    type: String
  },
  usPerson: {
    type: Boolean
  },
  email: {
    type: String
  },
  bu: {
    type: String
  },
  building: {
    type: String
  },
  streetAddress: {
    type: String
  },
  city: {
    type: String
  },
  state: {
    type: String
  },
  postalCode: {
    type: String
  },
  country: {
    type: String
  },
  commO365: {
    type: Boolean
  },
  assetTag: {
    type: String
  },
  OS: {
    type: String
  }
});

module.exports = mongoose.model("users", User);
