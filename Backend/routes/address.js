const express = require("express");
const router  = express.Router();
const Address = require("../models/addressModel");
const auth    = require("../middleware/auth");

// GET /api/addresses — lấy tất cả địa chỉ của user
router.get("/", auth, async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.userId }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, data: addresses });
  } catch {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// POST /api/addresses — thêm địa chỉ mới
router.post("/", auth, async (req, res) => {
  try {
    const { receiverName, phone, province, district, ward, detailAddress, isDefault } = req.body;
    if (!receiverName || !phone || !province || !district || !ward || !detailAddress)
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });

    // Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ cũ
    if (isDefault) {
      await Address.updateMany({ userId: req.userId }, { isDefault: false });
    }

    // Nếu chưa có địa chỉ nào, tự động đặt làm mặc định
    const count = await Address.countDocuments({ userId: req.userId });
    const address = await Address.create({
      userId: req.userId, receiverName, phone, province, district, ward, detailAddress,
      isDefault: isDefault || count === 0,
    });

    res.status(201).json({ success: true, data: address });
  } catch {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// PUT /api/addresses/:id — cập nhật địa chỉ
router.put("/:id", auth, async (req, res) => {
  try {
    const addr = await Address.findOne({ _id: req.params.id, userId: req.userId });
    if (!addr) return res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ" });

    const { receiverName, phone, province, district, ward, detailAddress, isDefault } = req.body;

    if (isDefault && !addr.isDefault) {
      await Address.updateMany({ userId: req.userId }, { isDefault: false });
    }

    Object.assign(addr, { receiverName, phone, province, district, ward, detailAddress, isDefault });
    await addr.save();

    res.json({ success: true, data: addr });
  } catch {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// PUT /api/addresses/:id/default — đặt làm địa chỉ mặc định
router.put("/:id/default", auth, async (req, res) => {
  try {
    const addr = await Address.findOne({ _id: req.params.id, userId: req.userId });
    if (!addr) return res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ" });

    await Address.updateMany({ userId: req.userId }, { isDefault: false });
    addr.isDefault = true;
    await addr.save();

    res.json({ success: true, message: "Đã đặt làm địa chỉ mặc định" });
  } catch {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// DELETE /api/addresses/:id — xóa địa chỉ
router.delete("/:id", auth, async (req, res) => {
  try {
    const addr = await Address.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!addr) return res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ" });

    // Nếu xóa địa chỉ mặc định, tự động đặt địa chỉ mới nhất làm mặc định
    if (addr.isDefault) {
      const next = await Address.findOne({ userId: req.userId }).sort({ createdAt: -1 });
      if (next) { next.isDefault = true; await next.save(); }
    }

    res.json({ success: true, message: "Đã xóa địa chỉ" });
  } catch {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
