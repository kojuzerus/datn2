const mongoose = require("mongoose");

const siteSettingSchema = new mongoose.Schema(
  {
    _id:         { type: String, default: "main" },
    siteName:    { type: String, default: "SmartHub" },
    logoUrl:     { type: String, default: "" },
    faviconUrl:  { type: String, default: "" },
    phone:       { type: String, default: "" },
    email:       { type: String, default: "" },
    address:     { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false, timestamps: true }
);

module.exports = mongoose.model("SiteSetting", siteSettingSchema);
