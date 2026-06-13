const Groq = require("groq-sdk");

exports.generateProduct = async (req, res) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const { name, category } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: "Thiếu tên sản phẩm" });
  }

  const prompt = `Bạn là chuyên gia về sản phẩm điện tử tại Việt Nam.
Hãy tạo thông tin cho sản phẩm: "${name}"${category ? ` (danh mục: ${category})` : ""}.

Trả về JSON với đúng format này:
{
  "short_description": "mô tả ngắn 1-2 câu nêu đặc điểm nổi bật, viết bằng tiếng Việt, tối đa 120 ký tự",
  "badge": "một trong các giá trị: Hot | Mới | Sale | Bestseller | hoặc để trống nếu không phù hợp",
  "warranty": "thời gian bảo hành, ví dụ: 12 tháng chính hãng",
  "sku": "mã SKU ngắn gọn theo format BRAND-MODEL, ví dụ: APL-IP16PM"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const json = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, data: json });
  } catch (err) {
    console.error("AI generate error:", err.message);
    res.status(500).json({ success: false, message: "Không thể tạo nội dung AI: " + err.message });
  }
};
