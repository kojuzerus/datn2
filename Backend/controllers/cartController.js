const Cart    = require("../models/cartModel");
const Product = require("../models/productModel");
const Variant = require("../models/variantModel");

// ── Tra tồn kho thật của 1 biến thể ─────────────────────────────────────────
// Trước đây addToCart/updateQuantity không đối chiếu với tồn kho DB — khách
// bấm "Thêm vào giỏ" nhiều lần hoặc gõ số lượng tùy ý là cộng dồn vô hạn,
// không phản ánh đúng số hàng thật còn trong kho. Variants có thể nhúng sẵn
// trong document product (dữ liệu mới) hoặc nằm ở collection product_variants
// riêng (dữ liệu cũ) — xem thêm attachVariants() trong productController.js.
// Trả về null khi không xác định được (sản phẩm không tồn tại/không phân biến
// thể) — nghĩa là KHÔNG áp giới hạn ở tầng này, tránh chặn nhầm.
async function getAvailableStock(productId, variant) {
  const pid = Number(productId);
  if (!Number.isFinite(pid)) return null;

  const product = await Product.findOne({ product_id: pid }).select("variants").lean();
  if (!product) return null;

  const variants = Array.isArray(product.variants) && product.variants.length
    ? product.variants
    : await Variant.find({ product_id: pid }).lean();
  if (!variants.length) return null;

  const match = variant
    ? variants.find((v) => (v.color || "").toLowerCase() === variant.toLowerCase())
    : variants[0];
  return match ? (match.stock_quantity ?? 0) : null;
}
exports.getAvailableStock = getAvailableStock;

// Lấy giỏ hàng
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) cart = await Cart.create({ userId: req.userId, items: [] });
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Thêm sản phẩm vào giỏ
exports.addToCart = async (req, res) => {
  try {
    const { productId, tenSanPham, hinhAnh, gia, soLuong = 1, variant = "" } = req.body;
    if (!productId || !tenSanPham || !gia)
      return res.status(400).json({ success: false, message: "Thiếu thông tin sản phẩm" });

    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) cart = new Cart({ userId: req.userId, items: [] });

    const idx = cart.items.findIndex(
      i => i.productId.toString() === productId && i.variant === variant
    );
    const currentQty = idx > -1 ? cart.items[idx].soLuong : 0;

    // Chặn vượt tồn kho thật — cộng dồn với số đã có sẵn trong giỏ, không chỉ
    // xét riêng lần thêm này (khách bấm "thêm vào giỏ" nhiều lần liên tiếp).
    const stock = await getAvailableStock(productId, variant);
    let addQty = soLuong;
    let capped = false;
    if (stock != null) {
      const room = Math.max(0, stock - currentQty);
      if (room <= 0) {
        return res.status(400).json({
          success: false,
          message: currentQty > 0
            ? `Bạn đã có ${currentQty} sản phẩm này trong giỏ — đúng bằng số hàng còn trong kho rồi`
            : "Sản phẩm hiện đã hết hàng",
        });
      }
      if (addQty > room) { addQty = room; capped = true; }
    }

    if (idx > -1) {
      // Flash Sale phải thay giá hiện tại của item; nếu giữ giá cũ thì
      // mua từ thẻ sale sau khi đã có item thường trong giỏ sẽ thanh toán
      // sai giá và không được gắn đúng đợt sale.
      if (Number(gia) < cart.items[idx].gia) cart.items[idx].gia = gia;
      cart.items[idx].soLuong += addQty;
    } else {
      cart.items.push({ productId, tenSanPham, hinhAnh, gia, soLuong: addQty, variant });
    }

    await cart.save();
    res.json({
      success: true,
      message: capped
        ? `Kho chỉ còn ${stock} sản phẩm, đã thêm tối đa ${addQty} vào giỏ`
        : "Đã thêm vào giỏ hàng",
      cart,
      capped,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Cập nhật số lượng
exports.updateQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { soLuong } = req.body;

    if (soLuong < 1)
      return res.status(400).json({ success: false, message: "Số lượng không hợp lệ" });

    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) return res.status(404).json({ success: false, message: "Không tìm thấy giỏ hàng" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });

    const stock = await getAvailableStock(item.productId, item.variant);
    if (stock != null && soLuong > stock) {
      return res.status(400).json({ success: false, message: `Kho chỉ còn ${stock} sản phẩm` });
    }

    item.soLuong = soLuong;
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Xóa sản phẩm
exports.removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) return res.status(404).json({ success: false, message: "Không tìm thấy giỏ hàng" });

    cart.items = cart.items.filter(i => i._id.toString() !== itemId);
    await cart.save();
    res.json({ success: true, message: "Đã xóa sản phẩm", cart });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Xóa toàn bộ giỏ hàng
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId });
    if (cart) { cart.items = []; await cart.save(); }
    res.json({ success: true, message: "Đã xóa toàn bộ giỏ hàng" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};