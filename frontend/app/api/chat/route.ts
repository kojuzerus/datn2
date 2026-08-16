import { NextRequest, NextResponse } from "next/server";

// Vercel giới hạn mặc định 10s cho serverless function (gói Hobby) — model AI
// free đôi khi mất 5-15s để trả lời nên bị ngắt giữa chừng và luôn rơi về
// template. Khai báo rõ thời lượng tối đa cho phép (Hobby cho phép tới 60s).
export const maxDuration = 60;

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Intent extraction ─────────────────────────────────────────────────────────
const CATEGORY_PATTERNS: [RegExp, string][] = [
  [/điện thoại|smartphone|phone|iphone|android/i,               "Điện thoại"],
  [/laptop|máy tính xách tay|notebook|macbook/i,                "Laptop"],
  [/tablet|máy tính bảng|ipad/i,                               "Máy tính bảng"],
  [/tai nghe|earphone|airpod|headphone|earbud|buds/i,          "Phụ kiện"],
  [/tivi|smart tv|màn hình/i,                                  "Tivi"],
  [/đồng hồ|watch|smartwatch/i,                                "Phụ kiện"],
  [/phụ kiện|sạc|cáp|ốp lưng|bàn phím|chuột|loa|speaker|pin|hub/i, "Phụ kiện"],
];

const BRANDS = [
  "apple","samsung","xiaomi","oppo","vivo","realme","nokia","sony",
  "lg","dell","hp","lenovo","asus","acer","msi","huawei","jbl","anker",
  "logitech","razer","corsair","gigabyte","baseus","ugreen",
];

interface Intent {
  is_product_query: boolean;
  keyword:   string | null;
  category:  string | null;
  brand:     string | null;
  price_min: number | null;
  price_max: number | null;
  sort:      string;
}

function extractIntent(msg: string): Intent {
  const lower = msg.toLowerCase();
  const intent: Intent = {
    is_product_query: false,
    keyword: null, category: null, brand: null,
    price_min: null, price_max: null, sort: "newest",
  };

  // Gộp thêm toàn bộ BRANDS + mọi từ khóa đã dùng để nhận diện danh mục
  // (CATEGORY_PATTERNS) để không bỏ sót các câu chỉ gõ tên hãng/dòng máy/loại
  // sản phẩm (VD: "macbook air", "vivo v30", "airpods") mà thiếu động từ kích
  // hoạt phía trước. Lấy từ CATEGORY_PATTERNS thay vì liệt kê tay để tránh lặp
  // lại kiểu lỗi "thiếu từ khóa" mỗi khi thêm danh mục mới.
  const triggers = new RegExp(
    [
      "tìm", "muốn", "mua", "xem", "cần", "gợi ý", "tư vấn", "giá", "rẻ", "đắt",
      "mới nhất", "bán chạy", "so sánh", "khuyến mãi", "sale", "giảm giá",
      ...CATEGORY_PATTERNS.map(([re]) => re.source),
      ...BRANDS,
    ].join("|"),
    "i"
  );
  intent.is_product_query = triggers.test(lower);

  for (const [re, cat] of CATEGORY_PATTERNS) {
    if (re.test(lower)) { intent.category = cat; break; }
  }
  for (const brand of BRANDS) {
    if (lower.includes(brand)) { intent.brand = brand; break; }
  }

  // Từ chung chung không dùng làm keyword search — dùng category thay
  const GENERIC_WORDS = new Set([
    "điện thoại","smartphone","phone","laptop","máy tính xách tay","notebook",
    "tablet","máy tính bảng","ipad","tai nghe","earphone","headphone","earbud",
    "tivi","smart tv","màn hình","đồng hồ","smartwatch","watch",
    "phụ kiện","sạc","cáp","loa","speaker","chuột","bàn phím",
  ]);

  // Ưu tiên bắt tên hãng/dòng máy CỤ THỂ trước (VD: "iphone", "galaxy s24") vì
  // đây là tín hiệu chính xác nhất. Nếu để pattern "tìm/mua/muốn..." chạy trước,
  // nó sẽ nuốt luôn cả động từ + danh mục chung chung phía trước tên máy (VD:
  // "mua điện thoại iphone" → capture "mua điện thoại iphone" thay vì "iphone"),
  // khiến tìm kiếm theo cụm đó không khớp sản phẩm nào và rơi về danh mục rộng
  // (ra luôn cả Samsung, OPPO... dù khách chỉ hỏi iPhone).
  const m2 = msg.match(
    /(?:iphone|samsung|xiaomi|oppo|laptop|macbook|galaxy|redmi|poco|vivobook|zenbook|ideapad|vivo|realme|nokia|sony|lg|dell|hp|lenovo|asus|acer|msi|huawei|jbl|anker|logitech|razer|airpod|tai nghe|earbud|buds|loa|speaker|bàn phím|chuột|sạc|ốp lưng|tablet|ipad|đồng hồ|watch)(?:\s+(?!giá|dưới|trên|từ|khoảng|với|tốt|rẻ|bền|triệu|tr\b)[\w]+){0,3}/i
  );
  const kwMatch = msg.match(/(?:tìm|mua|xem|muốn|cần|gợi ý)\s+(.{2,50}?)(?:\s+(?:giá|dưới|từ|khoảng|với|tốt|rẻ|bền)|[?.!]|$)/i);
  if (m2) {
    intent.keyword = m2[0].trim();
  } else if (kwMatch) {
    const raw = kwMatch[1].trim().toLowerCase();
    if (!GENERIC_WORDS.has(raw)) intent.keyword = kwMatch[1].trim();
  } else if (intent.brand) {
    intent.keyword = intent.brand;
  }

  let m: RegExpMatchArray | null;
  if      ((m = msg.match(/dưới\s*(\d+(?:[,.]\d+)?)\s*(?:triệu|tr|k|nghìn)/i)))
    intent.price_max = parseFloat(m[1].replace(",",".")) * (/k|nghìn/i.test(m[0]) ? 1_000 : 1_000_000);
  else if ((m = msg.match(/trên\s*(\d+(?:[,.]\d+)?)\s*(?:triệu|tr)/i)))
    intent.price_min = parseFloat(m[1].replace(",",".")) * 1_000_000;
  else if ((m = msg.match(/(?:từ\s*)?(\d+(?:[,.]\d+)?)\s*[-–đến]+\s*(\d+(?:[,.]\d+)?)\s*(?:triệu|tr)/i))) {
    intent.price_min = parseFloat(m[1].replace(",",".")) * 1_000_000;
    intent.price_max = parseFloat(m[2].replace(",",".")) * 1_000_000;
  } else if ((m = msg.match(/khoảng\s*(\d+(?:[,.]\d+)?)\s*(?:triệu|tr)/i))) {
    const v = parseFloat(m[1].replace(",",".")) * 1_000_000;
    intent.price_min = v * 0.8; intent.price_max = v * 1.25;
  }

  if      (/rẻ nhất|giá rẻ|thấp nhất|tiết kiệm/i.test(lower)) intent.sort = "price_asc";
  else if (/đắt nhất|cao nhất|cao cấp/i.test(lower))           intent.sort = "price_desc";
  else if (/bán chạy|hot nhất|phổ biến|nhiều người/i.test(lower)) intent.sort = "sold";
  else if (/đánh giá cao|tốt nhất|rating|review/i.test(lower)) intent.sort = "rating";

  return intent;
}

// ── Fetch sản phẩm ────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

// Backend dùng `search` trực tiếp làm regex trên product_name. Nếu truyền nguyên
// cụm "samsung s26", nó chỉ khớp khi 2 từ đứng LIỀN NHAU — trong khi tên thật là
// "Samsung Galaxy S26..." (có "Galaxy" chen giữa) nên sẽ không khớp gì cả. Build
// một regex kiểu AND-lookahead để mỗi từ khóa chỉ cần xuất hiện đâu đó trong tên,
// không cần liền kề hay đúng thứ tự.
function buildSearchRegex(keyword: string): string {
  const terms = keyword.split(/\s+/).filter(Boolean).slice(0, 4);
  return terms.map((t) => `(?=.*${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`).join("");
}

async function fetchProducts(intent: Intent) {
  const sortMap: Record<string,string> = { newest:"newest", sold:"sold", rating:"rating", price_asc:"price_asc", price_desc:"price_desc" };
  const sort = sortMap[intent.sort] || "newest";

  const priceFilter = (products: any[]) => {
    if (intent.price_min == null && intent.price_max == null) return products;
    return products.filter((p) => {
      const eff = p.giaSale ?? p.gia;
      if (intent.price_min != null && eff < intent.price_min) return false;
      if (intent.price_max != null && eff > intent.price_max) return false;
      return true;
    });
  };

  const doFetch = async (params: URLSearchParams) => {
    try {
      const res = await fetch(`${BACKEND}/api/products?${params}`, { next: { revalidate: 0 } });
      if (!res.ok) return [];
      const data = await res.json();
      return priceFilter(data.data || []).slice(0, 8);
    } catch { return []; }
  };

  // 1. Keyword search (chỉ khi keyword là tên model/brand cụ thể)
  if (intent.keyword) {
    const p = new URLSearchParams({ limit: "20", search: buildSearchRegex(intent.keyword), sort });
    const results = await doFetch(p);
    if (results.length > 0) return results;
  }

  // 2. Fallback: category search
  if (intent.category) {
    const p = new URLSearchParams({ limit: "20", category_name: intent.category, sort });
    const results = await doFetch(p);
    if (results.length > 0) return results;
  }

  // 3. Fallback: brand search
  if (intent.brand) {
    const p = new URLSearchParams({ limit: "20", search: intent.brand, sort });
    return doFetch(p);
  }

  return [];
}

// ── System prompt ─────────────────────────────────────────────────────────────
function buildSystemPrompt(productCtx: string): string {
  return `Bạn là Bunny 🐰 — trợ lý AI thông minh của SmartHub, cửa hàng điện tử công nghệ Việt Nam.

TÍNH CÁCH:
- Thân thiện, tự nhiên, trò chuyện như người thật — không cứng nhắc hay máy móc
- Nhiệt tình tư vấn, hỏi lại để hiểu đúng nhu cầu khách
- Dùng tiếng Việt tự nhiên, có thể dùng 1-2 emoji cho sinh động

CÓ THỂ GIÚP:
- Tư vấn sản phẩm công nghệ: điện thoại, laptop, tablet, tai nghe, phụ kiện
- So sánh, giải thích thông số kỹ thuật, gợi ý theo nhu cầu & ngân sách
- Giải đáp câu hỏi về công nghệ nói chung (pin, camera, chip, RAM…)
- Trò chuyện thông thường, hỏi đáp thoải mái
- Thông tin SmartHub: bảo hành 12 tháng, đổi trả 30 ngày, giao hàng 2h nội thành, trả góp 0%

KHI TƯ VẤN SẢN PHẨM:
- Dựa trên danh sách thực tế bên dưới — không bịa thêm model/giá không có
- Nếu khách chưa rõ nhu cầu → hỏi thêm (ngân sách, dùng để làm gì, hãng ưu thích)
- Nếu không có sản phẩm phù hợp → thành thật, gợi ý hướng tìm kiếm khác
- Khách nói "cái này", "cái đó", "sản phẩm này", "mẫu đó"... → xem lại lịch sử
  hội thoại, tìm dòng "[Sản phẩm đã hiển thị: ...]" gần nhất để biết chính xác
  đang nói về sản phẩm nào, rồi trả lời theo đúng tên/giá đó. Nếu không tìm
  thấy sản phẩm nào từng hiển thị, hỏi lại khách muốn nói đến sản phẩm nào
- Đặt hàng, thanh toán: xác nhận lại tên sản phẩm khách chọn rồi hướng dẫn bấm
  vào thẻ sản phẩm hoặc nút "Xem tất cả sản phẩm" để vào trang đặt hàng thật
  (chatbox không tự chốt đơn được) — không nói khách chờ "nhân viên hỗ trợ"
  một cách chung chung
- Đổi trả, khiếu nại cụ thể một đơn hàng đã mua → hướng đến nhân viên hỗ trợ

ĐỊNH DẠNG TRẢ LỜI (bắt buộc — khung chat rất nhỏ, không hiển thị markdown):
- Chỉ dùng văn bản thuần, xuống dòng thường và emoji để nhấn mạnh
- TUYỆT ĐỐI KHÔNG dùng: bảng biểu (|), tiêu đề (#, ##), chữ đậm (**), gạch đầu dòng markdown (-, *) ở đầu dòng
- Nếu cần liệt kê, dùng số thứ tự "1.", "2."... hoặc emoji, viết liền mạch từng dòng
- Tối đa khoảng 80-100 từ mỗi câu trả lời, đi thẳng vào trọng tâm
${productCtx}`;
}

// ── AI providers ──────────────────────────────────────────────────────────────

/** Claude (Anthropic) — tốt nhất cho tiếng Việt */
async function callClaude(system: string, userMsg: string, history: any[]): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20_000);
    const messages = [
      ...history.slice(-10).map((h: any) => ({ role: h.role, content: h.content })),
      { role: "user", content: userMsg },
    ];
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: controller.signal,
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 600,
        system,
        messages,
      }),
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch { return null; }
}

/** Groq — miễn phí, rất nhanh */
async function callGroq(system: string, userMsg: string, history: any[]): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20_000);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", signal: controller.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          ...history.slice(-10),
          { role: "user", content: userMsg },
        ],
        temperature: 0.7, max_tokens: 600,
      }),
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

/** OpenRouter — fallback miễn phí */
async function callOpenRouter(system: string, userMsg: string, history: any[]): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) { console.error("[chat] OPENROUTER_API_KEY missing in this environment"); return null; }
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 35_000);
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal: controller.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // Model free hiện có trên OpenRouter đa phần là "reasoning model" (tự sinh
        // chuỗi suy luận trước khi trả lời). Nếu không giới hạn reasoning, model có
        // thể tiêu hết max_tokens vào phần suy luận và trả về content rỗng. Giới
        // hạn reasoning.max_tokens để luôn còn ngân sách cho câu trả lời thật.
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        reasoning: { max_tokens: 150 },
        messages: [
          { role: "system", content: system },
          ...history.slice(-10),
          { role: "user", content: userMsg },
        ],
        temperature: 0.7, max_tokens: 900,
      }),
    });
    clearTimeout(t);
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[chat] OpenRouter HTTP", res.status, errBody.slice(0, 500));
      return null;
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) console.error("[chat] OpenRouter empty content", JSON.stringify(data).slice(0, 500));
    return content || null;
  } catch (e: any) {
    console.error("[chat] OpenRouter fetch threw:", e?.name, e?.message);
    return null;
  }
}

// ── Template fallback ─────────────────────────────────────────────────────────
function buildReply(msg: string, intent: Intent, products: any[]): string {
  const lower = msg.toLowerCase().trim();

  if (/^(xin chào|chào|hi|hello|hey|alo|chao|xin chao)/.test(lower))
    return "Xin chào! 🐰 Mình là Bunny — trợ lý AI của SmartHub!\nBạn đang tìm sản phẩm gì? Mình tư vấn điện thoại, laptop, tai nghe, phụ kiện… và nhiều hơn nữa! ✨";

  if (/cảm ơn|thanks|thank|ok bạn|oke/.test(lower))
    return "Không có gì! 🐰 Nếu cần tư vấn thêm cứ hỏi mình nhé. SmartHub luôn sẵn sàng hỗ trợ bạn! 😊";

  if (/chính sách|bảo hành|đổi trả|giao hàng/.test(lower))
    return "SmartHub có các chính sách sau:\n• 🛡️ Bảo hành 12 tháng chính hãng\n• 🔄 Đổi trả miễn phí trong 30 ngày\n• 🚀 Giao hàng trong 2h nội thành\n• 💳 Trả góp 0% lên đến 24 tháng";

  if (!intent.is_product_query) {
    if (/bạn là ai|bạn tên|mày là|mình là bunny|giới thiệu/i.test(lower))
      return "Mình là Bunny 🐰 — trợ lý AI của SmartHub! Mình có thể tư vấn điện thoại, laptop, tai nghe, và giải đáp câu hỏi công nghệ. Bạn đang cần tìm gì? 😊";
    if (/cảm ơn|thanks|thank|ok bạn|oke|được rồi/.test(lower))
      return "Không có gì! 😊 Nếu cần tư vấn thêm cứ hỏi mình nhé!";
    // Câu hỏi chung chung → gợi ý nhẹ, không chặn cứng
    return "Mình chưa hiểu hết câu hỏi 😅 Bạn đang muốn tìm sản phẩm gì, hoặc có câu hỏi công nghệ gì mình có thể giúp không? 🐰";
  }

  // Category chung (không có tên model cụ thể) → tư vấn như người thật
  if (intent.category && !intent.keyword) {
    if (!products.length) {
      return `Hiện SmartHub đang cập nhật thêm ${intent.category} mới bạn nhé! 😊\nBạn cho mình biết ngân sách hoặc hãng muốn dùng — mình tư vấn chính xác hơn! 🐰`;
    }
    const priceNote = intent.price_max ? ` dưới ${fmt(intent.price_max)}` : "";
    const lines = [`SmartHub đang có **${products.length} mẫu ${intent.category}**${priceNote} 📱\nDưới đây là một số gợi ý nổi bật:\n`];
    products.slice(0, 3).forEach((p, i) => {
      const price = fmt(p.giaSale ?? p.gia);
      const disc = p.giamGia ? ` (giảm ${p.giamGia}%)` : "";
      lines.push(`${i + 1}. **${p.ten}** — ${price}${disc} ★${p.danhGia}/5`);
    });
    lines.push("\nBạn ưu tiên tiêu chí gì: camera, hiệu năng hay pin? Mình tư vấn thêm nhé! 🐰");
    return lines.join("\n");
  }

  if (!products.length) {
    const hint = intent.keyword || intent.brand;
    return `Hmm, mình chưa tìm thấy "${hint}" trong kho SmartHub 😅\nBạn thử nhập tên model đầy đủ hơn, hoặc cho mình biết bạn cần loại sản phẩm gì — mình gợi ý ngay! 🐰`;
  }

  const what = intent.keyword || intent.category || intent.brand;
  const lines = [`Tìm được **${products.length} sản phẩm**${what ? ` cho "${what}"` : ""} ✨`];
  if (intent.price_max) lines.push(`Trong khoảng dưới ${fmt(intent.price_max)} 💰`);
  const best = products[0];
  lines.push(`\n🏆 **${best.ten}** — ${fmt(best.giaSale ?? best.gia)}${best.giamGia ? ` (-${best.giamGia}%)` : ""} ★${best.danhGia}/5`);
  lines.push("Bấm vào sản phẩm để xem chi tiết nhé! 🐰");
  return lines.join("\n");
}

// ── Dedupe lặp output (bug thường gặp ở model free nhỏ: sinh lại nguyên văn
// câu trả lời 2 lần liền nhau) ──────────────────────────────────────────────
function dedupeRepeatedReply(text: string): string {
  const trimmed = text.trim();
  // Thử mọi ranh giới đoạn (không chỉ gần giữa) — model có thể lặp nguyên khối
  // ở bất kỳ vị trí nào, và độ dài 2 nửa không luôn bằng nhau tuyệt đối.
  const parts = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  for (let i = 1; i < parts.length; i++) {
    const first  = parts.slice(0, i).join("\n\n");
    const second = parts.slice(i).join("\n\n");
    if (first.length > 20 && second === first) return first;
  }
  return trimmed;
}

// ── Validator: một số model free hay rò rỉ nguyên văn chuỗi suy luận (chain-of-
// thought) tiếng Anh thẳng vào content thay vì tách riêng — hoặc vẫn lọt markdown
// dù đã cấm trong system prompt. Phát hiện và loại bỏ để không hiển thị rác cho
// khách, thà rơi về template còn hơn hiển thị output hỏng.
function isUsableReply(text: string): boolean {
  const t = text.trim();
  if (t.length < 2) return false;

  // Rò rỉ chain-of-thought có thể nằm ở BẤT KỲ đâu trong văn bản (đầu, giữa,
  // hoặc bao trọn câu trả lời thật) — quét toàn văn tìm các cụm "meta" điển
  // hình của suy luận tiếng Anh thay vì chỉ kiểm tra đầu câu.
  const reasoningMarkers = [
    /\bwe need\b/i, /\bwe should\b/i, /\bwe (can|must|could)\b/i,
    /\blet('|’)s\b/i, /\blet me\b/i, /\bi need to\b/i, /\bi should\b/i,
    /\bthe user\b/i, /\bbased on (actual|the)\b/i, /\binstruction says\b/i,
    /\bword count\b/i, /\bcount words\b/i, /\bmust stay within\b/i,
    /\bdraft:/i, /\bcraft\b/i, /\bfabricat/i, /\bsafest is\b/i,
    /\bwithin 80-100\b/i, /\bplain text\b/i, /\bno markdown\b/i,
    /\bensure\b/i, /\bfinal answer\b/i, /\bit('|’)s okay\b/i,
    /\bshort lines\b/i, /\bconcise answer\b/i, /\bmake sure\b/i,
    /\bkeep it\b/i, /^\s*ok,/i, /\betc\.?\s*$/im,
  ];
  const leakHits = reasoningMarkers.reduce((n, re) => n + (re.test(t) ? 1 : 0), 0);
  if (leakHits >= 1) return false;

  // Rò rỉ kiểu tự đánh số đếm từ để kiểm tra giới hạn độ dài, VD:
  // "Chào(1) bạn!(2) 😊(3)..." hoặc chỉ "cái(9) này" — dấu hiệu model đang lộ
  // bước đếm từ nội bộ. Mẫu "chữ(số)" gần như không bao giờ xuất hiện trong văn
  // bản tiếng Việt tự nhiên nên chỉ cần gặp 1 lần là đủ để nghi ngờ và chặn.
  if (/\S\(\d{1,3}\)/.test(t)) return false;

  // Markdown bị cấm nhưng vẫn lọt (bảng, tiêu đề, in đậm)
  if (/^#{1,6}\s|\|.*\|.*\|/m.test(t) || /\*\*[^*]+\*\*/.test(t)) return false;

  // Câu trả lời cho khách tiếng Việt mà toàn tiếng Anh (dấu hiệu rò rỉ reasoning)
  // → đếm tỉ lệ ký tự có dấu tiếng Việt so với độ dài, nếu quá thấp trên văn bản
  // đủ dài thì nghi ngờ là rác.
  const vietnameseChars = (t.match(/[à-ỹ]/gi) || []).length;
  if (t.length > 120 && vietnameseChars === 0) return false;

  return true;
}

// ── Bóc tách phần trả lời sạch khỏi output có lẫn rác đầu câu ─────────────────
// Model free đôi khi in kèm ghi chú lập kế hoạch tiếng Anh trước câu trả lời
// thật (VD: `. Ensure no markdown... Final answer: "Không có gì!..."`). Thay vì
// vứt bỏ toàn bộ chỉ vì vài từ rác ở đầu, thử bóc tách phần nội dung sạch còn
// dùng được: ưu tiên cụm trong ngoặc kép cuối cùng, sau đó thử cắt dần từng
// đoạn/dòng đầu cho đến khi phần còn lại vượt qua kiểm tra.
function extractCleanReply(raw: string): string | null {
  const t = raw.trim();

  const quotes = [...t.matchAll(/"([^"]{10,500})"/g)];
  if (quotes.length) {
    const candidate = quotes[quotes.length - 1][1].trim();
    if (isUsableReply(candidate)) return candidate;
  }

  const paragraphs = t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  for (let i = 0; i < paragraphs.length; i++) {
    const rest = paragraphs.slice(i).join("\n\n");
    if (isUsableReply(rest)) return rest;
  }

  const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const rest = lines.slice(i).join("\n");
    if (isUsableReply(rest)) return rest;
  }

  console.error("[chat] extractCleanReply rejected entire AI output:", t.slice(0, 300));
  return null;
}

// ── Đối chiếu câu hỏi ngắn với sản phẩm vừa hiển thị trong lịch sử ────────────
// Khách hay gõ tắt kiểu tham chiếu ("15 plus", "cái đó", "mẫu i14") thay vì lặp
// lại đầy đủ tên sản phẩm — các pattern trigger/brand/category cố định sẽ
// không bắt được câu này. Nếu có danh sách "[Sản phẩm đã hiển thị: ...]" (do
// frontend nhúng vào lịch sử) và câu hỏi hiện tại khớp với 1 trong số đó, dùng
// luôn tên sản phẩm đó làm từ khóa tìm kiếm thay vì trả lời chung chung.
function resolveKeywordFromHistory(message: string, history: any[]): string | null {
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

  let shownNames: string[] = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const content: string = history[i]?.content || "";
    const m = content.match(/\[Sản phẩm đã hiển thị: ([^\]]+)\]/);
    if (m) {
      shownNames = [...m[1].matchAll(/([^,]+?)\s*\([^)]*\)/g)].map((x) => x[1].trim());
      break;
    }
  }
  if (!shownNames.length) return null;

  const msgTokens = norm(message).split(/\s+/).filter(Boolean);
  if (!msgTokens.length) return null;

  for (const name of shownNames) {
    const nameNorm = norm(name);
    if (msgTokens.every((tok) => nameNorm.includes(tok))) return name;
  }
  return null;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body    = await req.json();
    const message: string = body.message?.trim() || "";
    const history: any[]  = Array.isArray(body.history) ? body.history : [];

    if (!message) return NextResponse.json({ success: false, message: "Thiếu nội dung" }, { status: 400 });

    const intent = extractIntent(message);

    // Câu hỏi không khớp trigger nào NHƯNG khớp tên sản phẩm vừa hiển thị →
    // vẫn coi là truy vấn sản phẩm, tìm đúng sản phẩm đó thay vì bỏ qua.
    if (!intent.is_product_query) {
      const resolved = resolveKeywordFromHistory(message, history);
      if (resolved) { intent.is_product_query = true; intent.keyword = resolved; }
    }

    let products = intent.is_product_query ? await fetchProducts(intent) : [];

    // Từ khóa gốc không ra kết quả nào — thử lại bằng tên sản phẩm đã hiển thị
    // trước đó (trường hợp trigger có khớp nhưng từ khóa trích ra bị lệch).
    if (intent.is_product_query && products.length === 0) {
      const resolved = resolveKeywordFromHistory(message, history);
      if (resolved && resolved.toLowerCase() !== (intent.keyword || "").toLowerCase()) {
        intent.keyword = resolved;
        products = await fetchProducts(intent);
      }
    }

    const productCtx = products.length
      ? `\nSẢN PHẨM HIỆN CÓ (dùng để tư vấn):\n` + products.map((p, i) =>
          `${i+1}. ${p.ten} (${p.thuongHieu}) | Giá: ${fmt(p.giaSale ?? p.gia)}${p.giamGia ? ` | Giảm: ${p.giamGia}%` : ""} | Đánh giá: ★${p.danhGia}/5`
        ).join("\n")
      : intent.is_product_query ? "\n[Không có sản phẩm phù hợp trong kho]" : "";

    const system = buildSystemPrompt(productCtx);

    // Thử lần lượt: Claude → Groq → OpenRouter → template
    const aiReplyRaw = await callClaude(system, message, history)
                     ?? await callGroq(system, message, history)
                     ?? await callOpenRouter(system, message, history);
    const aiReplyDeduped = aiReplyRaw ? dedupeRepeatedReply(aiReplyRaw) : null;
    const aiReply = aiReplyDeduped ? extractCleanReply(aiReplyDeduped) : null;

    const reply = aiReply || buildReply(message, intent, products);

    return NextResponse.json({ success: true, reply, products });
  } catch (err: any) {
    console.error("[/api/chat]", err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
