require("dotenv").config();
const mongoose = require("mongoose");
const Product  = require("../models/productModel");
const Order    = require("../models/orderModel");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const orders = await Order.find({ trangThai: { $ne: "da_huy" } }).lean();
  const soldMap = {};
  orders.forEach((o) => {
    (o.items || []).forEach((i) => {
      const product_id = parseInt(i.productId);
      if (!isNaN(product_id)) soldMap[product_id] = (soldMap[product_id] || 0) + (i.soLuong || 0);
    });
  });

  const products = await Product.find().select("product_id product_name total_sold").lean();
  let updated = 0;
  for (const p of products) {
    const real = soldMap[p.product_id] || 0;
    if (real !== p.total_sold) {
      await Product.updateOne({ product_id: p.product_id }, { $set: { total_sold: real } });
      console.log(`#${p.product_id} ${p.product_name}: ${p.total_sold} -> ${real}`);
      updated++;
    }
  }

  console.log(`\nĐã cập nhật total_sold cho ${updated}/${products.length} sản phẩm theo dữ liệu đơn hàng thật.`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
