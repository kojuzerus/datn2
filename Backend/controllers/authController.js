const User    = require("../models/User");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const crypto  = require("crypto");
const { sendResetPasswordEmail } = require("../utils/mailer");

const SECRET       = process.env.JWT_SECRET   || "smarthub_secret_2024";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 phút

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// ── Đăng ký ──────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { hoTen, ngaySinh, soDienThoai, email, matKhau } = req.body;

    if (!hoTen || !soDienThoai || !matKhau)
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin bắt buộc" });

    if (!/^[0-9]{9,11}$/.test(soDienThoai.trim()))
      return res.status(400).json({ message: "Số điện thoại phải là số, từ 9-11 chữ số" });

    if (await User.findOne({ soDienThoai }))
      return res.status(400).json({ message: "Số điện thoại đã được đăng ký" });

    const trimmedEmail = email?.trim() || "";
    if (trimmedEmail) {
      const existing = await User.findOne({ email: trimmedEmail }).collation({ locale: "en", strength: 2 });
      if (existing) return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    const hash = await bcrypt.hash(matKhau, 10);
    const userData = { hoTen, ngaySinh: ngaySinh || null, soDienThoai, matKhau: hash };
    if (trimmedEmail) userData.email = trimmedEmail;
    const user = await User.create(userData);

    const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "7d" });
    res.status(201).json({ message: "Đăng ký thành công", token, user: { id: user._id, hoTen: user.hoTen, soDienThoai: user.soDienThoai, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ── Đăng nhập ─────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { soDienThoai, matKhau } = req.body;

    if (!soDienThoai || !matKhau)
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });

    const identifier = soDienThoai.trim();
    const user = await User.findOne({
      $or: [{ soDienThoai: identifier }, { email: identifier }],
    }).collation({ locale: "en", strength: 2 });
    if (!user || !(await bcrypt.compare(matKhau, user.matKhau)))
      return res.status(401).json({ message: "Số điện thoại/email hoặc mật khẩu không đúng" });

    if (user.status === "banned")
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa" });

    const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "7d" });
    res.json({ message: "Đăng nhập thành công", token, user: { id: user._id, hoTen: user.hoTen, soDienThoai: user.soDienThoai, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ── Lấy thông tin user ────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-matKhau");
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ── Cập nhật thông tin user ───────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { hoTen, ngaySinh, email, avatar } = req.body;
    const update = {};
    const unset = {};
    if (hoTen?.trim())  update.hoTen    = hoTen.trim();
    if (ngaySinh)       update.ngaySinh = ngaySinh;
    if (avatar !== undefined) update.avatar = avatar || null;
    if (email !== undefined) {
      const trimmedEmail = email?.trim() || "";
      if (trimmedEmail) {
        const existing = await User.findOne({ email: trimmedEmail, _id: { $ne: req.userId } })
          .collation({ locale: "en", strength: 2 });
        if (existing) return res.status(400).json({ message: "Email đã được sử dụng bởi tài khoản khác" });
        update.email = trimmedEmail;
      } else {
        unset.email = "";
      }
    }
    const updateQuery = Object.keys(unset).length ? { ...update, $unset: unset } : update;
    const user = await User.findByIdAndUpdate(req.userId, updateQuery, { new: true }).select("-matKhau");
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json({ message: "Cập nhật thành công", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ── Đổi mật khẩu ─────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { matKhauCu, matKhauMoi } = req.body;
    if (!matKhauCu || !matKhauMoi)
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
    if (matKhauMoi.length < 6)
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    if (!user.matKhau) return res.status(400).json({ message: "Tài khoản này không dùng mật khẩu" });

    const ok = await bcrypt.compare(matKhauCu, user.matKhau);
    if (!ok) return res.status(400).json({ message: "Mật khẩu cũ không đúng" });

    user.matKhau = await bcrypt.hash(matKhauMoi, 10);
    await user.save();
    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ── Quên mật khẩu: gửi email chứa link đặt lại ──────────────────────────────
exports.forgotPassword = async (req, res) => {
  // Luôn trả về cùng 1 thông điệp dù tài khoản có tồn tại hay không, để tránh
  // lộ thông tin ai đã đăng ký (tránh dò email/SĐT hàng loạt).
  const generic = { message: "Nếu tài khoản tồn tại và có email, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu tới email đó." };

  try {
    const identifier = req.body.identifier?.trim();
    if (!identifier)
      return res.status(400).json({ message: "Vui lòng nhập số điện thoại hoặc email" });

    const user = await User.findOne({
      $or: [{ soDienThoai: identifier }, { email: identifier }],
    }).collation({ locale: "en", strength: 2 });

    if (!user || !user.email) return res.json(generic);

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordTokenHash = hashToken(rawToken);
    user.resetPasswordExpires   = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    const resetUrl = `${FRONTEND_URL}/dat-lai-mat-khau?token=${rawToken}`;
    try {
      await sendResetPasswordEmail(user.email, user.hoTen, resetUrl);
    } catch (mailErr) {
      // Không để lộ lỗi gửi mail ra ngoài (vẫn trả lời chung chung), chỉ log để debug.
      console.error("Gửi email đặt lại mật khẩu thất bại:", mailErr.message);
    }

    res.json(generic);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ── Quên mật khẩu: xác nhận token, đặt mật khẩu mới ─────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token, matKhauMoi } = req.body;
    if (!token || !matKhauMoi)
      return res.status(400).json({ message: "Thiếu thông tin" });
    if (matKhauMoi.length < 6)
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });

    const user = await User.findOne({
      resetPasswordTokenHash: hashToken(token),
      resetPasswordExpires:   { $gt: new Date() },
    });

    if (!user)
      return res.status(400).json({ message: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn" });

    user.matKhau = await bcrypt.hash(matKhauMoi, 10);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires   = null;
    await user.save();

    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};