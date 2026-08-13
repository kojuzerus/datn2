const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["percent", "fixed", "freeship", "none"],
      required: true,
    },
    value: {
      type: Number,
    },
    maxDiscount: {
      type: Number,
      default: null,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    weight: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Voucher", voucherSchema);
