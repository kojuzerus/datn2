const nodemailer = require("nodemailer");

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    // Dùng host/port tường minh (587 + STARTTLS) thay vì "service: gmail"
    // (ngầm định cổng 465/TLS trực tiếp) — một số nền tảng cloud (kể cả Render)
    // chặn/hạn chế cổng 465 khiến kết nối treo, trong khi 587 thường được cho
    // phép rộng rãi hơn.
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
    // Không set timeout thì khi không kết nối được SMTP (mạng chặn, sai thông
    // tin, DNS lỗi...), request có thể treo tới vài phút trước khi báo lỗi —
    // khiến nút "Đang gửi..." ở FE bị đơ. Giới hạn lại còn vài giây để lỗi
    // (nếu có) được báo nhanh và forgotPassword() vẫn trả lời người dùng kịp thời.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });
} else {
  console.warn("Email chưa được cấu hình — set EMAIL_USER và EMAIL_APP_PASSWORD trong .env để bật gửi mail (quên mật khẩu, ...).");
}

// ── Email đặt lại mật khẩu ──────────────────────────────────────────────────
async function sendResetPasswordEmail(to, hoTen, resetUrl) {
  if (!transporter) throw new Error("Email chưa được cấu hình trên server");

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#f5f5f5; padding:32px 16px;">
    <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #eee;">
      <div style="background:#e53e3e; padding:20px 24px; text-align:center;">
        <span style="color:#fff; font-size:20px; font-weight:bold; letter-spacing:0.5px;">SMARTHUB</span>
      </div>
      <div style="padding:32px 28px;">
        <h2 style="margin:0 0 12px; color:#1a1a1a; font-size:18px;">Xin chào ${hoTen || "bạn"},</h2>
        <p style="margin:0 0 20px; color:#555; font-size:14px; line-height:1.6;">
          Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản SmartHub của bạn.
          Bấm vào nút bên dưới để tạo mật khẩu mới. Liên kết này có hiệu lực trong
          <strong>15 phút</strong>.
        </p>
        <div style="text-align:center; margin:28px 0;">
          <a href="${resetUrl}"
             style="display:inline-block; background:#e53e3e; color:#fff; text-decoration:none;
                    font-weight:600; font-size:14px; padding:13px 32px; border-radius:10px;">
            Đặt lại mật khẩu
          </a>
        </div>
        <p style="margin:0 0 8px; color:#999; font-size:12px; line-height:1.6;">
          Nếu nút trên không hoạt động, hãy sao chép và dán liên kết sau vào trình duyệt:<br/>
          <a href="${resetUrl}" style="color:#e53e3e; word-break:break-all;">${resetUrl}</a>
        </p>
        <p style="margin:20px 0 0; color:#999; font-size:12px; line-height:1.6;">
          Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này — mật khẩu
          của bạn sẽ không bị thay đổi.
        </p>
      </div>
      <div style="background:#fafafa; padding:16px 24px; text-align:center; border-top:1px solid #eee;">
        <span style="color:#aaa; font-size:11px;">© SmartHub — Email tự động, vui lòng không trả lời.</span>
      </div>
    </div>
  </div>`;

  await transporter.sendMail({
    from: `"SmartHub" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Đặt lại mật khẩu SmartHub",
    html,
  });
}

module.exports = { sendResetPasswordEmail };
