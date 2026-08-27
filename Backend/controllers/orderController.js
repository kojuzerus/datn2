const Order     = require("../models/orderModel");
const Cart      = require("../models/cartModel");
const Product   = require("../models/productModel");
const Variant   = require("../models/variantModel");
const Promotion = require("../models/promotionModel");
const FlashSale = require("../models/flashSaleModel");
const { checkPromo } = require("./promotionController");
const { markVoucherUsed } = require("./voucherController");
const { refundToWallet, chargeWallet, getBalance } = require("./walletController");
const { getAvailableStock } = require("./cartController");

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

// Trừ/hoàn quota Flash Sale theo từng item. flashSaleId được lưu trong order
// để các đơn cũ hoặc các đợt đã hết thời gian vẫn hoàn đúng quota khi hủy.
async function adjustFlashSaleQuantity(items, delta) {
  const changed = [];
  try {
    for (const item of items || []) {
      if (!item.flashSaleId) continue;
      const quantity = Math.max(0, Number(item.soLuong) || 0);
      if (!quantity) continue;

      const filter = delta < 0
        ? { _id: item.flashSaleId, remaining_quantity: { $gte: quantity } }
        : { _id: item.flashSaleId };
      const result = await FlashSale.updateOne(filter, { $inc: { remaining_quantity: delta * quantity } });
      if (result.modifiedCount !== 1) throw new Error("Số lượng Flash Sale không còn đủ");
      changed.push({ id: item.flashSaleId, quantity });
    }
  } catch (err) {
    await Promise.all(changed.map((item) =>
      FlashSale.updateOne({ _id: item.id }, { $inc: { remaining_quantity: -delta * item.quantity } })
    ));
    throw err;
  }
}
exports.adjustFlashSaleQuantity = adjustFlashSaleQuantity;

async function adjustFlashSaleSold(items, delta) {
  await Promise.all((items || []).map((item) => {
    if (!item.flashSaleId) return null;
    return FlashSale.updateOne(
      { _id: item.flashSaleId },
      { $inc: { sold_quantity: delta * item.soLuong } }
    );
  }));
}
exports.adjustFlashSaleSold = adjustFlashSaleSold;

async function attachFlashSaleIds(items) {
  const now = new Date();
  return Promise.all((items || []).map(async (item) => {
    const productId = parseInt(item.productId);
    if (isNaN(productId)) return item;

    const variant = await Variant.findOne({ product_id: productId, color: item.variant || "" }).select("_id").lean();
    if (!variant) return item;

    const sale = await FlashSale.findOne({
      variant_id: variant._id,
      sale_price: item.gia,
      status: "active",
      start_time: { $lte: now },
      end_time: { $gte: now },
      remaining_quantity: { $gt: 0 },
    }).select("_id").lean();
    return sale ? { ...item, flashSaleId: sale._id } : item;
  }));
}

// Trả lại các item của đơn (đã bị xoá khỏi giỏ lúc tạo đơn) về giỏ hàng thật
// của khách — dùng khi đơn bị huỷ do thanh toán thất bại (VNPAY/Ví), để sản
// phẩm không "biến mất" (không còn trong giỏ lẫn không còn trong đơn hữu ích
// nào vì đơn đã huỷ). Xuất ra để paymentController.js dùng lại đúng logic này.
async function restoreCartItems(userId, items) {
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = new Cart({ userId, items: [] });
  for (const item of items || []) {
    const idx = cart.items.findIndex(
      (i) => i.productId.toString() === item.productId && i.variant === item.variant
    );
    if (idx > -1) cart.items[idx].soLuong += item.soLuong;
    else cart.items.push({
      productId: item.productId, tenSanPham: item.tenSanPham, hinhAnh: item.hinhAnh,
      gia: item.gia, soLuong: item.soLuong, variant: item.variant,
    });
  }
  await cart.save();
}
exports.restoreCartItems = restoreCartItems;

// Đơn được coi là "đã thanh toán online" nếu trả bằng VNPAY/Ví VÀ đã qua khỏi
// trạng thái "cho_xac_nhan" (với VNPAY/Ví, trạng thái nhảy thẳng lên
// "da_xac_nhan" ngay khi thanh toán thành công — không dừng ở "cho_xac_nhan"
// như COD) — dùng để quyết định có hoàn tiền vào ví khi đơn bị huỷ hay không.
function daThanhToanOnline(order) {
  return (order.paymentMethod === "vnpay" || order.paymentMethod === "vi") && order.trangThai !== "cho_xac_nhan";
}

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

    const normalizedItems = orderItems.map((item) => ({
      ...item.toObject(),
      productId: item.productId || item.product_id,
      tenSanPham: item.tenSanPham || item.product_name,
      hinhAnh: item.hinhAnh || item.thumbnail || "",
      gia: item.gia ?? item.price,
      soLuong: item.soLuong ?? item.quantity,
      variant: item.variant || "",
    }));
    const invalidItem = normalizedItems.find((item) =>
      !item.productId || !item.tenSanPham || item.gia == null || item.soLuong == null
    );
    if (invalidItem)
      return res.status(400).json({ success: false, message: "Sản phẩm trong giỏ hàng không hợp lệ, vui lòng thêm lại sản phẩm" });

    // Giỏ có thể chứa sản phẩm sale đã hết hàng từ lần truy cập trước. Kiểm
    // tra lại ngay trước khi tạo đơn để không tạo đơn rồi mới lỗi khi trừ kho.
    for (const item of normalizedItems) {
      const stock = await getAvailableStock(item.productId, item.variant);
      if (stock != null && item.soLuong > stock) {
        return res.status(400).json({
          success: false,
          message: stock > 0
            ? `Sản phẩm "${item.tenSanPham}" chỉ còn ${stock} sản phẩm trong kho`
            : `Sản phẩm "${item.tenSanPham}" đã hết hàng, vui lòng xóa khỏi giỏ hàng`,
        });
      }
    }

    const tongTien    = normalizedItems.reduce((s, i) => s + i.gia * i.soLuong, 0);
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

    // Thanh toán bằng Ví SmartHub: kiểm tra đủ số dư TRƯỚC khi tạo đơn (fail
    // sớm, tránh tạo đơn rồi mới báo lỗi). Việc trừ tiền thật sự diễn ra SAU
    // khi đơn tạo thành công (bên dưới), vì cần orderId để ghi lịch sử giao dịch.
    if (paymentMethod === "vi") {
      const soDu = await getBalance(req.userId);
      if (soDu < tongThanhToan)
        return res.status(400).json({ success: false, message: "Số dư ví không đủ để thanh toán đơn hàng này" });
    }

    const orderItemsWithFlashSale = await attachFlashSaleIds(normalizedItems);
    const order = await Order.create({
      userId: req.userId,
      items: orderItemsWithFlashSale.map(i => ({
        productId:  i.productId,
        tenSanPham: i.tenSanPham,
        hinhAnh:    i.hinhAnh,
        gia:        i.gia,
        soLuong:    i.soLuong,
        variant:    i.variant,
        flashSaleId: i.flashSaleId || null,
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

    try {
      await adjustFlashSaleQuantity(order.items, -1);
    } catch (flashSaleErr) {
      await Order.deleteOne({ _id: order._id });
      return res.status(400).json({ success: false, message: flashSaleErr.message });
    }

    // Chỉ xóa những item đã đặt khỏi giỏ hàng
    const orderedIds = new Set(orderItems.map(i => i._id.toString()));
    cart.items = cart.items.filter(i => !orderedIds.has(i._id.toString()));
    await cart.save();

    await adjustTotalSold(order.items, 1);
    await adjustStock(order.items, -1);

    // Trừ tiền trong ví NGAY (đơn coi như đã thanh toán xong, giống VNPAY
    // thành công) — nếu vì lý do hiếm gặp nào đó (race condition) số dư không
    // còn đủ nữa, huỷ luôn đơn vừa tạo và trả lại mọi thay đổi ở trên.
    if (paymentMethod === "vi") {
      try {
        await chargeWallet(req.userId, tongThanhToan, order._id, "Thanh toán đơn hàng bằng Ví SmartHub");
        order.trangThai = "da_xac_nhan";
        await adjustFlashSaleSold(order.items, 1);
        await order.save();
      } catch (walletErr) {
        order.trangThai = "da_huy";
        order.lyDoHuy = "Thanh toán ví thất bại: " + walletErr.message;
        await order.save();
        await adjustTotalSold(order.items, -1);
        await adjustStock(order.items, 1);
        await adjustFlashSaleQuantity(order.items, 1);
        await adjustFlashSaleSold(order.items, -1);
        await restoreCartItems(req.userId, order.items);
        return res.status(400).json({ success: false, message: walletErr.message });
      }
    }

    res.status(201).json({ success: true, message: "Đặt hàng thành công", order });
  } catch (err) {
    console.error("[orders create]", err);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production"
        ? "Lỗi server"
        : `Lỗi server: ${err.message}`,
    });
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

// PUT /api/orders/:id/confirm-received — Khách tự xác nhận đã nhận được hàng
// ("Ghi Nhận Hàng"). Chỉ hợp lệ khi đơn vị vận chuyển đã nhận đơn (dang_giao)
// — chưa tới bước đó thì chưa có gì để xác nhận, đã giao/đã huỷ rồi thì
// không cần xác nhận lại nữa.
exports.confirmReceived = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.userId });
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    if (order.trangThai !== "dang_giao")
      return res.status(400).json({ success: false, message: "Đơn hàng chưa ở trạng thái đang giao, không thể xác nhận" });

    order.trangThai = "da_giao";
    await order.save();

    res.json({ success: true, message: "Đã xác nhận nhận hàng, cảm ơn bạn!", order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// PUT /api/orders/:id/cancel — Hủy đơn hàng
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.userId });
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    // Khách tự huỷ được khi: (1) đơn COD chưa xác nhận (chưa mất tiền gì), hoặc
    // (2) đơn đã thanh toán online (VNPAY/Ví) nhưng CHƯA giao — huỷ + hoàn tiền
    // vào ví. Đơn đã "dang_giao"/"da_giao" thì không tự huỷ được nữa.
    const coTheHoanTien = daThanhToanOnline(order) && order.trangThai === "da_xac_nhan";
    const coTheHuy = order.trangThai === "cho_xac_nhan" || coTheHoanTien;
    if (!coTheHuy)
      return res.status(400).json({ success: false, message: "Không thể hủy đơn hàng đang xử lý" });

    order.trangThai = "da_huy";
    if (req.body.lyDoHuy) order.lyDoHuy = req.body.lyDoHuy;
    await order.save();
    await adjustTotalSold(order.items, -1);
    await adjustStock(order.items, 1);
    await adjustFlashSaleQuantity(order.items, 1);
    if (coTheHoanTien) await adjustFlashSaleSold(order.items, -1);

    let refunded = 0;
    if (coTheHoanTien) {
      refunded = await refundToWallet(
        order.userId, order.tongThanhToan, order._id,
        "Hoàn tiền do huỷ đơn đã thanh toán online"
      );
    }

    res.json({
      success: true,
      message: refunded
        ? `Đã hủy đơn hàng và hoàn ${refunded.toLocaleString("vi-VN")}đ vào Ví SmartHub`
        : "Đã hủy đơn hàng",
      order, refunded,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ── Admin ──────────────────────────────────────────────────────────────────

// GET /api/orders/admin/all — Lấy tất cả đơn hàng (admin)
exports.getAllOrders = async (req, res) => {
  try {
    // Mặc định mới nhất trước — trước đây sort createdAt: 1 (cũ nhất trước)
    // khiến đơn mới đặt bị chìm xuống cuối danh sách, admin phải cuộn hết mới
    // thấy. Frontend có thêm nút đảo chiều nên vẫn tự sort lại khi cần.
    const orders = await Order.find().sort({ createdAt: -1 }).populate("userId", "hoTen soDienThoai email");
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Thứ tự tiến của đơn hàng — trùng với FORWARD_FLOW phía admin/orders/page.tsx
// (giữ đồng bộ 2 nơi nếu sau này đổi luồng trạng thái).
const FORWARD_FLOW = ["cho_xac_nhan", "da_xac_nhan", "dang_giao", "da_giao"];

// PUT /api/orders/admin/:id/status — Cập nhật trạng thái đơn hàng (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { trangThai } = req.body;
    const validStatuses = ["cho_xac_nhan", "da_xac_nhan", "dang_giao", "da_giao", "da_huy"];
    if (!validStatuses.includes(trangThai))
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });

    const existing = await Order.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    // TRƯỚC ĐÂY chỉ Frontend giới hạn các lựa chọn hợp lệ trong dropdown — gọi
    // thẳng API này (Postman, script...) vẫn nhảy cóc được bất kỳ trạng thái
    // nào. Chặn lại ở đây, nguồn sự thật thật sự: đơn đã ở trạng thái cuối
    // (đã giao/đã hủy) thì không đổi được nữa; đổi sang bước kế tiếp thì chỉ
    // được đúng 1 bước liền sau, không được bỏ qua bước trung gian. Hủy đơn
    // thì cho phép từ bất kỳ bước nào chưa hoàn tất.
    if (existing.trangThai !== trangThai) {
      if (existing.trangThai === "da_huy" || existing.trangThai === "da_giao") {
        return res.status(400).json({
          success: false,
          message: "Đơn hàng đã ở trạng thái cuối cùng, không thể thay đổi thêm",
        });
      }
      if (trangThai !== "da_huy") {
        const curIdx  = FORWARD_FLOW.indexOf(existing.trangThai);
        const nextIdx = FORWARD_FLOW.indexOf(trangThai);
        if (curIdx === -1 || nextIdx !== curIdx + 1) {
          return res.status(400).json({
            success: false,
            message: "Không thể bỏ qua bước — phải cập nhật lần lượt từng bước một",
          });
        }
      }
    }

    if (trangThai === "da_huy" && existing.trangThai !== "da_huy") {
      // Tính trước khi trạng thái bị đổi — cần biết đơn CÓ ĐANG ở trạng thái
      // "đã thanh toán online" hay không TRƯỚC khi set thành da_huy.
      const canHoanTien = daThanhToanOnline(existing);
      await adjustTotalSold(existing.items, -1);
      await adjustStock(existing.items, 1);
      await adjustFlashSaleQuantity(existing.items, 1);
      if (existing.trangThai !== "cho_xac_nhan") await adjustFlashSaleSold(existing.items, -1);
      if (canHoanTien) {
        await refundToWallet(
          existing.userId, existing.tongThanhToan, existing._id,
          "Hoàn tiền do đơn bị huỷ (quản trị viên)"
        );
      }
    }

    if (existing.trangThai !== "da_xac_nhan" && trangThai === "da_xac_nhan") {
      await adjustFlashSaleSold(existing.items, 1);
    }
    existing.trangThai = trangThai;
    await existing.save();
    res.json({ success: true, order: existing });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
