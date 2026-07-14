const mongoose = require("mongoose");

// ── ProductVariant (embedded hoặc tham chiếu) ──────────────────────────────
const variantSchema = new mongoose.Schema(
  {
    variant_id:     { type: Number, required: true },
    product_id:     { type: Number, required: true },
    color:          { type: String, default: "" },
    price:          { type: Number, required: true },
    stock_quantity: { type: Number, default: 0 },
    sku:            { type: String, default: "" },
    sale_price:     { type: Number, default: null },
  },
  { _id: false }
);

// ── Product ───────────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    product_id:        { type: Number, required: true, unique: true },
    product_name:      { type: String, required: true },
    slug:              { type: String, required: true, unique: true },
    sku:               { type: String, default: "" },
    thumbnail:         { type: String, default: "" },
    short_description: { type: String, default: "" },
    description:       { type: String, default: "" },
    warranty:          { type: String, default: "" },
    status:            { type: String, enum: ["active", "inactive"], default: "active" },
    category_id:       { type: Number, default: null },
    brand_id:          { type: Number, default: null },

    // Dữ liệu tổng hợp (denormalized để query nhanh)
    brand_name:        { type: String, default: "" },
    category_name:     { type: String, default: "" },

    // Variants nhúng để tránh join nhiều collection
    variants: [variantSchema],

    // Thống kê bán hàng (cập nhật khi có đơn hàng mới)
    total_sold:        { type: Number, default: 0 },
    avg_rating:        { type: Number, default: 0 },
    review_count:      { type: Number, default: 0 },

    // Badge hiển thị ngoài FE
    badge:             { type: String, default: "" },

    // Thông số kỹ thuật [{label, value}]
    specification: [{
      label: { type: String, default: "" },
      value: { type: String, default: "" },
    }],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "products",
  }
);

// Index tìm kiếm nhanh
productSchema.index({ status: 1, total_sold: -1 });
productSchema.index({ status: 1, avg_rating: -1 });
productSchema.index({ status: 1, created_at: -1 });               // sort "newest" (mặc định)
productSchema.index({ status: 1, category_id: 1, created_at: -1 }); // lọc theo danh mục
productSchema.index({ status: 1, brand_id: 1, created_at: -1 });    // lọc theo thương hiệu


module.exports = mongoose.model("Product", productSchema);