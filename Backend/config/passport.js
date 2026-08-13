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
        // Đã có tài khoản → cập nhật googleId nếu chưa có, và đánh dấu lần
        // đăng nhập gần nhất là qua Google (để UI hiển thị đúng nút đã dùng)
        if (!user.googleId) user.googleId = profile.id;
        user.lastLoginProvider = "google";
        await user.save();
        return done(null, user);
      }

      // Chưa có → tạo mới
      // Lưu ý: KHÔNG set soDienThoai: null ở đây — field soDienThoai có index
      // unique+sparse, và sparse chỉ bỏ qua document hoàn toàn thiếu field đó.
      // Nếu gán null tường minh, nó vẫn bị tính vào index unique, nên chỉ tài
      // khoản Google đầu tiên (không có SĐT) tạo được, các tài khoản sau sẽ bị
      // lỗi duplicate key. Bỏ hẳn field để sparse index hoạt động đúng.
      user = await User.create({
        googleId: profile.id,
        hoTen,
        email,
        matKhau:  "google_oauth_no_password",
        lastLoginProvider: "google",
      });

      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }));
} else {
  console.warn('Google OAuth not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable it.');
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  const { Strategy: FacebookStrategy } = require("passport-facebook");
  passport.use(new FacebookStrategy({
    clientID:     process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL:  process.env.FACEBOOK_CALLBACK_URL || "http://localhost:5000/api/auth/facebook/callback",
    profileFields: ["id", "displayName", "emails"],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const hoTen = profile.displayName;

      // Tìm user theo facebookId hoặc email (Facebook không phải lúc nào cũng trả email)
      let user = await User.findOne(
        email ? { $or: [{ facebookId: profile.id }, { email }] } : { facebookId: profile.id }
      );

      if (user) {
        // Đã có tài khoản → cập nhật facebookId nếu chưa có, và đánh dấu lần
        // đăng nhập gần nhất là qua Facebook
        if (!user.facebookId) user.facebookId = profile.id;
        user.lastLoginProvider = "facebook";
        await user.save();
        return done(null, user);
      }

      // Chưa có → tạo mới. Không set soDienThoai/email: null tường minh — xem
      // ghi chú ở nhánh Google phía trên (phá sparse unique index).
      user = await User.create({
        facebookId: profile.id,
        hoTen:      hoTen || "Người dùng Facebook",
        ...(email && { email }),
        matKhau:    "facebook_oauth_no_password",
        lastLoginProvider: "facebook",
      });

      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }));
} else {
  console.warn('Facebook OAuth not configured — set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in .env to enable it.');
}

module.exports = passport;