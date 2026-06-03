const passport = require("passport");
const User = require("../models/User");

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const hoTen = profile.displayName;

      // Tìm user theo googleId hoặc email
      let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

      if (user) {
        // Đã có tài khoản → cập nhật googleId nếu chưa có
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
        return done(null, user);
      }

      // Chưa có → tạo mới
      user = await User.create({
        googleId:    profile.id,
        hoTen,
        email,
        soDienThoai: null,   // Google không có SĐT
        matKhau:     "google_oauth_no_password",
      });

      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }));
} else {
  console.warn('Google OAuth not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable it.');
}

module.exports = passport;