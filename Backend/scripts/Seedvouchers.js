const mongoose = require("mongoose");
require("dotenv").config();
const Voucher = require("../models/Voucher");
const UserVoucher = require("../models/UserVoucher");

// ⚠️ Kiểm tra file .env của bạn dùng đúng tên biến này không.
// Các tên phổ biến: MONGO_URI, MONGODB_URI, DB_URI, DATABASE_URL...
// Mở file .env lên xem, nếu tên khác thì đổi lại dòng dưới cho khớp.
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function seed() {
  if (!MONGO_URI) {
    console.error(
      "❌ Không tìm thấy chuỗi kết nối MongoDB trong .env. " +
        "Kiểm tra lại tên biến (MONGO_URI hoặc MONGODB_URI) rồi thử lại.",
    );
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("✅ Đã kết nối MongoDB");

  // Xoá voucher cũ trước khi seed lại (tránh trùng "code" gây lỗi unique)
  await Voucher.deleteMany({});
  console.log("🗑️  Đã xoá voucher cũ (nếu có)");

  // ⚠️ QUAN TRỌNG: insertMany() sẽ tạo _id (ObjectId) MỚI cho mỗi voucher.
  // Mọi UserVoucher đang trỏ (voucherId) đến voucher cũ sẽ trở thành "mồ côi"
  // (voucherId không còn tồn tại) -> khi populate("voucherId") sẽ ra null
  // -> applyVoucher báo "Mã giảm giá không hợp lệ" dù UserVoucher vẫn còn code đúng.
  // Vì vậy phải dọn luôn UserVoucher cũ mỗi lần reseed để tránh lỗi này.
  const deletedUserVouchers = await UserVoucher.deleteMany({});
  console.log(
    `🗑️  Đã xoá ${deletedUserVouchers.deletedCount} UserVoucher cũ (vì voucherId cũ không còn hợp lệ sau khi reseed)`,
  );

  const vouchers = await Voucher.insertMany([
    {
      code: "SPIN5",
      label: "Giảm 5%",
      type: "percent",
      value: 5,
      maxDiscount: 100000,
      minOrderValue: 200000,
      weight: 30,
      isActive: true,
    },
    {
      code: "SPIN10",
      label: "Giảm 10%",
      type: "percent",
      value: 10,
      maxDiscount: 200000,
      minOrderValue: 300000,
      weight: 20,
      isActive: true,
    },
    {
      code: "SPIN50K",
      label: "Giảm 50.000đ",
      type: "fixed",
      value: 50000,
      minOrderValue: 500000,
      weight: 15,
      isActive: true,
    },
    {
      code: "FREESHIP",
      label: "Miễn phí ship",
      type: "freeship",
      value: 0,
      minOrderValue: 0,
      weight: 25,
      isActive: true,
    },
    {
      code: "TRYAGAIN",
      label: "Chúc may mắn lần sau",
      type: "none",
      value: 0,
      weight: 10,
      isActive: true,
    },
  ]);

  console.log(`🎉 Đã tạo ${vouchers.length} voucher cho vòng quay:`);
  vouchers.forEach((v) => console.log(`   - ${v.code}: ${v.label}`));

  await mongoose.disconnect();
  console.log(
    "✅ Hoàn tất! Vì UserVoucher cũ đã bị xoá, bạn cần bấm 'Quay số' lại " +
      "trên web để nhận voucher mới (voucher cũ trong tài khoản test sẽ không còn dùng được).",
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Lỗi khi seed voucher:", err);
  process.exit(1);
});
