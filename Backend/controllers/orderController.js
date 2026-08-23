const Order     = require("../models/orderModel");
const Cart      = require("../models/cartModel");
const Product   = require("../models/productModel");
const Variant   = require("../models/variantModel");
const Promotion = require("../models/promotionModel");
const { checkPromo } = require("./promotionController");
const { markVoucherUsed } = require("./voucherController");

// Cộng/trừ lượt bán thật theo số lượng từng sản phẩm trong đơn (delta: 1 khi đặt, -1 khi hủy)
async function adjustTotalSold(items, delta) {
  await Promise.all(
    (items || []).map((i) => {
      const product_id = parseInt(i.productId);
      if (isNaN(product_id)) return null;
      return Product.updateOne({ product_id }, { $inc: { total_sold: delta * i.soLuong } });
    })
  );
}
// Xuất ra để paymentController dùng lại đúng logic này khi VNPAY báo thanh toán thất bại
// (tránh việc đơn bị huỷ ở luồng VNPAY vẫn còn tính vào "đã bán").
exports.adjustTotalSold = adjustTotalSold;

// Trừ/hoàn tồn kho thật theo số lượng từng sản phẩm trong đơn (delta: -1 khi
// đặt, +1 khi hủy) — TRƯỚC ĐÂY chỉ có adjustTotalSold(), không có bước này,
// nên khách mua hết sạch hàng nhưng stock_quantity trong DB không hề giảm.
// Variants có thể nhúng sẵn trong document product (dữ liệu mới) hoặc nằm ở
// collection product_variants riêng (dữ liệu cũ) — xem thêm attachVariants()
// trong productController.js, phải cập nhật đúng nơi variant đó thực sự nằm.
async function adjustStock(items, delta) {
  await Promise.all(
    (items || []).map(async (i) => {
      const product_id = parseInt(i.productId);
      if (isNaN(product_id)) return;
      const qty     = delta * i.soLuong;
      const variant = i.variant || "";

      // Sản phẩm chỉ có 1 biến thể không phân màu (color rỗng) → khớp thẳng
      // vào phần tử đầu tiên thay vì so màu (tránh không khớp được gì).
      const filter = variant
        ? { product_id, "variants.color": variant }
        : { product_id, "variants.0": { $exists: true } };
      const update = variant
        ? { $inc: { "variants.$.stock_quantity": qty } }
        : { $inc: { "variants.0.stock_quantity": qty } };

      const embedded = await Product.updateOne(filter, update);
      if (embedded.matchedCount > 0) return;

      // Không có variants nhúng sẵn (dữ liệu cũ) → cập nhật collection riêng
      await Variant.updateOne({ product_id, color: variant }, { $inc: { stock_quantity: qty } });
    })
  );
}
exports.adjustStock = adjustStock;

// POST /api/orders — Tạo đơn hàng từ giỏ hàng
exports.createOrder = async (req, res) => {
  try {
    const {
      receiverName, phone, province, district, ward, detailAddress,
      paymentMethod = "cod",
      ghiChu = "",
      itemIds,          // mảng _id item được chọn (tuỳ chọn, nếu không có thì lấy tất cả)
      promoCode,        // mã giảm giá (tuỳ chọn)
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

    const tongTien    = orderItems.reduce((s, i) => s + i.gia * i.soLuong, 0);
    const phiGiaoHang = tongTien >= 500000 ? 0 : 30000;

    // Áp mã giảm giá (validate lại phía server, không tin số liệu từ client)
    // LƯU Ý: phải truyền req.userId — thiếu tham số này khiến checkSpinVoucher
    // luôn coi như "chưa đăng nhập" và từ chối mọi mã trúng từ vòng quay, dù
    // khách đã đăng nhập thật và bước "Áp dụng" ở trên (có truyền userId) đã
    // xác nhận mã hợp lệ. Đồng thời dùng result.thongTin.code thay vì
    // result.promo.code — field "promo" chỉ tồn tại ở nhánh mã khuyến mãi
    // thường, còn nhánh vòng quay trả về "voucher"; "thongTin.code" có ở cả 2.
    let maGiamGia   = "";
    let giamGia     = 0;
    let promoSource = null; // "promotion" | "spin"
    if (promoCode?.trim()) {
      const result = await checkPromo(promoCode, tongTien, req.userId);
      if (!result.ok)
        return res.status(400).json({ success: false, message: result.message });
      maGiamGia   = result.thongTin.code;
      giamGia     = result.discount;
      promoSource = result.nguon;
    }

    const tongThanhToan = Math.max(0, tongTien + phiGiaoHang - giamGia);

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
      maGiamGia,
      giamGia,
      tongThanhToan,
      ghiChu,
    });

    // Trừ lượt sử dụng mã (sau khi đơn đã tạo thành công) — đúng theo nguồn mã:
    // mã khuyến mãi thường tăng used_count, còn mã vòng quay phải khoá lại
    // (isUsed=true) để không dùng lại được nữa (trước đây không có bước này
    // nên mã vòng quay dùng được nhiều lần).
    if (maGiamGia) {
      if (promoSource === "spin") {
        await markVoucherUsed(req.userId, maGiamGia, order._id);
      } else {
        await Promotion.updateOne({ code: maGiamGia }, { $inc: { used_count: 1 } });
      }
    }

    // Chỉ xóa những item đã đặt khỏi giỏ hàng
    const orderedIds = new Set(orderItems.map(i => i._id.toString()));
    cart.items = cart.items.filter(i => !orderedIds.has(i._id.toString()));
    await cart.save();

    await adjustTotalSold(order.items, 1);
    await adjustStock(order.items, -1);

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
    if (req.body.lyDoHuy) order.lyDoHuy = req.body.lyDoHuy;
    await order.save();
    await adjustTotalSold(order.items, -1);
    await adjustStock(order.items, 1);
    res.json({ success: true, message: "Đã hủy đơn hàng", order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── Admin ──────────────────────────────────────────────────────────────────

// GET /api/orders/admin/all — Lấy tất cả đơn hàng (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: 1 }).populate("userId", "hoTen soDienThoai email");
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

    const existing = await Order.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    if (trangThai === "da_huy" && existing.trangThai !== "da_huy") {
      await adjustTotalSold(existing.items, -1);
      await adjustStock(existing.items, 1);
    }

    existing.trangThai = trangThai;
    await existing.save();
    res.json({ success: true, order: existing });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
