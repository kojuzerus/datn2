const Groq  = require("groq-sdk");
const axios = require("axios");

function decodeHtmlEntities(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

exports.searchImage = async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: "Thiếu tên sản phẩm" });
  }

  try {
    // Endpoint AJAX của Bing - chỉ trả về lưới kết quả ảnh thật, không lẫn quảng cáo/widget
    const query = encodeURIComponent(name);
    const { data: html } = await axios.get(
      `https://www.bing.com/images/async?q=${query}&first=0&count=20&mmasync=1`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        timeout: 10000,
      }
    );

    const matches = [...html.matchAll(/murl&quot;:&quot;(.*?)&quot;/g)];
    const urls = matches
      .map((m) => decodeHtmlEntities(m[1]))
      .filter((u) => /^https?:\/\/.*\.(jpg|jpeg|png|webp)/i.test(u));

    if (!urls.length) {
      return res.json({ success: false, message: "Không tìm thấy ảnh" });
    }

    res.json({ success: true, imageUrl: urls[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
