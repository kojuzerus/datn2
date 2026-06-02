const express = require("express");
const router  = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const passport = require("passport");
const jwt      = require("jsonwebtoken");
const axios    = require("axios");
const crypto   = require("crypto");
const User     = require("../models/User");

const SECRET       = process.env.JWT_SECRET   || "smarthub_secret_2024";
const ZALO_APP_ID  = process.env.ZALO_APP_ID;
const ZALO_SECRET  = process.env.ZALO_APP_SECRET;
const ZALO_CB      = "http://localhost:5000/api/auth/zalo/callback";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Tạo token helper
const makeToken = (user) => jwt.sign({ id: user._id }, SECRET, { expiresIn: "7d" });
const makeRedirect = (token, user) => {
  const u = encodeURIComponent(JSON.stringify({ id: user._id, hoTen: user.hoTen, soDienThoai: user.soDienThoai, email: user.email }));
  return `${FRONTEND_URL}/oauth-callback?token=${token}&user=${u}`;
};

// ── Đăng ký / Đăng nhập thường ───────────────────────────────────────────
router.post("/register", register);
router.post("/login",    login);
router.get("/me",        authMiddleware, getMe);

// ── Google OAuth ──────────────────────────────────────────────────────────
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/dang-nhap?error=google_failed` }),
  (req, res) => res.redirect(makeRedirect(makeToken(req.user), req.user))
);

// ── Zalo OAuth ────────────────────────────────────────────────────────────
router.get("/zalo", (req, res) => {
  const codeChallenge = crypto.randomBytes(32).toString("base64url");
  // Lưu tạm vào query (dự án thực nên dùng session/redis)
  const url = `https://oauth.zaloapp.com/v4/permission?app_id=${ZALO_APP_ID}&redirect_uri=${encodeURIComponent(ZALO_CB)}&code_challenge=${codeChallenge}&state=${codeChallenge}`;
  res.redirect(url);
});

router.get("/zalo/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) throw new Error("Không nhận được code từ Zalo");

    // Đổi code lấy access token
    const secret_key = crypto.createHmac("sha256", ZALO_SECRET).update(code + state).digest("hex");

    const tokenRes = await axios.post("https://oauth.zaloapp.com/v4/access_token", new URLSearchParams({
      app_id:        ZALO_APP_ID,
      code,
      grant_type:    "authorization_code",
      code_verifier: state,
    }), {
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "secret_key":    secret_key,
      }
    });

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error("Không lấy được access token");

    // Lấy thông tin user từ Zalo
    const userRes = await axios.get("https://graph.zalo.me/v2.0/me?fields=id,name,picture", {
      headers: { access_token: accessToken }
    });

    const zaloUser = userRes.data;
    const zaloId   = zaloUser.id;
    const hoTen    = zaloUser.name;

    // Tìm hoặc tạo user
    let user = await User.findOne({ zaloId });
    if (!user) {
      user = await User.create({ zaloId, hoTen, matKhau: "zalo_oauth" });
    }

    res.redirect(makeRedirect(makeToken(user), user));
  } catch (err) {
    console.error("Zalo OAuth error:", err.message);
    res.redirect(`${FRONTEND_URL}/dang-nhap?error=zalo_failed`);
  }
});

module.exports = router;