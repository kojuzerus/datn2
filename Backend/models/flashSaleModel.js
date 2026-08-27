const mongoose = require("mongoose");

const flashSaleSchema = new mongoose.Schema(
  {
    name:               { type: String, required: true, trim: true },

    // Tham chiếu tới product_variants._id (collection Variant)
    variant_id:         { type: mongoose.Schema.Types.ObjectId, ref: "Variant", required: true },

    sale_price:         { type: Number, required: true, min: 0 },
    quantity:           { type: Number, required: true, min: 1 },
    remaining_quantity: { type: Number, required: true, min: 0 },
    sold_quantity:      { type: Number, default: 0, min: 0 },

    start_time:         { type: Date, required: true },
    end_time:            { type: Date, required: true },

    status:             { type: String, enum: ["active", "inactive"], default: "active" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "flash_sale",
  }
);

flashSaleSchema.index({ status: 1, start_time: 1, end_time: 1 });
flashSaleSchema.index({ variant_id: 1 });

module.exports = mongoose.model("FlashSale", flashSaleSchema);
