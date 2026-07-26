require("dotenv").config();
const mongoose     = require("mongoose");
const ProductImage = require("../models/productImageModel");

// Ảnh Titan Trắng đã có sẵn trong thư viện ảnh sản phẩm (product_images),
// nhưng chưa gán variant_id nào -> biến thể "Titan Trắng" không có ảnh riêng
// và rơi về ảnh mặc định khi chọn.
const FIXES = [
  { variant_id: 2, image_url: "https://cdn2.cellphones.com.vn/358x/media/catalog/product/i/p/iphone15-pro-max-titan-trang.jpg" },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const fix of FIXES) {
    const existing = await ProductImage.findOne({ variant_id: fix.variant_id, image_url: fix.image_url });
    if (existing) {
      console.log(`variant_id ${fix.variant_id}: ảnh đã tồn tại, bỏ qua.`);
      continue;
    }
    const last = await ProductImage.findOne().sort({ image_id: -1 }).select("image_id").lean();
    const image_id = (last?.image_id ?? 0) + 1;
    await ProductImage.create({ image_id, variant_id: fix.variant_id, image_url: fix.image_url, sort_order: 0 });
    console.log(`variant_id ${fix.variant_id}: đã gán ảnh (image_id ${image_id}).`);
  }

  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
