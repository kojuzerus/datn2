const Order = require("../models/orderModel");
const Cart  = require("../models/cartModel");

// POST /api/orders — Tạo đơn hàng từ giỏ hàng
exports.createOrder = async (req, res) => {
  try {
    const {
      receiverName, phone, province, district, ward, detailAddress,
      paymentMethod = "cod",
      ghiChu = "",
      itemIds,          // mảng _id item được chọn (tuỳ chọn, nếu không có thì lấy tất cả)
    } = req.body;

    if (!receiverName || !phone || !province || !district || !ward || !detailAddress)
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin giao hàng" });

    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ success: false, message: "Giỏ hàng trống" });

    // Lọc item theo danh sách được chọn (nếu có)
    const orderItems = (itemIds && itemIds.length > 0)
      ? cart.items.filter(i => itemIds.includes(i._id.toString()))
      : cart.items;

    if (orderItems.length === 0)
      return res.status(400).json({ success: false, message: "Không có sản phẩm nào được chọn" });

    const tongTien      = orderItems.reduce((s, i) => s + i.gia * i.soLuong, 0);
    const phiGiaoHang   = tongTien >= 500000 ? 0 : 30000;
    const tongThanhToan = tongTien + phiGiaoHang;

    const order = await Order.create({
      userId: req.userId,
      items: orderItems.map(i => ({
        productId:  i.productId,
        tenSanPham: i.tenSanPham,
        hinhAnh:    i.hinhAnh,
        gia:        i.gia,
        soLuong:    i.soLuong,
        variant:    i.variant,
      })),
      receiverName, phone, province, district, ward, detailAddress,
      paymentMethod,
      tongTien,
      phiGiaoHang,
      tongThanhToan,
      ghiChu,
    });

    // Chỉ xóa những item đã đặt khỏi giỏ hàng
    const orderedIds = new Set(orderItems.map(i => i._id.toString()));
    cart.items = cart.items.filter(i => !orderedIds.has(i._id.toString()));
    await cart.save();

    res.status(201).json({ success: true, message: "Đặt hàng thành công", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /api/orders — Lấy danh sách đơn hàng của user
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /api/orders/:id — Chi tiết đơn hàng
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.userId });
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// PUT /api/orders/:id/cancel — Hủy đơn hàng
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.userId });
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    if (order.trangThai !== "cho_xac_nhan")
      return res.status(400).json({ success: false, message: "Không thể hủy đơn hàng đang xử lý" });

    order.trangThai = "da_huy";
    await order.save();
    res.json({ success: true, message: "Đã hủy đơn hàng", order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── Admin ──────────────────────────────────────────────────────────────────

// GET /api/orders/admin/all — Lấy tất cả đơn hàng (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("userId", "hoTen soDienThoai email");
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// PUT /api/orders/admin/:id/status — Cập nhật trạng thái đơn hàng (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { trangThai } = req.body;
    const validStatuses = ["cho_xac_nhan", "da_xac_nhan", "dang_giao", "da_giao", "da_huy"];
    if (!validStatuses.includes(trangThai))
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });

    const order = await Order.findByIdAndUpdate(req.params.id, { trangThai }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
