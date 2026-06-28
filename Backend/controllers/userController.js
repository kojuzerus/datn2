const User  = require("../models/User");
const Order = require("../models/orderModel");

// ── [GET] /api/admin/users ──────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const { search = "", role = "", status = "", page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role)   filter.role = role;
    if (status) filter.status = status;
    if (search) {
      const re = new RegExp(search.trim(), "i");
      filter.$or = [{ hoTen: re }, { email: re }, { soDienThoai: re }];
    }

    const pageNum  = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip     = (pageNum - 1) * limitNum;

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).select("-matKhau").sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    ]);

    const userIds = users.map((u) => u._id);
    const orderStats = await Order.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: {
        _id: "$userId",
        orderCount: { $sum: 1 },
        totalSpent: { $sum: { $cond: [{ $ne: ["$trangThai", "da_huy"] }, "$tongThanhToan", 0] } },
      } },
    ]);
    const statsMap = {};
    orderStats.forEach((s) => { statsMap[s._id.toString()] = s; });

    const data = users.map((u) => {
      const stat = statsMap[u._id.toString()];
      return {
        id:          u._id,
        hoTen:       u.hoTen || "(Chưa có tên)",
        email:       u.email || "",
        soDienThoai: u.soDienThoai || "",
        role:        u.role || "user",
        status:      u.status || "active",
        authType:    u.googleId ? "google" : u.zaloId ? "zalo" : "local",
        createdAt:   u.createdAt,
        orderCount:  stat?.orderCount || 0,
        totalSpent:  stat?.totalSpent || 0,
      };
    });

    res.json({
      success: true,
      data,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error("[getAllUsers]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [GET] /api/admin/users/:id ──────────────────────────────────────────────
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-matKhau").lean();
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });

    const orders = await Order.find({ userId: req.params.id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: { ...user, orders } });
  } catch (err) {
    console.error("[getUserById]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [PUT] /api/admin/users/:id/status ───────────────────────────────────────
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "banned"].includes(status))
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select("-matKhau");
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("[updateUserStatus]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [PUT] /api/admin/users/:id/role ─────────────────────────────────────────
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role))
      return res.status(400).json({ success: false, message: "Vai trò không hợp lệ" });

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-matKhau");
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("[updateUserRole]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ── [DELETE] /api/admin/users/:id ───────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
    res.json({ success: true, message: "Đã xoá khách hàng" });
  } catch (err) {
    console.error("[deleteUser]", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};
