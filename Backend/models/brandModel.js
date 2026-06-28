const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema({
  brand_id: { type: Number, required: true, unique: true },
  brand_name: { type: String, required: true },
  logo: { type: String, default: "" },
  category_ids: { type: [Number], default: [] },
  description: { type: String, default: "" },
  status: { type: String, default: "active" },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Brand", brandSchema);
