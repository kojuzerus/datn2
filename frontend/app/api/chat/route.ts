import { NextRequest, NextResponse } from "next/server";

// Vercel giới hạn mặc định 10s cho serverless function (gói Hobby) — model AI
// free đôi khi mất 5-15s để trả lời nên bị ngắt giữa chừng và luôn rơi về
// template. Khai báo rõ thời lượng tối đa cho phép (Hobby cho phép tới 60s).
export const maxDuration = 60;

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Intent extraction ─────────────────────────────────────────────────────────
// Ánh xạ đúng theo category_name THẬT trong DB (đã kiểm tra qua API — shop chỉ
// có: Điện thoại, Laptop, Tai nghe, Bàn phím, Chuột, Loa, Phụ kiện/Sạc & Cáp).
// Trước đây map nhầm "tablet/tivi" sang các category không tồn tại, và gộp
// bàn phím/chuột/loa/tai nghe chung vào "Phụ kiện" khiến tìm "bàn phím" ra lẫn
// cả tai nghe, sạc, ốp lưng... — giờ trỏ thẳng về category_name cụ thể.
const CATEGORY_PATTERNS: [RegExp, string][] = [
  [/điện thoại|smartphone|phone|iphone|android/i,               "Điện thoại"],
  [/laptop|máy tính xách tay|notebook|macbook/i,                "Laptop"],
  [/tai nghe|earphone|airpod|headphone|earbud|buds/i,          "Tai nghe"],
  [/bàn phím|keyboard|phím cơ|mechanical/i,                    "Bàn phím"],
  [/chuột|mouse/i,                                             "Chuột"],
  [/loa|speaker/i,                                             "Loa"],
  [/sạc|cáp|ốp lưng|hub|pin dự phòng|charger|cable/i,          "Phụ kiện"],
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
      // Cách hỏi đời thường khách hay gõ, không theo mẫu câu chuẩn
      "con nào", "cái nào", "máy nào", "mẫu nào", "đáng tiền", "có hàng",
      "còn màu", "còn hàng", "thêm vào giỏ", "ổn không", "ngon không",
      "mạnh không", "tốt không", "đáng mua",
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
  //
  // CHÚ Ý 2 lỗi từng gặp:
  // 1) [\w] trong JS regex chỉ khớp ký tự ASCII — một từ có dấu như "mà" bị cắt
  //    cụt còn "m" (chỉ "m" là \w, "à" thì không) → keyword lệch dữ liệu. Phải
  //    dùng \p{L}\p{N} (Unicode) + cờ "u" để khớp đúng cả tiếng Việt có dấu.
  // 2) Vòng lặp 0-3 từ phía sau quá tham lam, nuốt luôn các từ đệm hội thoại
  //    không thuộc tên sản phẩm (VD: "iphone xem sao" → keyword bị lẫn "xem
  //    sao"), khiến tìm kiếm ra 0 kết quả. Chặn bằng danh sách từ đệm KHÔNG
  //    được nuốt vào keyword.
  // CHÚ Ý: KHÔNG thêm "không"/"được" vào đây — chúng là từ đệm trong nhiều câu
  // ("được không", "cho tôi được") nhưng cũng là từ mô tả thật trong tên/cụm
  // sản phẩm ("tai nghe không dây"). Loại chúng ra sẽ làm gãy case đó.
  const KEYWORD_STOP_WORDS = [
    "giá","dưới","trên","từ","khoảng","với","tốt","rẻ","bền","triệu","tr",
    "xem","sao","mà","nhé","nhỉ","à","đi","vậy","thế","này","đó","luôn",
    "cho","tôi","giúp","dùm","nha","nhá","ơi","thử","nào","ạ","ha",
    "hả","hử","đây","kìa","ừ","ừm","đấy","hen",
  ];
  const stopLookahead = KEYWORD_STOP_WORDS.join("|");
  const m2 = msg.match(
    new RegExp(
      `(?:iphone|samsung|xiaomi|oppo|laptop|macbook|galaxy|redmi|poco|vivobook|zenbook|ideapad|vivo|realme|nokia|sony|lg|dell|hp|lenovo|asus|acer|msi|huawei|jbl|anker|logitech|razer|airpod|tai nghe|earbud|buds|loa|speaker|bàn phím|chuột|sạc|ốp lưng|tablet|ipad|đồng hồ|watch)(?:\\s+(?!(?:${stopLookahead})(?:\\s|$|[?.,!]))[\\p{L}\\p{N}]+){0,3}`,
      "iu"
    )
  );
  const kwMatch = msg.match(/(?:tìm|mua|xem|muốn|cần|gợi ý)\s+(.{2,50}?)(?:\s+(?:giá|dưới|từ|khoảng|với|tốt|rẻ|bền)|[?.!]|$)/i);
  // An toàn 2 lớp: dù regex ở trên đã chặn từ đệm phía trước, vẫn cắt thêm mọi
  // từ đệm còn sót lại ở CUỐI keyword (VD: kwMatch không dùng lookahead trên).
  const stopSet = new Set(KEYWORD_STOP_WORDS);
  const stripTrailingFillers = (raw: string): string => {
    const words = raw.trim().split(/\s+/);
    while (words.length > 1 && stopSet.has(words[words.length - 1].toLowerCase()))
      words.pop();
    return words.join(" ");
  };
  if (m2) {
    intent.keyword = stripTrailingFillers(m2[0].trim());
  } else if (kwMatch) {
    const raw = kwMatch[1].trim().toLowerCase();
    if (!GENERIC_WORDS.has(raw)) intent.keyword = stripTrailingFillers(kwMatch[1].trim());
  } else if (intent.brand) {
    intent.keyword = intent.brand;
  }

  // "củ" là tiếng lóng phổ biến của "triệu" (VD: "tầm 10 củ", "khoảng 15 củ")
  let m: RegExpMatchArray | null;
  if      ((m = msg.match(/dưới\s*(\d+(?:[,.]\d+)?)\s*(?:triệu|tr|củ|k|nghìn)/i)))
    intent.price_max = parseFloat(m[1].replace(",",".")) * (/k|nghìn/i.test(m[0]) ? 1_000 : 1_000_000);
  else if ((m = msg.match(/trên\s*(\d+(?:[,.]\d+)?)\s*(?:triệu|tr|củ)/i)))
    intent.price_min = parseFloat(m[1].replace(",",".")) * 1_000_000;
  else if ((m = msg.match(/(?:từ\s*)?(\d+(?:[,.]\d+)?)\s*[-–đến]+\s*(\d+(?:[,.]\d+)?)\s*(?:triệu|tr|củ)/i))) {
    intent.price_min = parseFloat(m[1].replace(",",".")) * 1_000_000;
    intent.price_max = parseFloat(m[2].replace(",",".")) * 1_000_000;
  } else if ((m = msg.match(/(?:khoảng|tầm)\s*(\d+(?:[,.]\d+)?)\s*(?:triệu|tr|củ)/i))) {
    const v = parseFloat(m[1].replace(",",".")) * 1_000_000;
    intent.price_min = v * 0.8; intent.price_max = v * 1.25;
  } else if ((m = msg.match(/(\d+(?:[,.]\d+)?)\s*(?:triệu|tr|củ)\b/i))) {
    // Số tiền đứng một mình, không có "dưới/trên/khoảng" phía trước (VD:
    // "điện thoại 10 triệu chơi game") — hiểu là ngân sách tầm đó, co giãn nhẹ.
    const v = parseFloat(m[1].replace(",",".")) * 1_000_000;
    intent.price_min = v * 0.7; intent.price_max = v * 1.15;
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
  return `Bạn là Bunny 🐰 — nhân viên tư vấn công nghệ trẻ tuổi, am hiểu sản phẩm tại
SmartHub (shop bán Điện thoại, Laptop, Bàn phím, Loa/thiết bị nghe nhạc, và phụ
kiện: Chuột, Tai nghe, Sạc & Cáp). Bạn KHÔNG phải chatbot FAQ — bạn là một
người bạn rành công nghệ đang trò chuyện trực tiếp với khách, không phải đọc
kịch bản.

CÁCH NÓI CHUYỆN (bắt buộc):
- Xưng "mình", gọi khách "bạn". Giọng trẻ trung, thoải mái như nhắn tin với bạn
  bè, không trang trọng, không máy móc kiểu tổng đài
- TUYỆT ĐỐI TRÁNH các câu sáo rỗng: "Xin chào, tôi có thể giúp gì cho bạn?",
  "Vui lòng cung cấp thêm thông tin", "Dựa trên yêu cầu của bạn...", "Sản phẩm
  này là một lựa chọn tốt". Nói chuyện tự nhiên như người thật, không như bot
- Hỏi TỪNG BƯỚC MỘT, không dồn nhiều câu hỏi cùng lúc. Khách nói "muốn mua điện
  thoại" → chỉ hỏi ngân sách trước. Khách trả lời ngân sách → mới hỏi tiếp 1
  yếu tố quan trọng khác (dùng để làm gì, hãng nào...). Không bao giờ liệt kê
  5-6 câu hỏi (RAM? bộ nhớ? camera? pin? màu?) trong 1 tin nhắn
- Hiểu tiếng lóng/nói tắt đời thường: "10 củ" = 10 triệu, "con nào ngon",
  "máy nào mạnh", "cái nào đáng tiền", "con này ổn không", "còn màu đen
  không", "so con này với con kia", "có sale không" — đều là hỏi về sản phẩm,
  xử lý bình thường như câu hỏi chuẩn
- Có thể trò chuyện ngoài lề (chào hỏi, than vãn, hỏi linh tinh) một cách tự
  nhiên, không biến mọi câu nói thành cơ hội quảng cáo. Nếu hợp lý thì mới nhẹ
  nhàng gợi ý sản phẩm, không gượng ép

TƯ VẤN — KHÔNG ÉP MUA:
- Nếu sản phẩm A hợp hơn B cho nhu cầu khách, nói rõ vì sao, được phép chê nhẹ
  sản phẩm không phù hợp thay vì chỉ khen. VD: "Mẫu này không tệ, nhưng với
  nhu cầu chơi game của bạn thì mình nghĩ có lựa chọn khác đáng tiền hơn"
- NHỚ NGỮ CẢNH: một khi khách đã cho ngân sách/mục đích sử dụng trong hội
  thoại, không hỏi lại — dùng luôn thông tin đó cho các gợi ý tiếp theo

KHI TƯ VẤN SẢN PHẨM:
- CHỈ dùng dữ liệu thật trong danh sách bên dưới — không bịa giá, tồn kho,
  thông số, màu sắc, khuyến mãi hay bảo hành. Không có thông tin gì thì nói
  thẳng "mình chưa thấy thông tin này trong dữ liệu shop nên không muốn đoán
  bừa" thay vì tự chế
- QUAN TRỌNG: sản phẩm ở đây CHỈ có biến thể theo MÀU SẮC — không hề có các
  mức dung lượng/GB/phiên bản khác nhau như 128GB/256GB. Nếu khách hỏi "bản
  nào, dung lượng bao nhiêu" → trả lời thật là shop chỉ có 1 cấu hình cho mỗi
  màu (xem giá trong danh sách), rồi hỏi khách thích màu nào — TUYỆT ĐỐI
  KHÔNG được tự bịa ra các mức GB và giá khác nhau
- Nếu không có sản phẩm phù hợp → thành thật, gợi ý hướng tìm khác
- Khách nói "cái này", "cái đó", "con này", "con kia"... → xem lịch sử hội
  thoại, tìm dòng "[Sản phẩm đã hiển thị: ...]" gần nhất để biết chính xác
  đang nói về sản phẩm nào. Không tìm thấy thì hỏi lại khách nói về sản phẩm
  nào. Dòng "[Sản phẩm đã hiển thị: ...]" này CHỈ là ghi chú nội bộ để bạn
  đọc — TUYỆT ĐỐI KHÔNG chép lại đoạn ngoặc vuông đó vào câu trả lời gửi cho
  khách
- Đặt hàng, thanh toán: khách nói "thêm vào giỏ", "cho vào giỏ" → hệ thống tự
  thêm sản phẩm vào giỏ hàng thật cho khách. Khách nói "mua luôn", "mua ngay",
  "chốt đơn", "đặt hàng" → hệ thống đưa thẳng khách sang trang thanh toán để
  chốt đơn (không phải chat suông, là hành động thật). Nếu có ghi chú
  "[Hệ thống: ...]" ở cuối, làm đúng theo hướng dẫn đó (hỏi màu nếu có nhiều
  màu, báo hết hàng nếu hết, hoặc hỏi rõ sản phẩm nào nếu chưa xác định được)
  — không tự ý bịa ra là "đã thêm vào giỏ"/"đã đưa sang thanh toán" khi có ghi
  chú yêu cầu hỏi lại. Không nói khách chờ "nhân viên hỗ trợ" chung chung
- Đổi trả, khiếu nại một đơn hàng cụ thể đã mua → hướng đến nhân viên hỗ trợ

ĐỊNH DẠNG TRẢ LỜI (bắt buộc — khung chat rất nhỏ, không hiển thị markdown):
- Chỉ dùng văn bản thuần, xuống dòng thường và emoji để nhấn mạnh (được dùng
  emoji tự nhiên như 😄 😆 🐰 phù hợp giọng trẻ trung, không lạm dụng)
- TUYỆT ĐỐI KHÔNG dùng: bảng biểu (|), tiêu đề (#, ##), chữ đậm (**), gạch đầu dòng markdown (-, *) ở đầu dòng
- Nếu cần liệt kê, dùng số thứ tự "1.", "2."... hoặc emoji, viết liền mạch từng dòng
- Ngắn gọn, đi thẳng vào trọng tâm — như 1 tin nhắn thật, không phải bài văn.
  Hỏi 1 câu thì trả lời ngắn (1-3 câu), không kéo dài lan man
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
    const lines = [`SmartHub đang có ${products.length} mẫu ${intent.category}${priceNote} 📱\nDưới đây là một số gợi ý nổi bật:\n`];
    products.slice(0, 3).forEach((p, i) => {
      const price = fmt(p.giaSale ?? p.gia);
      const disc = p.giamGia ? ` (giảm ${p.giamGia}%)` : "";
      lines.push(`${i + 1}. ${p.ten} — ${price}${disc} ★${p.danhGia}/5`);
    });
    lines.push("\nBạn ưu tiên tiêu chí gì: camera, hiệu năng hay pin? Mình tư vấn thêm nhé! 🐰");
    return lines.join("\n");
  }

  // Không có keyword/category/brand nào tách được (VD: câu chỉ có từ đệm/hành
  // động chung chung như "thêm vào giỏ cho tôi" mà không kèm tên sản phẩm) →
  // hỏi lại rõ ràng, KHÔNG hiển thị "null" hay giá trị rỗng cho khách.
  const hint = intent.keyword || intent.category || intent.brand;
  if (!hint) {
    return "Bạn đang muốn nói về sản phẩm nào vậy? Nhắn tên sản phẩm giúp mình với, mình tìm ngay! 🐰";
  }

  if (!products.length) {
    return `Hmm, mình chưa tìm thấy "${hint}" trong kho SmartHub 😅\nBạn thử nhập tên model đầy đủ hơn, hoặc cho mình biết bạn cần loại sản phẩm gì — mình gợi ý ngay! 🐰`;
  }

  const lines = [`Tìm được ${products.length} sản phẩm cho "${hint}" ✨`];
  if (intent.price_max) lines.push(`Trong khoảng dưới ${fmt(intent.price_max)} 💰`);
  const best = products[0];
  lines.push(`\n🏆 ${best.ten} — ${fmt(best.giaSale ?? best.gia)}${best.giamGia ? ` (-${best.giamGia}%)` : ""} ★${best.danhGia}/5`);
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
// Từ đệm/lấp đầy tiếng Việt thường đi kèm câu gõ tắt ("ip 14 đi", "iphone 14
// nhé") — không mang ý nghĩa để đối chiếu tên sản phẩm, phải loại bỏ trước khi
// so khớp, nếu không một từ đệm duy nhất cũng khiến toàn bộ phép so khớp
// "mọi từ phải khớp" thất bại oan.
const FILLER_WORDS = new Set([
  "di", "nhe", "nha", "a", "ne", "luon", "do", "nay", "vay", "thoi",
  "oi", "ban", "minh", "cho", "toi", "voi", "duoc", "khong",
]);

// Tách riêng để dùng chung cho cả resolveKeywordFromHistory lẫn resolveAction
// (hành động thêm giỏ/mua ngay cũng cần biết danh sách sản phẩm vừa hiển thị).
function getLastShownNames(history: any[]): string[] {
  for (let i = history.length - 1; i >= 0; i--) {
    const content: string = history[i]?.content || "";
    const m = content.match(/\[Sản phẩm đã hiển thị: ([^\]]+)\]/);
    if (m) return [...m[1].matchAll(/([^,]+?)\s*\([^)]*\)/g)].map((x) => x[1].trim());
  }
  return [];
}

function resolveKeywordFromHistory(message: string, history: any[]): string | null {
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

  const shownNames = getLastShownNames(history);
  if (!shownNames.length) return null;

  const msgTokens = norm(message).split(/\s+/).filter((t) => t && !FILLER_WORDS.has(t));
  if (!msgTokens.length) return null;

  for (const name of shownNames) {
    const nameNorm = norm(name);
    if (msgTokens.every((tok) => nameNorm.includes(tok))) return name;
  }
  return null;
}

// ── Hành động: tự thêm giỏ hàng / mua ngay ────────────────────────────────────
// Khác với is_product_query (chỉ để tra dữ liệu cho AI), cụm này kích hoạt một
// HÀNH ĐỘNG THẬT trên giỏ hàng khách — nên tách biệt và xét cẩn thận hơn: chỉ
// nhận diện khi câu nói rõ ràng là ý định giao dịch, tránh việc AI/hệ thống tự
// ý thêm hàng khi khách chỉ đang hỏi han bình thường.
function extractActionIntent(msg: string): "add_to_cart" | "buy_now" | null {
  const lower = msg.toLowerCase().trim();
  if (/mua (luôn|ngay)|đặt (hàng|mua)( ngay| luôn)?|chốt đơn|chốt luôn|xuống tiền|lấy (con|cái|mẫu) này( luôn)?/.test(lower))
    return "buy_now";
  if (
    /thêm (vào |)giỏ( hàng)?|cho vào giỏ|bỏ vào giỏ/.test(lower) ||
    // Câu ra lệnh ngắn không kèm chữ "giỏ" nhưng rõ ràng đang tiếp nối một thao
    // tác vừa nói tới (VD: "thêm đi", "lấy giúp mình", "thêm cái này luôn") —
    // bắt buộc có động từ hành động NGAY ĐẦU câu để tránh dính câu bình thường
    // khác chứa "thêm" ở giữa (VD: "thêm sản phẩm khác đi").
    /^(thêm|lấy|cho)(\s+(nó|cái này|con này|cái đó|con đó))?\s+(đi|dùm|giúp|nhé|luôn)$/.test(lower)
  )
    return "add_to_cart";
  return null;
}

// Vị trí sản phẩm khách chỉ định bằng thứ tự thay vì tên (VD: "sản phẩm đầu
// tiên", "cái thứ 2", "con cuối cùng") — trả về index 0-based hoặc null.
function resolveOrdinalIndex(msg: string): number | null {
  const lower = msg.toLowerCase();
  if (/\b(cuối cùng|cuối|sau cùng)\b/.test(lower)) return -1; // -1 = phần tử cuối, xử lý riêng ở nơi gọi
  const ORDINALS: [RegExp, number][] = [
    [/\b(đầu tiên|đầu|số 1|thứ nhất|thứ 1)\b/, 0],
    [/\b(thứ hai|thứ 2|số 2)\b/, 1],
    [/\b(thứ ba|thứ 3|số 3)\b/, 2],
    [/\b(thứ tư|thứ 4|số 4)\b/, 3],
    [/\b(thứ năm|thứ 5|số 5)\b/, 4],
  ];
  for (const [re, idx] of ORDINALS) if (re.test(lower)) return idx;
  return null;
}

// Lượt trước Bunny vừa hỏi khách chọn màu nào (do resolveAction/resolvePending-
// ColorAction sinh ra câu hỏi cố định) — nếu tin nhắn hiện tại CHỈ là tên 1 màu
// trong danh sách đó, hiểu ngầm là khách đang trả lời câu hỏi đó, không cần
// khách gõ lại "thêm vào giỏ" hay tên sản phẩm từ đầu.
function resolvePendingColorChoice(
  message: string,
  history: any[]
): { productName: string; color: string; type: "add_to_cart" | "buy_now" } | null {
  const lastAssistant = [...history].reverse().find((h: any) => h.role === "assistant");
  if (!lastAssistant) return null;
  const m = String(lastAssistant.content || "").match(
    /"([^"]+)"\s+hiện có mấy màu:\s*([^.]+)\.\s*Bạn thích màu nào để mình (chốt đơn|thêm vào giỏ) nhé/i
  );
  if (!m) return null;

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").trim();
  const productName = m[1].trim();
  const colors = m[2].split(",").map((c) => c.trim()).filter(Boolean);
  const msgNorm = norm(message);
  const matched = colors.find((c) => norm(c) === msgNorm || msgNorm.includes(norm(c)));
  if (!matched) return null;

  return { productName, color: matched, type: m[3].toLowerCase() === "chốt đơn" ? "buy_now" : "add_to_cart" };
}

interface ActionResult {
  action: { type: "add_to_cart" | "buy_now"; product: any } | null;
  note: string; // ghi chú riêng cho AI (system prompt), không hiển thị cho khách
  resolvedProduct: any | null; // để gộp vào danh sách products hiển thị (nếu có)
  fallbackReply: string; // dùng khi AI (Claude/Groq/OpenRouter) đều lỗi — không được rơi về buildReply() vì hàm đó không biết gì về action
}

// Tra đúng 1 sản phẩm theo tên đã biết chính xác (từ lịch sử hiển thị) — dùng
// riêng cho resolveAction, khác fetchProducts() vốn để tìm/gợi ý danh sách.
async function fetchExactProduct(name: string): Promise<any | null> {
  const p = new URLSearchParams({ limit: "5", search: buildSearchRegex(name) });
  try {
    const res = await fetch(`${BACKEND}/api/products?${p}`, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const d = await res.json();
    const arr: any[] = d.data || [];
    return arr.find((p2: any) => p2.ten.toLowerCase() === name.toLowerCase()) || (arr.length === 1 ? arr[0] : null);
  } catch {
    return null;
  }
}

async function resolveAction(
  actionType: "add_to_cart" | "buy_now",
  message: string,
  history: any[],
  currentProducts: any[]
): Promise<ActionResult> {
  const verb = actionType === "buy_now" ? "mua" : "thêm giỏ";
  const shownNames = getLastShownNames(history);

  // 1. Đang chỉ có đúng 1 sản phẩm trong danh sách vừa tìm được → chắc chắn là nó
  let target: any =
    currentProducts.length === 1
      ? currentProducts[0]
      : currentProducts.find((p: any) => message.toLowerCase().includes(p.ten.toLowerCase())) || null;

  // 2. Khách chỉ định bằng THỨ TỰ ("sản phẩm đầu tiên", "cái thứ 2", "con cuối
  //    cùng") thay vì gõ lại tên — ưu tiên khớp với danh sách vừa tìm ở lượt
  //    này, không có thì lấy theo thứ tự trong danh sách vừa hiển thị gần nhất.
  if (!target) {
    const idx = resolveOrdinalIndex(message);
    if (idx != null) {
      const realIdx = idx === -1 ? currentProducts.length - 1 : idx;
      const realIdxShown = idx === -1 ? shownNames.length - 1 : idx;
      if (currentProducts[realIdx]) target = currentProducts[realIdx];
      else if (shownNames[realIdxShown]) target = await fetchExactProduct(shownNames[realIdxShown]);
    }
  }

  // 3. Không rõ từ danh sách hiện tại → thử tên sản phẩm đã hiển thị gần nhất
  //    khớp với TỪ KHÓA cụ thể trong câu (VD: "15 plus", "cái i14").
  if (!target) {
    const resolvedName = resolveKeywordFromHistory(message, history);
    if (resolvedName) target = await fetchExactProduct(resolvedName);
  }

  // 4. Câu chỉ là hành động thuần túy, không nhắc tên sản phẩm nào (VD: "thêm
  //    vào giỏ cho tôi", "lấy con này luôn") → nếu lượt trước CHỈ hiển thị đúng
  //    1 sản phẩm, hiểu ngầm là đang nói về nó, không cần khách lặp lại tên.
  if (!target && shownNames.length === 1) {
    target = await fetchExactProduct(shownNames[0]);
  }

  if (!target) {
    const options = shownNames.length > 1 ? ` (${shownNames.slice(0, 4).join(", ")})` : "";
    return {
      action: null,
      note: `\n[Hệ thống: khách muốn ${verb} nhưng CHƯA RÕ đang nói về sản phẩm nào — hỏi lại khách muốn chọn sản phẩm nào, không tự bịa ra là đã thêm vào giỏ.]`,
      resolvedProduct: null,
      fallbackReply: `Bạn muốn ${verb === "mua" ? "mua" : "thêm vào giỏ"} sản phẩm nào vậy${options}? Nhắn rõ tên giúp mình với nhé! 🐰`,
    };
  }

  const stockVariants = Array.isArray(target.variants)
    ? target.variants.filter((v: any) => (v.stock_quantity ?? 0) > 0)
    : [];

  // Sản phẩm có variants nhưng không màu nào còn hàng
  if (Array.isArray(target.variants) && target.variants.length > 0 && stockVariants.length === 0) {
    return {
      action: null,
      note: `\n[Hệ thống: "${target.ten}" hiện đã HẾT HÀNG ở mọi màu — báo thật cho khách, không thêm vào giỏ, có thể gợi ý sản phẩm tương tự khác.]`,
      resolvedProduct: target,
      fallbackReply: `"${target.ten}" hiện tạm hết hàng ở tất cả các màu rồi bạn ơi 😢 Bạn muốn mình gợi ý sản phẩm tương tự khác không?`,
    };
  }

  // Nhiều màu còn hàng → phải hỏi khách chọn màu trước khi thêm, không đoán bừa
  if (stockVariants.length > 1) {
    const colors = stockVariants.map((v: any) => v.color).filter(Boolean).join(", ");
    return {
      action: null,
      note: `\n[Hệ thống: khách muốn ${verb} "${target.ten}" nhưng sản phẩm có nhiều màu còn hàng (${colors}) — PHẢI hỏi khách chọn màu nào trước, KHÔNG được tự thêm vào giỏ.]`,
      resolvedProduct: target,
      fallbackReply: `"${target.ten}" hiện có mấy màu: ${colors}. Bạn thích màu nào để mình ${verb === "mua" ? "chốt đơn" : "thêm vào giỏ"} nhé? 🎨`,
    };
  }

  const variant = stockVariants[0]; // 0 hoặc 1 phần tử — sản phẩm không phân biến thể vẫn ok (undefined)
  return {
    action: {
      type: actionType,
      product: {
        id: target.id,
        ten: target.ten,
        slug: target.slug,
        thumbnail: target.thumbnail,
        gia: variant ? (variant.sale_price ?? variant.price) : (target.giaSale ?? target.gia),
        variant: variant?.color || null,
      },
    },
    note: "",
    resolvedProduct: target,
    fallbackReply: "",
  };
}

// Hoàn tất hành động đang treo chờ khách chọn màu (từ resolvePendingColorChoice)
// — khác resolveAction ở chỗ đã BIẾT chắc sản phẩm + màu, chỉ cần tra lại giá/
// tồn kho mới nhất trước khi xác nhận, không cần hỏi lại gì thêm.
async function resolvePendingColorAction(pc: {
  productName: string;
  color: string;
  type: "add_to_cart" | "buy_now";
}): Promise<ActionResult> {
  const target = await fetchExactProduct(pc.productName);
  if (!target) {
    return {
      action: null,
      note: "",
      resolvedProduct: null,
      fallbackReply: `Mình không tìm lại được "${pc.productName}" nữa, bạn nhắn lại tên sản phẩm giúp mình nhé! 🐰`,
    };
  }

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").trim();
  const variant = (Array.isArray(target.variants) ? target.variants : []).find(
    (v: any) => norm(v.color || "") === norm(pc.color) && (v.stock_quantity ?? 0) > 0
  );
  if (!variant) {
    return {
      action: null,
      note: `\n[Hệ thống: màu "${pc.color}" của "${target.ten}" hiện không còn hàng — báo thật, để khách chọn màu khác.]`,
      resolvedProduct: target,
      fallbackReply: `Màu "${pc.color}" của "${target.ten}" hiện không còn hàng rồi bạn ơi 😢 Bạn chọn màu khác giúp mình nhé!`,
    };
  }

  return {
    action: {
      type: pc.type,
      product: {
        id: target.id,
        ten: target.ten,
        slug: target.slug,
        thumbnail: target.thumbnail,
        gia: variant.sale_price ?? variant.price,
        variant: variant.color,
      },
    },
    note: "",
    resolvedProduct: target,
    fallbackReply: "",
  };
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

    // QUAN TRỌNG: shop chỉ phân biệt biến thể theo MÀU SẮC (color) — không có
    // khái niệm dung lượng/GB. Trước đây chỉ gửi 1 giá gộp/sản phẩm cho AI, nên
    // khi khách hỏi "bản nào, dung lượng nào" AI không có dữ liệu thật để dựa
    // vào và tự bịa ra các mức GB + giá không tồn tại. Giờ liệt kê rõ từng biến
    // thể màu + giá + tồn kho thật để AI luôn có dữ liệu cụ thể để trả lời.
    const productCtx = products.length
      ? `\nSẢN PHẨM HIỆN CÓ (dùng để tư vấn — đây là TOÀN BỘ dữ liệu thật, sản
phẩm chỉ có biến thể theo MÀU SẮC, KHÔNG có các mức dung lượng/GB khác nhau):\n` +
        products.map((p, i) => {
          const variantLines = Array.isArray(p.variants) && p.variants.length
            ? p.variants.map((v: any) =>
                `   - Màu ${v.color || "?"}: ${fmt(v.sale_price ?? v.price)}${v.sale_price && v.sale_price !== v.price ? ` (giá gốc ${fmt(v.price)})` : ""} | ${v.stock_quantity > 0 ? `còn ${v.stock_quantity}` : "hết hàng"}`
              ).join("\n")
            : `   - Giá: ${fmt(p.giaSale ?? p.gia)}`;
          return `${i + 1}. ${p.ten} (${p.thuongHieu}) | Đánh giá: ★${p.danhGia}/5\n${variantLines}`;
        }).join("\n")
      : intent.is_product_query ? "\n[Không có sản phẩm phù hợp trong kho]" : "";

    // ── Hành động thêm giỏ / mua ngay ─────────────────────────────────────────
    // Xét SAU khi đã có `products` (ưu tiên khớp trong danh sách vừa tìm) —
    // resolveAction có thể tự fetch thêm nếu cần tên sản phẩm đã hiển thị trước đó.
    const actionTypeFromMsg = extractActionIntent(message);
    // Câu hiện tại không tự nêu ý định giao dịch, nhưng lượt trước Bunny vừa
    // hỏi khách chọn màu nào — nếu khách chỉ trả lời đúng 1 tên màu, hiểu ngầm
    // là đang tiếp tục thao tác đó (không cần gõ lại "thêm vào giỏ"/"mua").
    const pendingColor = !actionTypeFromMsg ? resolvePendingColorChoice(message, history) : null;

    let action: { type: "add_to_cart" | "buy_now"; product: any } | null = null;
    let actionNote = "";
    let actionFallbackReply = "";
    if (actionTypeFromMsg || pendingColor) {
      const result = actionTypeFromMsg
        ? await resolveAction(actionTypeFromMsg, message, history, products)
        : await resolvePendingColorAction(pendingColor!);
      action = result.action;
      actionNote = result.note;
      actionFallbackReply = result.fallbackReply;
      // Gộp sản phẩm vừa resolve vào danh sách hiển thị (nếu chưa có) để card
      // sản phẩm hiện luôn trong khung chat cho khách thấy đang thao tác món nào.
      if (result.resolvedProduct && !products.some((p: any) => p.id === result.resolvedProduct.id)) {
        products = [result.resolvedProduct, ...products].slice(0, 8);
      }
    }

    const system = buildSystemPrompt(productCtx + actionNote);

    // Thử lần lượt: Claude → Groq → OpenRouter → template
    const aiReplyRaw = await callClaude(system, message, history)
                     ?? await callGroq(system, message, history)
                     ?? await callOpenRouter(system, message, history);
    // An toàn 2 lớp: dù đã dặn trong system prompt, model đôi khi vẫn chép
    // nguyên văn ghi chú nội bộ "[Sản phẩm đã hiển thị: ...]" vào câu trả lời
    // — cắt bỏ trước khi hiển thị cho khách.
    const aiReplyStripped = aiReplyRaw
      ? aiReplyRaw.replace(/\[Sản phẩm đã hiển thị:[^\]]*\]/g, "").trim()
      : aiReplyRaw;
    const aiReplyDeduped = aiReplyStripped ? dedupeRepeatedReply(aiReplyStripped) : null;
    const aiReply = aiReplyDeduped ? extractCleanReply(aiReplyDeduped) : null;

    let reply = aiReply || buildReply(message, intent, products);

    // Câu này là hành động (thêm giỏ/mua ngay) mà CHƯA resolve chắc chắn được
    // (hỏi màu / hết hàng / chưa rõ sản phẩm) → LUÔN dùng câu hỏi cố định của
    // hệ thống, kể cả khi AI đã trả lời thành công. 2 lý do:
    // 1) AI có thể tự diễn đạt khác đi hoặc lỡ khẳng định "đã thêm vào giỏ"
    //    trong khi thực tế chưa/không thêm (rủi ro giao dịch, phải tuyệt đối
    //    chính xác).
    // 2) Câu hỏi màu cần giữ ĐÚNG NGUYÊN VĂN để resolvePendingColorChoice() có
    //    thể đọc lại ở lượt kế tiếp khi khách chỉ trả lời tên màu — nếu để AI
    //    tự phóng tác câu chữ, lượt sau sẽ không nhận diện lại được.
    if (actionFallbackReply) reply = actionFallbackReply;

    // Hành động ĐÃ chắc chắn resolve được (đúng 1 sản phẩm, đủ hàng, không cần
    // hỏi thêm màu) → tự viết câu xác nhận, KHÔNG dùng lời AI cho phần này để
    // tránh model bịa ra "đã thêm vào giỏ" trong khi thực tế chưa/không thêm.
    if (action) {
      const colorTxt = action.product.variant ? ` (màu ${action.product.variant})` : "";
      reply =
        action.type === "buy_now"
          ? `Được rồi nè! Mình đưa bạn qua trang thanh toán để chốt "${action.product.ten}"${colorTxt} luôn đây 🛒\nNếu chưa đăng nhập thì đăng nhập rồi hoàn tất giúp mình nhé!`
          : `Xong rồi nè! Mình đã thêm "${action.product.ten}"${colorTxt} vào giỏ hàng cho bạn 🛒\nCần gì thêm thì bạn cứ hỏi mình nha!`;
    }

    return NextResponse.json({ success: true, reply, products, action });
  } catch (err: any) {
    console.error("[/api/chat]", err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
