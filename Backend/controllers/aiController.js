const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.generateProduct = async (req, res) => {
  const { name, category } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: "Thiếu tên sản phẩm" });
  }

  const prompt = `Bạn là chuyên gia về sản phẩm điện tử tại Việt Nam.
Hãy tạo thông tin cho sản phẩm: "${name}"${category ? ` (danh mục: ${category})` : ""}.

Trả về JSON với đúng format này, không có markdown, không có giải thích:
{
  "short_description": "mô tả ngắn 1-2 câu nêu đặc điểm nổi bật, viết bằng tiếng Việt, tối đa 120 ký tự",
  "badge": "một trong các giá trị: Hot | Mới | Sale | Bestseller | hoặc để trống nếu không phù hợp",
  "warranty": "thời gian bảo hành, ví dụ: 12 tháng chính hãng",
  "sku": "mã SKU ngắn gọn theo format BRAND-MODEL, ví dụ: APL-IP16PM"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    const raw = response.text.trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");

    const json = JSON.parse(raw);
    res.json({ success: true, data: json });
  } catch (err) {
    console.error("AI generate error:", err.message);
    res.status(500).json({ success: false, message: "Không thể tạo nội dung AI: " + err.message });
  }
};
