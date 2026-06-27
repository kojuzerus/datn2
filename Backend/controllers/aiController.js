const Groq  = require("groq-sdk");
const axios = require("axios");

exports.searchImage = async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: "Thiếu tên sản phẩm" });
  }

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, message: "Chưa cấu hình SERPER_API_KEY" });
  }

  try {
    const { data } = await axios.post(
      "https://google.serper.dev/images",
      { q: name },
      { headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" }, timeout: 10000 }
    );

    const images = data.images || [];
    if (!images.length) {
      return res.json({ success: false, message: "Không tìm thấy ảnh" });
    }

    res.json({ success: true, imageUrl: images[0].imageUrl });
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    res.status(500).json({ success: false, message: msg });
  }
};

exports.generateProduct = async (req, res) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const { name, category } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: "Thiếu tên sản phẩm" });
  }

  const prompt = `Bạn là chuyên gia sản phẩm điện tử Việt Nam. Tạo thông tin cho: "${name}"${category ? ` (danh mục: ${category})` : ""}.

Trả về JSON (không thêm field khác, không giải thích):
{"short_description":"mô tả 1 câu tiếng Việt tối đa 80 ký tự","badge":"Hot hoặc Mới hoặc Sale hoặc Bestseller hoặc rỗng","warranty":"ví dụ: 12 tháng","sku":"ví dụ: APL-IP16PM","category_name":"Điện thoại hoặc Laptop hoặc Phụ kiện hoặc Tivi hoặc Máy tính bảng","brand_name":"tên thương hiệu","specification":[{"label":"thông số","value":"giá trị"},{"label":"thông số","value":"giá trị"},{"label":"thông số","value":"giá trị"},{"label":"thông số","value":"giá trị"},{"label":"thông số","value":"giá trị"}],"variants":[{"color":"màu","price":10000000,"sale_price":null,"stock_quantity":50},{"color":"màu","price":12000000,"sale_price":null,"stock_quantity":30}]}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1024,
    });
    const choice = completion.choices[0];
    if (choice.finish_reason === "length") {
      return res.status(500).json({ success: false, message: "AI trả về quá dài, vui lòng thử lại" });
    }
    const json = JSON.parse(choice.message.content);
    res.json({ success: true, data: json });
  } catch (err) {
    console.error("AI generate error:", err.message);
    res.status(500).json({ success: false, message: "Không thể tạo nội dung AI: " + err.message });
  }
};
