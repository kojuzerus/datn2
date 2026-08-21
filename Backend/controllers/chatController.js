// controllers/chatController.js
// Chế độ AI: dùng Groq hoặc OpenRouter nếu có API key hợp lệ
// Chế độ fallback: regex keyword extraction + template response (không cần AI)
const Product      = require("../models/productModel");
const ProductImage = require("../models/productImageModel");
const Variant      = require("../models/variantModel");

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Image helpers (giống productController) ──────────────────────────────────
function optimizeExternalImage(url) {
  const m = url.match(/^https?:\/\/cdn2\.cellphones\.com\.vn\/x\/(media\/catalog\/product\/.+)$/);
  if (m) return `https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/${m[1].split("?")[0]}`;
  return url;
}
function normalizeImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return optimizeExternalImage(url);
  let n = url.replace(/^public\//, "");
  if (!n.startsWith("images/") && !n.startsWith("/")) n = `images/${n}`;
  if (!n.startsWith("/")) n = `/${n}`;
  return `${BASE_URL}${n}`;
}

// ── Price helper ─────────────────────────────────────────────────────────────
function getDisplayPrice(variants = []) {
  if (!variants.length) return { price: 0, sale_price: null, discount_pct: 0 };
  const withSale = variants.filter((v) => v.sale_price != null);
  const base = withSale.length
    ? withSale.reduce((a, b) => (a.sale_price < b.sale_price ? a : b))
    : variants.reduce((a, b) => (a.price < b.price ? a : b));
  const { price, sale_price = null } = base;
  const discount_pct = sale_price ? Math.round(((price - sale_price) / price) * 100) : 0;
  return { price, sale_price, discount_pct };
}

// ── Join variants + ảnh, format cho FE ───────────────────────────────────────
async function hydrateProducts(products) {
  const missingIds = products
    .filter((p) => !(Array.isArray(p.variants) && p.variants.length))
    .map((p) => p.product_id);
  let variantMap = {};
  if (missingIds.length) {
    const vList = await Variant.find({ product_id: { $in: missingIds } }).lean();
    for (const v of vList) {
      (variantMap[v.product_id] = variantMap[v.product_id] || []).push(v);
    }
  }
  products = products.map((p) =>
    Array.isArray(p.variants) && p.variants.length
      ? p : { ...p, variants: variantMap[p.product_id] || [] }
  );

  const variantIds = products.flatMap((p) => (p.variants || []).map((v) => v.variant_id));
  let imageMap = {};
  if (variantIds.length) {
    const imgs = await ProductImage.find({ variant_id: { $in: variantIds } }).sort({ sort_order: 1 }).lean();
    for (const img of imgs) {
      (imageMap[img.variant_id] = imageMap[img.variant_id] || []).push(img);
    }
  }

  return products.map((p) => {
    const firstVid  = p.variants?.[0]?.variant_id;
    const firstImg  = firstVid ? imageMap[firstVid]?.[0]?.image_url : null;
    const thumbnail = firstImg ? normalizeImageUrl(firstImg) : normalizeImageUrl(p.thumbnail || "");
    const { price, sale_price, discount_pct } = getDisplayPrice(p.variants);
    return {
      id: p.product_id, ten: p.product_name, slug: p.slug,
      thuongHieu: p.brand_name || "", thumbnail,
      moTa: p.short_description || "",
      gia: price, giaSale: sale_price, giamGia: discount_pct,
      danhGia: p.avg_rating || 0, luotDanhGia: p.review_count || 0,
      badge: p.badge || "", categoryName: p.category_name || "",
    };
  });
}

// ── Fallback: trích xuất intent bằng regex (không cần AI) ───────────────────
// QUAN TRỌNG: mọi so khớp bên dưới đều thực hiện trên chuỗi đã bỏ dấu tiếng Việt
// (xem normalizeVN) — nên các pattern liệt kê ở đây cũng phải viết KHÔNG DẤU,
// nếu không so khớp sẽ luôn thất bại một cách âm thầm (bug từng gặp: "gợi ý",
// "tư vấn", "tốt nhất", "mới"... có dấu không bao giờ khớp được với chuỗi đã
// bỏ dấu, khiến rất nhiều câu hỏi tiếng Việt tự nhiên không kích hoạt tìm sản
// phẩm thật, khiến AI trả lời chung chung/dễ bịa chuyện).
function normalizeVN(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
}

const CATEGORY_MAP = {
  "dien thoai|smartphone|phone|iphone|android":         "Điện thoại",
  "laptop|may tinh xach tay|notebook|macbook":           "Laptop",
  "tablet|may tinh bang|ipad":                           "Máy tính bảng",
  "tai nghe|earphone|airpod|headphone|earbud":           "Phụ kiện",
  "tivi|tv|smart tv|man hinh":                            "Tivi",
  "phu kien|sac|cap|op lung|ban phim|chuot|loa|speaker": "Phụ kiện",
};

const BRAND_MAP = [
  "apple", "samsung", "xiaomi", "oppo", "vivo", "realme", "nokia",
  "sony", "lg", "dell", "hp", "lenovo", "asus", "acer", "msi", "huawei",
];

function extractIntent(message) {
  const lower = normalizeVN(message);

  const intent = {
    is_product_query: false,
    keyword:       null,
    category_name: null,
    brand_name:    null,
    price_min:     null,
    price_max:     null,
    sort:          "newest",
  };

  // Phát hiện query sản phẩm — gộp thêm toàn bộ BRAND_MAP để không bỏ sót các
  // câu chỉ gõ tên hãng/dòng máy (VD: "macbook air") mà thiếu động từ kích hoạt.
  const productTriggers = new RegExp(
    [
      "tim", "muon", "mua", "xem", "recommend", "goi y", "tu van", "cho minh", "co khong",
      "gia", "re", "dat", "tot nhat", "ban chay", "new", "moi",
      "iphone", "ipad", "macbook", "airpod", "tai nghe", "tivi", "phone", "laptop", "tablet",
      ...BRAND_MAP,
    ].join("|")
  );
  intent.is_product_query = productTriggers.test(lower);

  // Danh mục
  for (const [pattern, cat] of Object.entries(CATEGORY_MAP)) {
    if (new RegExp(pattern).test(lower)) { intent.category_name = cat; break; }
  }

  // Thương hiệu
  for (const brand of BRAND_MAP) {
    if (lower.includes(brand)) { intent.brand_name = brand; break; }
  }

  // Keyword (cụm từ sau "tìm", "mua", "xem" hoặc tên thương hiệu + model)
  const kwMatch = message.match(/(?:tìm|mua|xem|muốn|cần)\s+(.{3,40}?)(?:\s+(?:giá|dưới|từ|khoảng|với)|$)/i);
  if (kwMatch) {
    intent.keyword = kwMatch[1].trim();
  } else {
    // "iPhone 17", "Samsung S25", "iphone 17" gõ trực tiếp không kèm động từ...
    // Dừng lại trước các từ chỉ giá (dưới/trên/khoảng/triệu...) để không nuốt luôn cụm giá vào từ khóa.
    const modelMatch = message.match(
      /(?:iphone|samsung|xiaomi|oppo|realme|vivo|laptop|macbook|asus|acer|lenovo|dell|hp|msi)(?:\s+(?!giá|dưới|trên|từ|khoảng|với|triệu|tr\b)[\w]+){0,3}/i
    );
    if (modelMatch) intent.keyword = modelMatch[0].trim();
  }

  // Giá (VD: "dưới 5 triệu", "5-10 triệu", "khoảng 15 triệu", "trên 20tr")
  const pricePatterns = [
    { re: /dưới\s*(\d+(?:[,.]\d+)?)\s*(?:triệu|tr)/i,  fn: (m) => ({ price_max: parseFloat(m[1].replace(",", ".")) * 1_000_000 }) },
    { re: /trên\s*(\d+(?:[,.]\d+)?)\s*(?:triệu|tr)/i,  fn: (m) => ({ price_min: parseFloat(m[1].replace(",", ".")) * 1_000_000 }) },
    { re: /từ\s*(\d+)[^\d]+(\d+)\s*(?:triệu|tr)/i,     fn: (m) => ({ price_min: parseInt(m[1]) * 1_000_000, price_max: parseInt(m[2]) * 1_000_000 }) },
    { re: /(\d+)\s*-\s*(\d+)\s*(?:triệu|tr)/i,         fn: (m) => ({ price_min: parseInt(m[1]) * 1_000_000, price_max: parseInt(m[2]) * 1_000_000 }) },
    { re: /khoảng\s*(\d+(?:[,.]\d+)?)\s*(?:triệu|tr)/i,fn: (m) => { const v = parseFloat(m[1].replace(",", ".")) * 1_000_000; return { price_min: v * 0.8, price_max: v * 1.2 }; } },
  ];
  for (const { re, fn } of pricePatterns) {
    const m = message.match(re);
    if (m) { Object.assign(intent, fn(m)); break; }
  }

  // Sort
  if (/rẻ nhất|thấp nhất|giá rẻ/i.test(message))  intent.sort = "price_asc";
  if (/đắt nhất|cao nhất/i.test(message))           intent.sort = "price_desc";
  if (/bán chạy|hot nhất/i.test(message))           intent.sort = "sold";
  if (/đánh giá cao|tốt nhất|rating/i.test(message)) intent.sort = "rating";

  return intent;
}

// ── Phát hiện & xử lý hành động "thêm giỏ hàng" / "đặt hàng" qua chat ───────
// Chatbox không chỉ tư vấn mà còn có thể THỰC SỰ thực hiện hành động: nhận diện
// câu lệnh, xác định đúng sản phẩm khách đang nói tới (trong danh sách vừa
// hiển thị), rồi trả về cho FE thực thi thêm giỏ hàng thật (dùng lại logic
// giỏ hàng có sẵn — hỗ trợ cả khách vãng lai lẫn khách đã đăng nhập).
function detectCartAction(message) {
  const addCart = /(giỏ hàng|vào giỏ|bỏ giỏ|thêm giỏ|cho vào giỏ)/i.test(message);
  const wantsCheckout = /(đặt hàng luôn|đặt đơn|chốt đơn|thanh toán luôn|thanh toán ngay|mua luôn|xác nhận đặt hàng)/i.test(message);
  return { addCart, wantsCheckout };
}

function resolveCartTargets(message, pool = []) {
  if (!pool.length) return null;
  const lower = normalizeVN(message);

  if (/(tat ca|het\b|toan bo)/.test(lower)) return pool.slice(0, 10);

  const ordinals = [
    [/dau tien|thu nhat|so 1\b/, 0],
    [/thu hai|thu 2\b|so 2\b/, 1],
    [/thu ba|thu 3\b|so 3\b/, 2],
    [/cuoi cung|cai cuoi/, pool.length - 1],
  ];
  for (const [re, idx] of ordinals) {
    if (re.test(lower) && pool[idx]) return [pool[idx]];
  }

  // Khớp theo tên sản phẩm (2 từ đầu, VD: "iphone 17", "samsung galaxy")
  const matched = pool.filter((p) => {
    const tokens = normalizeVN(p.ten).split(/\s+/).slice(0, 2).join(" ");
    return tokens && lower.includes(tokens);
  });
  if (matched.length) return matched;

  if (pool.length === 1) return pool; // chỉ đang hiển thị đúng 1 sp → không cần nói rõ tên

  return null; // mơ hồ (nhiều sp, không rõ ý) → để AI hỏi lại cho rõ
}

// ── Gọi AI (thử Groq → OpenRouter) ─────────────────────────────────────────
async function callAI(systemPrompt, userMessage, history = []) {
  const groqKey        = process.env.GROQ_API_KEY;
  const openRouterKey  = process.env.OPENROUTER_API_KEY;

  const safeHistory = history.slice(-6).map((h) => ({ role: h.role, content: h.content }));
  const messages    = [
    { role: "system", content: systemPrompt },
    ...safeHistory,
    { role: "user", content: userMessage },
  ];

  // Thử Groq
  if (groqKey) {
    try {
      const Groq  = require("groq-sdk");
      const groq  = new Groq({ apiKey: groqKey });
      // reasoning_effort thấp: openai/gpt-oss-120b mặc định "suy nghĩ" (reasoning
      // tokens) khá nhiều trước khi trả lời — nếu để mặc định, phần suy nghĩ có
      // thể ngốn hết max_tokens và cắt cụt/rỗng câu trả lời thật (finish_reason:
      // "length", content trống). Hạ reasoning xuống "low" + tăng max_tokens để
      // luôn có đủ chỗ cho câu trả lời hiển thị, tránh việc rơi về template.
      const res   = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b", messages, temperature: 0.7, max_tokens: 700,
        reasoning_effort: "low",
      });
      const text = res.choices[0]?.message?.content;
      if (text) return text;
    } catch (e) {
      console.warn("[chat] Groq failed:", e.message);
    }
  }

  // Thử OpenRouter
  if (openRouterKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST", signal: controller.signal,
        headers: { "Authorization": `Bearer ${openRouterKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemma-4-26b-a4b-it:free",
          messages, temperature: 0.65, max_tokens: 400,
        }),
      });
      clearTimeout(timer);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return text;
    } catch (e) {
      console.warn("[chat] OpenRouter failed:", e.message);
    }
  }

  return null; // Cả 2 đều fail → dùng template
}

// ── Template response khi không có AI ───────────────────────────────────────
function buildTemplateReply(message, intent, products) {
  const lower = message.toLowerCase();

  // Chào hỏi
  if (/^(xin chào|xin chao|hi|hello|chào|hey|alo|bạn ơi|bạn|ê bạn)/i.test(lower.trim())) {
    return "Xin chào! 🐰 Mình là Bunny — trợ lý AI của SmartHub!\nBạn đang tìm kiếm sản phẩm gì? Mình có thể giúp tìm điện thoại, laptop, tai nghe, phụ kiện… và nhiều hơn nữa! ✨";
  }

  // Hỏi shop bán gì
  if (/shop.*bán|bán.*gì|có.*gì|shop.*có|sản phẩm.*gì|kinh doanh|danh mục/i.test(lower)) {
    return "SmartHub bán các sản phẩm công nghệ chính hãng 🏪:\n📱 Điện thoại (iPhone, Samsung, Xiaomi…)\n💻 Laptop (Dell, HP, Asus, MacBook…)\n📟 Máy tính bảng (iPad, Samsung Tab…)\n🎧 Tai nghe & Phụ kiện\n📺 Tivi\n\nBạn muốn tìm sản phẩm nào? Mình tư vấn ngay! 🐰";
  }

  if (!intent.is_product_query) {
    return "Mình là Bunny 🐰, chuyên tư vấn sản phẩm công nghệ tại SmartHub!\nHãy cho mình biết bạn đang tìm sản phẩm gì nhé? Ví dụ: \"iPhone mới nhất\", \"Laptop dưới 15 triệu\", \"Tai nghe Samsung\"... 📱💻🎧";
  }

  const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

  if (!products.length) {
    const hint = intent.keyword ? `"${intent.keyword}"` : intent.category_name || "yêu cầu của bạn";
    return `Mình tìm không thấy sản phẩm phù hợp với ${hint} 😅\nBạn có thể thử tìm với từ khóa khác, hoặc điều chỉnh khoảng giá nhé! 🔍`;
  }

  const lines = [];
  if (intent.keyword || intent.category_name || intent.brand_name) {
    const what = intent.keyword || intent.category_name || intent.brand_name;
    lines.push(`Mình tìm được ${products.length} sản phẩm phù hợp với "${what}" ✨`);
  } else {
    lines.push(`Đây là ${products.length} sản phẩm gợi ý cho bạn ✨`);
  }

  if (intent.price_min && intent.price_max) {
    lines.push(`Trong khoảng giá ${fmt(intent.price_min)} – ${fmt(intent.price_max)} 💰`);
  } else if (intent.price_max) {
    lines.push(`Dưới mức giá ${fmt(intent.price_max)} 💰`);
  }

  // Highlight sản phẩm tốt nhất
  const best = products[0];
  const bestPrice = best.giaSale ?? best.gia;
  lines.push(`\n🏆 Nổi bật: **${best.ten}** — ${fmt(bestPrice)}${best.giamGia ? ` (giảm ${best.giamGia}%)` : ""}`);

  lines.push("\nBấm vào thẻ sản phẩm để xem chi tiết nhé! 🐰");
  return lines.join("\n");
}

// ── Main handler ─────────────────────────────────────────────────────────────
exports.chat = async (req, res) => {
  try {
    const { message, history = [], lastProducts = [] } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "Thiếu nội dung tin nhắn" });
    }

    // ── 1. Trích xuất intent ────────────────────────────────────────────────
    const intent = extractIntent(message);

    // ── 2. Query sản phẩm ──────────────────────────────────────────────────
    let products = [];
    if (intent.is_product_query) {
      const filter = { status: "active" };
      if (intent.keyword) {
        // Yêu cầu tên sản phẩm chứa TẤT CẢ các từ khóa (AND), không phải chỉ 1 trong số đó (OR),
        // để "iphone 17" không khớp nhầm các sản phẩm khác chỉ trùng "17" (VD: "OPPO A17").
        const terms = intent.keyword.split(/\s+/).filter(Boolean).slice(0, 4);
        filter.product_name = { $regex: terms.map((t) => `(?=.*${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`).join(""), $options: "i" };
      }
      if (intent.category_name) filter.category_name = { $regex: intent.category_name, $options: "i" };
      if (intent.brand_name)    filter.brand_name    = { $regex: intent.brand_name,    $options: "i" };

      const sortMap = { newest: { created_at: -1 }, rating: { avg_rating: -1 }, sold: { total_sold: -1 } };
      const dbSort = sortMap[intent.sort] || sortMap.newest;

      let found = await Product.find(filter).sort(dbSort).limit(24).lean();
      found = await hydrateProducts(found);

      if (intent.price_min != null || intent.price_max != null) {
        found = found.filter((p) => {
          const eff = p.giaSale ?? p.gia;
          if (intent.price_min != null && eff < intent.price_min) return false;
          if (intent.price_max != null && eff > intent.price_max) return false;
          return true;
        });
      }
      if (intent.sort === "price_asc")  found.sort((a, b) => (a.giaSale ?? a.gia) - (b.giaSale ?? b.gia));
      if (intent.sort === "price_desc") found.sort((a, b) => (b.giaSale ?? b.gia) - (a.giaSale ?? a.gia));

      products = found.slice(0, 6);
    }

    // ── 2.5 Hành động thêm giỏ hàng / đặt hàng ─────────────────────────────
    // Khách vừa tìm sp trong lượt này thì ưu tiên dùng danh sách đó, không thì
    // dùng lại danh sách sp đã hiển thị ở lượt trước (FE gửi kèm lên).
    const cartAction = detectCartAction(message);
    if (cartAction.addCart || cartAction.wantsCheckout) {
      const pool = products.length ? products : (Array.isArray(lastProducts) ? lastProducts : []);
      const targets = resolveCartTargets(message, pool);
      if (targets && targets.length) {
        const fmt2 = (n) => new Intl.NumberFormat("vi-VN").format(n) + "đ";
        const lines = [`Mình đã thêm ${targets.length} sản phẩm vào giỏ hàng cho bạn rồi nhé 🛒✅`];
        targets.forEach((p) => lines.push(`• ${p.ten} — ${fmt2(p.giaSale ?? p.gia)}`));
        if (cartAction.wantsCheckout) lines.push(`\nBấm nút bên dưới để tới trang thanh toán và hoàn tất đơn hàng nhé 💳`);

        return res.json({
          success: true,
          reply: lines.join("\n"),
          products: [],
          cartAction: {
            items: targets.map((p) => ({
              productId: String(p.id), tenSanPham: p.ten, hinhAnh: p.thumbnail, gia: p.giaSale ?? p.gia,
            })),
          },
          cta: cartAction.wantsCheckout ? { label: "Đến trang thanh toán →", href: "/thanhtoan" } : null,
        });
      }
      // Không xác định được sản phẩm nào (mơ hồ/chưa có sp nào từng hiển thị)
      // → để rơi xuống bước 3, nhờ AI hỏi lại cho rõ dựa trên ngữ cảnh hội thoại.
    }

    // ── 3. Sinh phản hồi ───────────────────────────────────────────────────
    const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n) + "đ";
    const productCtx = products.length
      ? `\n[Sản phẩm tìm được]\n` +
        products.map((p, i) => `${i + 1}. ${p.ten} (${p.thuongHieu}) — ${fmt(p.giaSale ?? p.gia)}${p.giamGia ? ` giảm ${p.giamGia}%` : ""} — ★${p.danhGia}/5`).join("\n")
      : intent.is_product_query ? "\n[Không tìm thấy sản phẩm]" : "";

    const systemPrompt = `Bạn là Bunny 🐰 — trợ lý AI của SmartHub.
SmartHub CHỈ là một shop bán lẻ điện tử online tại Việt Nam — bán đúng 5 nhóm hàng: Điện thoại, Laptop, Máy tính bảng, Tai nghe & Phụ kiện, Tivi. SmartHub không tự phát triển phần mềm/app/AI riêng, không có "phiên bản", "dashboard", "tính năng mới", "sự kiện/hackathon" nào ngoài việc bán hàng — đừng nhầm SmartHub với một hãng công nghệ.

Bạn là một AI thực sự, không phải chatbot trả lời theo kịch bản cứng nhắc — hãy trò chuyện tự nhiên như con người:
- Đọc kỹ lịch sử hội thoại phía trên để hiểu ngữ cảnh, nhớ những gì khách đã nói/hỏi trước đó, không hỏi lại thông tin khách đã cung cấp.
- Trả lời đúng trọng tâm câu hỏi thật của khách — kể cả khi họ tám chuyện, hỏi ngoài lề, đùa giỡn, hay hỏi ý kiến/so sánh — thay vì lúc nào cũng lái về "bạn cần tìm sản phẩm gì?".
- Có cá tính: thân thiện, dí dỏm, ấm áp như một người tư vấn thật, không rập khuôn, không lặp lại y nguyên các câu chào/giới thiệu ở mỗi lượt.
- Ngắn gọn, tự nhiên (thường 2-5 câu), emoji vừa phải, không lạm dụng.

QUY TẮC BẮT BUỘC — chống bịa đặt:
- Khi tư vấn sản phẩm → CHỈ dùng tên/giá/thông số trong "[Sản phẩm tìm được]" bên dưới (nếu có). Tuyệt đối không tự nghĩ ra tên sản phẩm, model, mức giá.
- Nếu thấy "[Không tìm thấy sản phẩm]" → nói thật là chưa tìm thấy, hỏi lại để hiểu rõ nhu cầu hơn (đổi từ khóa/khoảng giá), KHÔNG được bịa ra sản phẩm khác để lấp chỗ trống.
- Không tự bịa ra tin tức, xu hướng công nghệ, khuyến mãi, sự kiện, chương trình, tính năng app, hay "cập nhật" nào của SmartHub nếu không có trong dữ liệu được cung cấp — nếu khách hỏi kiểu "có gì mới/hot không", chỉ được trả lời dựa trên sản phẩm thực tế trong danh sách bên dưới; nếu không có, thành thật nói chưa có thông tin cụ thể và gợi ý khách xem trực tiếp trang sản phẩm hoặc cho biết cụ thể họ đang quan tâm loại nào.${productCtx}`;

    const aiReply = await callAI(systemPrompt, message, Array.isArray(history) ? history : []);
    const reply   = aiReply || buildTemplateReply(message, intent, products);

    res.json({ success: true, reply, products });
  } catch (err) {
    console.error("[chatController]", err.message);
    res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
  }
};
