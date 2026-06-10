const Cart = require("../models/cartModel");

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

    if (idx > -1) {
      cart.items[idx].soLuong += soLuong;
    } else {
      cart.items.push({ productId, tenSanPham, hinhAnh, gia, soLuong, variant });
    }

    await cart.save();
    res.json({ success: true, message: "Đã thêm vào giỏ hàng", cart });
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