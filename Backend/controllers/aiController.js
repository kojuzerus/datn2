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

    const images = data.images     || [];
    if (!images.length) {
      return res.json({ success: false, message: "Không tìm thấy ảnh" });
    }

    res.json({ success: true, imageUrl: images[0].imageUrl });
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    res.status(500).json({ success: false, message: msg });
  }
};

exports.searchMarketPrice = async (req, res) => {
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
      "https://google.serper.dev/search",
      { q: `${name} cellphones.com.vn giá`, gl: "vn", hl: "vi" },
      { headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" }, timeout: 10000 }
    );

    const results = (data.organic || []).filter((r) =>
      r.link?.includes("cellphones.com.vn") &&
      !r.link.includes("/so-sanh/") &&
      !r.link.includes("/sforum/")
    );

    // Giá niêm yết + giá khuyến mãi thường xuất hiện liền kề nhau trong snippet, dạng "X.XXX.XXXđ Y.YYY.YYYđ"
    const pairPattern  = /(\d{1,3}(?:\.\d{3})+)\s*đ\s+(\d{1,3}(?:\.\d{3})+)\s*đ/;
    const singlePattern = /(\d{1,3}(?:\.\d{3})+)\s*đ/;

    for (const r of results) {
      const snippet = r.snippet || "";
      const pair = snippet.match(pairPattern);
      if (pair) {
        const a = parseInt(pair[1].replace(/\./g, ""), 10);
        const b = parseInt(pair[2].replace(/\./g, ""), 10);
        const price      = Math.max(a, b);
        const sale_price = a !== b ? Math.min(a, b) : null;
        return res.json({ success: true, price, sale_price, source: r.link });
      }
    }

    for (const r of results) {
      const single = (r.snippet || "").match(singlePattern);
      if (single) {
        const price = parseInt(single[1].replace(/\./g, ""), 10);
        return res.json({ success: true, price, sale_price: null, source: r.link });
      }
    }

    res.json({ success: false, message: "Không tìm thấy giá trên CellphoneS" });
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    res.status(500).json({ success: false, message: msg });
  }
};

exports.generateProduct = async (req, res) => {
  const { name, category } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: "Thiếu tên sản phẩm" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, message: "Chưa cấu hình OPENROUTER_API_KEY" });
  }

  const prompt = `Bạn là chuyên gia sản phẩm điện tử Việt Nam. Tạo thông tin cho: "${name}"${category ? ` (danh mục: ${category})` : ""}.

Trả về JSON (không thêm field khác, không giải thích):
{"short_description":"mô tả 1 câu tiếng Việt tối đa 80 ký tự","badge":"Hot hoặc Mới hoặc Sale hoặc Bestseller hoặc rỗng","warranty":"ví dụ: 12 tháng","sku":"ví dụ: APL-IP16PM","category_name":"Điện thoại hoặc Laptop hoặc Phụ kiện hoặc Tivi hoặc Máy tính bảng","brand_name":"tên thương hiệu","specification":[{"label":"thông số","value":"giá trị"},{"label":"thông số","value":"giá trị"},{"label":"thông số","value":"giá trị"},{"label":"thông số","value":"giá trị"},{"label":"thông số","value":"giá trị"}],"variants":[{"color":"màu","price":10000000,"sale_price":null,"stock_quantity":50},{"color":"màu","price":12000000,"sale_price":null,"stock_quantity":30}]}`;

  const MODELS = [
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "poolside/laguna-m.1:free",
  ];

  async function callModel(model) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55000);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error?.message || `HTTP ${response.status}`);
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  try {
    let data = null;
    let lastErr = "";
    for (const model of MODELS) {
      try {
        data = await callModel(model);
        break;
      } catch (e) {
        lastErr = e.message;
        console.warn(`AI model ${model} failed: ${e.message}`);
      }
    }
    if (!data) throw new Error(lastErr);

    const choice = data.choices?.[0];
    if (!choice) throw new Error("Không có kết quả từ AI");
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
