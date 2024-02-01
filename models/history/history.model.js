const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");
const getmac = require("getmac");
const MACAddress = getmac.default();
const complexityOptions = {
  min: 6,
  max: 30,
  lowerCase: 0,
  upperCase: 0,
  numeric: 0,
  symbol: 0,
  requirementCount: 2,
};

const HistorySchema = new mongoose.Schema({
  lastLogin: { type: String, required: false }, //เวลาล็อคินล่าสุด
  ipAdress: { type: String, required: false }, //id ของเครื่องที่ login
  status: { type: Boolean, required: false, default: true },
});
HistorySchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, name: this.name, row: "member", MACAddress, ipAddress: this.ipAddress },
    process.env.JWTPRIVATEKEY,
    {
      expiresIn: "4h",
    }
  );
  return token;
};
const History = mongoose.model("History", HistorySchema);
module.exports = { History };
