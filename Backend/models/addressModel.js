const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  receiverName:   { type: String, required: true, trim: true },
  phone:          { type: String, required: true, trim: true },
  province:       { type: String, required: true, trim: true },
  district:       { type: String, required: true, trim: true },
  ward:           { type: String, required: true, trim: true },
  detailAddress:  { type: String, required: true, trim: true },
  isDefault:      { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Address", addressSchema);
