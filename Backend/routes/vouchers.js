const express = require("express");
const router = express.Router();
const Voucher = require("../models/Voucher");

// 1. API lấy danh sách ô quay thưởng cho Frontend
router.get("/prizes", async (req, res) => {
  try {
    const prizes = await Voucher.find({ isActive: true });
    res.json(prizes);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tải danh sách giải thưởng" });
  }
});

// 2. API kiểm tra trạng thái quay của user
router.get("/spin-status", async (req, res) => {
  try {
    // Tạm thời trả về false để test giao diện quay
    res.json({ hasSpun: false, voucher: null });
  } catch (err) {
    res.status(500).json({ message: "Lỗi kiểm tra trạng thái" });
  }
});

// 3. API xử lý quay thưởng (Chọn ngẫu nhiên dựa theo trọng số weight)
router.post("/spin", async (req, res) => {
  try {
    const vouchers = await Voucher.find({ isActive: true });
    if (!vouchers.length) {
      return res
        .status(400)
        .json({ message: "Hiện không có chương trình quay số" });
    }

    // Tính tổng weight và quay ngẫu nhiên
    const totalWeight = vouchers.reduce((acc, v) => acc + (v.weight || 1), 0);
    let random = Math.random() * totalWeight;
    let selectedVoucher = vouchers[0];

    for (const v of vouchers) {
      if (random < (v.weight || 1)) {
        selectedVoucher = v;
        break;
      }
      random -= v.weight || 1;
    }

    res.json({
      success: true,
      voucher: selectedVoucher,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xử lý lượt quay" });
  }
});

module.exports = router;
