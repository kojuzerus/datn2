// Gửi mail qua Brevo (Sendinblue) HTTP API — không dùng SMTP trực tiếp vì
// nhiều nền tảng cloud (kể cả Render) chặn/hạn chế kết nối SMTP đi ra, khiến
// request treo hàng phút trước khi báo lỗi. HTTP API chạy qua cổng 443 như
// mọi request web bình thường nên không bị ảnh hưởng.
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_TIMEOUT_MS = 10_000;

const apiKey      = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER;
const senderName  = process.env.BREVO_SENDER_NAME  || "SmartHub";

if (!apiKey || !senderEmail) {
  console.warn("Email chưa được cấu hình — set BREVO_API_KEY và BREVO_SENDER_EMAIL trong .env để bật gửi mail (quên mật khẩu, ...).");
}

async function sendMail({ to, toName, subject, html }) {
  if (!apiKey || !senderEmail) throw new Error("Email chưa được cấu hình trên server");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BREVO_TIMEOUT_MS);
  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to, name: toName || undefined }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Brevo API lỗi ${res.status}: ${body}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

// ── Email đặt lại mật khẩu ──────────────────────────────────────────────────
async function sendResetPasswordEmail(to, hoTen, resetUrl) {
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

  await sendMail({ to, toName: hoTen, subject: "Đặt lại mật khẩu SmartHub", html });
}

module.exports = { sendResetPasswordEmail };
