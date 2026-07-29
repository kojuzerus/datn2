import { NextRequest, NextResponse } from "next/server";

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

  const kwMatch = msg.match(/(?:tìm|mua|xem|muốn|cần|gợi ý)\s+(.{2,50}?)(?:\s+(?:giá|dưới|từ|khoảng|với|tốt|rẻ|bền)|[?.!]|$)/i);
  if (kwMatch) {
    intent.keyword = kwMatch[1].trim();
  } else {
    // "iPhone 17", "vivo v30", "airpods", v.v. gõ trực tiếp không kèm động từ hay
    // thương hiệu đã nhận diện được (BRANDS không có "iphone", chỉ có "apple") —
    // không còn phụ thuộc vào intent.brand nữa. Gồm cả các từ chỉ LOẠI sản phẩm
    // (airpod, tai nghe, loa...) chứ không chỉ tên hãng, để "airpods" tìm đúng
    // AirPods thay vì trả về nguyên danh mục "Phụ kiện" (bàn phím, loa, tai nghe...
    // trộn chung). Dừng trước các từ chỉ giá để không nuốt cụm giá.
    const m2 = msg.match(
      /(?:iphone|samsung|xiaomi|oppo|laptop|macbook|galaxy|redmi|poco|vivobook|zenbook|ideapad|vivo|realme|nokia|sony|lg|dell|hp|lenovo|asus|acer|msi|huawei|jbl|anker|logitech|razer|airpod|tai nghe|earbud|buds|loa|speaker|bàn phím|chuột|sạc|ốp lưng|tablet|ipad|đồng hồ|watch)(?:\s+(?!giá|dưới|trên|từ|khoảng|với|tốt|rẻ|bền|triệu|tr\b)[\w]+){0,3}/i
    );
    if (m2) intent.keyword = m2[0].trim();
    else if (intent.brand) intent.keyword = intent.brand;
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
  const params = new URLSearchParams({ limit: "20" });
  if (intent.keyword)        params.set("search", buildSearchRegex(intent.keyword));
  else if (intent.category)  params.set("category_name", intent.category);
  else if (intent.brand)     params.set("search", intent.brand);
  const sortMap: Record<string,string> = { newest:"newest", sold:"sold", rating:"rating", price_asc:"price_asc", price_desc:"price_desc" };
  params.set("sort", sortMap[intent.sort] || "newest");

  try {
    const res = await fetch(`${BACKEND}/api/products?${params}`, { next: { revalidate: 0 } });
    if (!res.ok) return [];
    const data = await res.json();
    let products: any[] = data.data || [];
    if (intent.price_min != null || intent.price_max != null) {
      products = products.filter((p) => {
        const eff = p.giaSale ?? p.gia;
        if (intent.price_min != null && eff < intent.price_min) return false;
        if (intent.price_max != null && eff > intent.price_max) return false;
        return true;
      });
    }
    return products.slice(0, 8);
  } catch { return []; }
}

// ── System prompt ─────────────────────────────────────────────────────────────
function buildSystemPrompt(productCtx: string): string {
  return `Bạn là Bunny 🐰 — trợ lý tư vấn AI của SmartHub, cửa hàng điện tử công nghệ Việt Nam.

NGUYÊN TẮC TRẢ LỜI:
- Luôn trả lời bằng tiếng Việt, thân thiện, nhiệt tình nhưng chuyên nghiệp
- Trả lời ngắn gọn, súc tích (tối đa 150 từ), đúng trọng tâm câu hỏi
- Dùng emoji vừa phải (1-3 cái), không lạm dụng
- Nếu được hỏi về sản phẩm: dựa vào danh sách thực tế bên dưới, không bịa thông tin
- Nếu không có sản phẩm phù hợp: thành thật và gợi ý từ khóa khác
- Có thể tư vấn: so sánh sản phẩm, gợi ý theo nhu cầu, giải thích thông số kỹ thuật, tư vấn giá
- Không hỗ trợ: đặt hàng, thanh toán, đổi trả (hướng đến nhân viên hỗ trợ)

VỀ SMARTHUB:
- Chuyên kinh doanh: điện thoại, laptop, tablet, tai nghe, phụ kiện công nghệ
- Chính sách: bảo hành 12 tháng, đổi trả 30 ngày, giao hàng trong 2h nội thành
- Thanh toán: tiền mặt, chuyển khoản, trả góp 0%
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
  if (!key) return null;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 25_000);
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal: controller.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
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

// ── Template fallback ─────────────────────────────────────────────────────────
function buildReply(msg: string, intent: Intent, products: any[]): string {
  const lower = msg.toLowerCase().trim();

  if (/^(xin chào|chào|hi|hello|hey|alo|chao|xin chao)/.test(lower))
    return "Xin chào! 🐰 Mình là Bunny — trợ lý AI của SmartHub!\nBạn đang tìm sản phẩm gì? Mình tư vấn điện thoại, laptop, tai nghe, phụ kiện… và nhiều hơn nữa! ✨";

  if (/cảm ơn|thanks|thank|ok bạn|oke/.test(lower))
    return "Không có gì! 🐰 Nếu cần tư vấn thêm cứ hỏi mình nhé. SmartHub luôn sẵn sàng hỗ trợ bạn! 😊";

  if (/chính sách|bảo hành|đổi trả|giao hàng/.test(lower))
    return "SmartHub có các chính sách sau:\n• 🛡️ Bảo hành 12 tháng chính hãng\n• 🔄 Đổi trả miễn phí trong 30 ngày\n• 🚀 Giao hàng trong 2h nội thành\n• 💳 Trả góp 0% lên đến 24 tháng";

  if (!intent.is_product_query)
    return "Mình là Bunny 🐰, chuyên tư vấn sản phẩm công nghệ tại SmartHub!\nBạn có thể hỏi:\n• \"iPhone 16 Pro Max giá bao nhiêu?\"\n• \"Laptop gaming dưới 20 triệu\"\n• \"So sánh Samsung S25 vs iPhone 16\" 📱💻";

  if (!products.length) {
    const hint = intent.keyword || intent.category || intent.brand;
    return `Không tìm thấy sản phẩm${hint ? ` cho "${hint}"` : ""} 😅\nBạn thử điều chỉnh từ khóa hoặc khoảng giá nhé! Hoặc hỏi mình để gợi ý thêm 🔍`;
  }

  const what = intent.keyword || intent.category || intent.brand;
  const lines = [`Tìm được **${products.length} sản phẩm**${what ? ` cho "${what}"` : ""} ✨`];
  if (intent.price_max) lines.push(`Trong khoảng dưới ${fmt(intent.price_max)} 💰`);
  const best = products[0];
  lines.push(`\n🏆 **${best.ten}** — ${fmt(best.giaSale ?? best.gia)}${best.giamGia ? ` (-${best.giamGia}%)` : ""} ★${best.danhGia}/5`);
  lines.push("Bấm vào sản phẩm để xem chi tiết nhé! 🐰");
  return lines.join("\n");
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body    = await req.json();
    const message: string = body.message?.trim() || "";
    const history: any[]  = Array.isArray(body.history) ? body.history : [];

    if (!message) return NextResponse.json({ success: false, message: "Thiếu nội dung" }, { status: 400 });

    const intent   = extractIntent(message);
    const products = intent.is_product_query ? await fetchProducts(intent) : [];

    const productCtx = products.length
      ? `\nSẢN PHẨM HIỆN CÓ (dùng để tư vấn):\n` + products.map((p, i) =>
          `${i+1}. ${p.ten} (${p.thuongHieu}) | Giá: ${fmt(p.giaSale ?? p.gia)}${p.giamGia ? ` | Giảm: ${p.giamGia}%` : ""} | Đánh giá: ★${p.danhGia}/5`
        ).join("\n")
      : intent.is_product_query ? "\n[Không có sản phẩm phù hợp trong kho]" : "";

    const system = buildSystemPrompt(productCtx);

    // Thử lần lượt: Claude → Groq → OpenRouter → template
    const aiReply = await callClaude(system, message, history)
                 ?? await callGroq(system, message, history)
                 ?? await callOpenRouter(system, message, history);

    const reply = aiReply || buildReply(message, intent, products);

    return NextResponse.json({ success: true, reply, products });
  } catch (err: any) {
    console.error("[/api/chat]", err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
