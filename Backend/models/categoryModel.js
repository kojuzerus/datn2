const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  category_id: { type: Number, required: true, unique: true },
  category_name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  parent_id: { type: Number, default: null },
  image_url: { type: String, default: "" },
  status: { type: String, default: "active" },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Category", categorySchema);
