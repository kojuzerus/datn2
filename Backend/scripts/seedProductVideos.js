// Tìm video "đánh giá <tên sản phẩm>" trên YouTube và lưu video_id cho từng sản phẩm.
// Chạy:  node scripts/seedProductVideos.js          → chỉ điền sản phẩm chưa có video
//        node scripts/seedProductVideos.js --force  → tìm lại toàn bộ
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Product = require("../models/productModel");

const FORCE = process.argv.includes("--force");

async function findVideoId(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      "Accept-Language": "vi-VN,vi;q=0.9",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
  });
  if (!res.ok) return null;
  const html = await res.text();
  return html.match(/"videoId":"([\w-]{11})"/)?.[1] ?? null;
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const filter = FORCE ? {} : { $or: [{ video_id: "" }, { video_id: { $exists: false } }] };
  const products = await Product.find(filter).select("product_id product_name video_id").lean();
  console.log(`Tìm video cho ${products.length} sản phẩm...`);

  let ok = 0;
  for (const p of products) {
    try {
      const videoId = await findVideoId(`đánh giá ${p.product_name}`);
      if (videoId) {
        await Product.updateOne({ product_id: p.product_id }, { $set: { video_id: videoId } });
        console.log(`✔ ${p.product_name} → https://youtu.be/${videoId}`);
        ok++;
      } else {
        console.log(`✘ ${p.product_name} → không tìm thấy`);
      }
    } catch (err) {
      console.log(`✘ ${p.product_name} → lỗi: ${err.message}`);
    }
    // Nghỉ ngắn giữa các request cho lịch sự với YouTube
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`Xong: ${ok}/${products.length} sản phẩm có video.`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
