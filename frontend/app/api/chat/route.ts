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

// ── Sửa lỗi chính tả nhẹ trước khi tách intent ────────────────────────────────
// Khách gõ sai/thiếu dấu/viết tách rời tên hãng rất phổ biến (VD: "sam sung",
// "sasung", "iphonr", "xiomi"). Model AI (Claude/Groq) tự hiểu tốt các lỗi này
// khi trò chuyện tự do, nhưng extractIntent() ở trên chạy bằng regex CỐ ĐỊNH
// nên chỉ 1-2 ký tự sai là trượt luôn — sửa trước bằng so khớp gần đúng
// (Levenshtein) trên một từ điển nhỏ (hãng + dòng máy hay gặp) để cả tách
// intent lẫn AI đều nhận đúng ý khách, không cần khách gõ lại.
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Từ điển sửa lỗi — CHỈ gồm từ tiếng Anh/tên riêng viết liền không dấu (hãng,
// dòng máy). Không đưa từ tiếng Việt có dấu vào đây vì bản thân việc bỏ dấu để
// so khớp gần đúng đã đủ rủi ro nhầm lẫn giữa các từ tiếng Việt ngắn.
const TYPO_VOCAB = [
  ...BRANDS,
  "iphone", "samsung", "galaxy", "macbook", "redmi", "poco", "vivobook",
  "zenbook", "ideapad", "airpod", "earbud", "tablet", "watch", "note",
  "pro", "plus", "max", "ultra", "mini",
];

function correctTypos(msg: string): string {
  const tokens = msg.split(/(\s+)/); // giữ nguyên khoảng trắng để ghép lại đúng
  const wordIdx: number[] = [];
  tokens.forEach((t, i) => { if (!/^\s+$/.test(t) && t.length > 0) wordIdx.push(i); });

  // 1) Ghép 2 từ liền kề bị gõ tách rời (VD: "sam" + "sung" → "samsung")
  for (let k = 0; k < wordIdx.length - 1; k++) {
    const i1 = wordIdx[k], i2 = wordIdx[k + 1];
    const w1 = tokens[i1], w2 = tokens[i2];
    if (!/^[a-zA-ZÀ-ỹ]{2,}$/.test(w1) || !/^[a-zA-ZÀ-ỹ]{2,}$/.test(w2)) continue;
    const merged = (w1 + w2).toLowerCase();
    for (const vocab of TYPO_VOCAB) {
      if (vocab.length < 5) continue; // từ ngắn ghép lại dễ trùng ngẫu nhiên
      if (levenshtein(merged, vocab) <= 1) {
        tokens[i1] = vocab;
        tokens[i2] = "";
        // xoá khoảng trắng thừa giữa 2 từ vừa gộp
        if (i1 + 1 < i2 && /^\s+$/.test(tokens[i1 + 1])) tokens[i1 + 1] = "";
        break;
      }
    }
  }

  // 2) Sửa từng từ đơn gõ sai 1-2 ký tự so với từ điển
  for (const i of wordIdx) {
    const raw = tokens[i];
    if (!raw || !/^[a-zA-Z]{4,}$/.test(raw)) continue; // chỉ xét từ thuần chữ cái, đủ dài
    const lower = raw.toLowerCase();
    if (TYPO_VOCAB.includes(lower)) continue; // đã đúng, khỏi sửa
    let best: string | null = null, bestDist = Infinity;
    for (const vocab of TYPO_VOCAB) {
      if (Math.abs(vocab.length - lower.length) > 2) continue;
      const dist = levenshtein(lower, vocab);
      if (dist < bestDist) { bestDist = dist; best = vocab; }
    }
    const threshold = lower.length <= 5 ? 1 : 2;
    if (best && bestDist <= threshold) tokens[i] = best;
  }

  return tokens.join("").replace(/\s{2,}/g, " ");
}

// ── Danh mục trang trên web (để dẫn khách đi đúng trang khi được hỏi) ─────────
// Lấy đúng theo cấu trúc route thật trong app/ (đã kiểm tra qua thư mục dự án)
// — không suy đoán/bịa đường dẫn để tránh dẫn khách vào link 404.
const SITE_PAGES: { keywords: RegExp; label: string; href: string }[] = [
  [/trang chủ|home page|về (?:lại )?trang đầu/i,                              "Trang chủ",                "/"],
  [/(?:tất cả |toàn bộ |danh sách )?sản phẩm|danh mục sản phẩm/i,             "Tất cả sản phẩm",          "/sanpham"],
  [/giỏ hàng/i,                                                               "Giỏ hàng",                 "/giohang"],
  [/thanh toán|checkout|đặt hàng/i,                                          "Thanh toán",                "/thanhtoan"],
  [/tra cứu đơn hàng|kiểm tra đơn hàng|theo dõi đơn hàng/i,                  "Tra cứu đơn hàng",          "/tra-cuu-don-hang"],
  [/đơn hàng (?:của (?:tôi|mình)|đã (?:mua|đặt))|lịch sử (?:mua|đơn) hàng/i, "Đơn hàng của tôi",          "/don-hang"],
  [/tài khoản|thông tin cá nhân|hồ sơ (?:của (?:tôi|mình))?/i,               "Tài khoản của tôi",         "/nguoidung"],
  [/yêu thích|wishlist|đã lưu|đã thích/i,                                    "Sản phẩm yêu thích",        "/yeu-thich"],
  [/so sánh sản phẩm|trang so sánh|danh sách so sánh/i,                      "So sánh sản phẩm",          "/sosanh"],
  [/tin tức|blog|bài viết|khuyến mãi mới/i,                                  "Tin tức",                   "/tintuc"],
  [/giới thiệu|về (?:chúng tôi|smarthub|shop|cửa hàng)(?! ở đâu)/i,          "Giới thiệu",                "/gioi-thieu"],
  [/liên hệ|contact|hotline|số điện thoại (?:shop|cửa hàng|hỗ trợ)/i,       "Liên hệ",                   "/lien-he"],
  [/hệ thống cửa hàng|cửa hàng (?:ở đâu|gần|chi nhánh)|showroom/i,          "Hệ thống cửa hàng",         "/he-thong-cua-hang"],
  [/hướng dẫn mua hàng|cách (?:mua|đặt) hàng/i,                             "Hướng dẫn mua hàng",        "/huong-dan-mua-hang"],
  [/tuyển dụng|việc làm|career/i,                                            "Tuyển dụng",                "/tuyen-dung"],
  [/đối tác/i,                                                               "Đối tác",                   "/doi-tac"],
  [/(?:chính sách )?bảo hành/i,                                              "Chính sách bảo hành",       "/chinh-sach-bao-hanh"],
  [/(?:chính sách )?bảo mật|privacy/i,                                       "Chính sách bảo mật",        "/chinh-sach-bao-mat"],
  [/(?:chính sách )?đổi trả|hoàn tiền|hoàn trả/i,                           "Chính sách đổi trả",        "/chinh-sach-doi-tra"],
  [/(?:chính sách )?vận chuyển|giao hàng/i,                                  "Chính sách vận chuyển",     "/chinh-sach-van-chuyen"],
  [/thương hiệu|brand/i,                                                     "Thương hiệu",               "/thuonghieu"],
  [/đăng nhập|login/i,                                                       "Đăng nhập",                 "/login"],
  [/đăng ký|tạo tài khoản|sign up/i,                                         "Đăng ký",                   "/dangky"],
].map(([keywords, label, href]) => ({ keywords: keywords as RegExp, label: label as string, href: href as string }));

// Chỉ coi là muốn ĐIỀU HƯỚNG (cần nút bấm dẫn đi) khi câu có cụm hỏi đường/vị
// trí rõ ràng — tránh trùng với câu hỏi nội dung bình thường có chứa cùng từ
// khoá (VD: "sản phẩm này bảo hành bao lâu" không phải đang hỏi TRANG bảo hành).
const NAV_TRIGGERS = /trang nào|ở đâu|link (?:trang|của)|vào trang|xem trang|mở trang|chuyển (?:đến|tới|sang)|đi (?:đến|tới|sang)|tìm trang|đường dẫn|dẫn (?:tôi|mình|em) (?:đến|tới|sang)|đưa (?:tôi|mình|em) (?:đến|tới|sang)/i;

function resolveNavPage(msg: string): { label: string; href: string } | null {
  const lower = msg.toLowerCase();
  if (!NAV_TRIGGERS.test(lower)) return null;
  for (const page of SITE_PAGES) if (page.keywords.test(lower)) return { label: page.label, href: page.href };
  return null;
}

// ── So sánh sản phẩm ("so sánh A và B") ───────────────────────────────────────
function extractCompareTerms(msg: string): [string, string] | null {
  const m = msg.match(/so sánh\s+(.+?)\s+(?:và|với|so với|vs\.?)\s+(.+?)(?:[?.!]|$)/i);
  if (!m) return null;
  const a = m[1].trim(), b = m[2].trim();
  if (!a || !b || a.length < 2 || b.length < 2) return null;
  return [a, b];
}

// ── Tin tức / bài viết ─────────────────────────────────────────────────────────
const NEWS_TRIGGERS = /tin tức|bài viết|blog|đọc tin|tin mới|khuyến mãi mới|sự kiện|có gì mới/i;

function extractNewsKeyword(msg: string): string | null {
  // Bắt buộc có từ nối "về/liên quan/nói về" mới coi là có chủ đề cụ thể — nếu
  // không, các câu chung chung như "tin tức mới nhất" sẽ bị nuốt nhầm "mới
  // nhất" làm từ khóa tìm kiếm, khiến search ra 0 kết quả dù thực sự có bài.
  // Không có từ nối → trả null để fetchNews() lấy thẳng bài mới nhất, không lọc.
  const m = msg.match(/(?:tin tức|bài viết|blog)\s+(?:về|liên quan|nói về)\s+(.+?)(?:[?.!]|$)/i);
  const kw = m?.[1]?.trim();
  return kw && kw.length > 1 ? kw : null;
}

interface NewsArticle {
  title: string;
  slug: string;
  thumbnail: string;
  summary: string;
}

async function fetchNews(keyword: string | null): Promise<NewsArticle[]> {
  const p = new URLSearchParams({ limit: "4" });
  if (keyword) p.set("search", keyword);
  try {
    const res = await fetch(`${BACKEND}/api/news?${p}`, { next: { revalidate: 0 } });
    if (!res.ok) { console.error("[chat] fetchNews HTTP", res.status); return []; }
    const data = await res.json();
    return (data.data || []).map((n: any) => ({
      title: n.title, slug: n.slug, thumbnail: n.thumbnail || "", summary: n.summary || "",
    }));
  } catch (e: any) { console.error("[chat] fetchNews threw:", e?.message); return []; }
}

// ── Tạo địa chỉ giao hàng qua chat ───────────────────────────────────────────
// Khách nói "thêm địa chỉ" → hỏi đủ 6 trường theo MẪU CỐ ĐỊNH (giữ nguyên chữ
// để lượt sau nhận diện lại đang ở giữa luồng nhập địa chỉ, giống cơ chế
// resolvePendingColorChoice ở trên) → lượt kế tiếp bóc tách theo nhãn hoặc theo
// thứ tự cố định nếu khách gõ liền một dòng → đủ + hợp lệ thì trả action thật
// để FE tạo địa chỉ (chỉ trình duyệt mới có token khách, giống add-to-cart).
type AddrKey = "receiverName" | "phone" | "province" | "district" | "ward" | "detailAddress";
const ADDR_ORDER: AddrKey[] = ["receiverName", "phone", "province", "district", "ward", "detailAddress"];
const ADDR_LABELS: Record<AddrKey, string> = {
  receiverName: "Tên người nhận", phone: "Số điện thoại", province: "Tỉnh/Thành phố",
  district: "Quận/Huyện", ward: "Phường/Xã", detailAddress: "Địa chỉ cụ thể",
};
const ADDRESS_PROMPT =
  `Được thôi! Bạn gửi giúp mình thông tin theo đúng mẫu này nhé (giữ nguyên từng dòng, thay số liệu tương ứng):\n` +
  ADDR_ORDER.map((k) => `${ADDR_LABELS[k]}: ...`).join("\n");

function extractAddressIntent(msg: string): boolean {
  return /thêm địa chỉ|tạo địa chỉ|địa chỉ (giao hàng )?mới|lưu địa chỉ|thêm (một )?địa chỉ/i.test(msg.toLowerCase());
}

// Lượt trước Bunny vừa hỏi mẫu địa chỉ (nhận diện qua 2 nhãn đầu — luôn giữ
// nguyên văn trong ADDRESS_PROMPT nên so khớp lại được chính xác ở lượt sau).
function isAddressPromptReply(history: any[]): boolean {
  const last = [...history].reverse().find((h: any) => h.role === "assistant");
  const content = String(last?.content || "");
  return content.includes("Tên người nhận:") && content.includes("Số điện thoại:");
}

function parseAddressFields(msg: string): Partial<Record<AddrKey, string>> {
  const fields: Partial<Record<AddrKey, string>> = {};
  const LINE_PATTERNS: [RegExp, AddrKey][] = [
    [/tên\s*(?:người nhận)?\s*:\s*(.+)/i, "receiverName"],
    [/(?:sđt|số điện thoại|đt)\s*:\s*(.+)/i, "phone"],
    [/tỉnh\s*(?:\/\s*thành phố)?\s*:\s*(.+)/i, "province"],
    [/quận\s*(?:\/\s*huyện)?\s*:\s*(.+)/i, "district"],
    [/phường\s*(?:\/\s*xã)?\s*:\s*(.+)/i, "ward"],
    [/địa chỉ\s*(?:cụ thể)?\s*:\s*(.+)/i, "detailAddress"],
  ];
  const lines = msg.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  let labeledCount = 0;
  for (const line of lines) {
    for (const [re, key] of LINE_PATTERNS) {
      const m = line.match(re);
      if (m) { fields[key] = m[1].trim(); labeledCount++; break; }
    }
  }
  if (labeledCount >= 3) return fields;

  // Không gõ theo mẫu có nhãn — thử tách theo dấu phẩy/xuống dòng, gán theo
  // ĐÚNG THỨ TỰ cố định (name, phone, tỉnh, quận, phường, địa chỉ cụ thể).
  const parts = msg.split(/\n|,/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 6) {
    ADDR_ORDER.forEach((key, i) => { if (!fields[key]) fields[key] = parts[i]; });
    if (parts.length > 6) fields.detailAddress = parts.slice(5).join(", ");
  }
  return fields;
}

function isValidVNPhone(phone: string): boolean {
  return /^(0|\+84)\d{9,10}$/.test(phone.replace(/[\s.-]/g, ""));
}

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
    // Cụm hành động giỏ hàng/mua ngay hay đi kèm ngay sau tên sản phẩm (VD:
    // "thêm iphone 16e vào giỏ hàng", "mua samsung s26 ngay") — không chặn thì
    // bị nuốt luôn vào keyword tìm kiếm ("iphone 16e vào giỏ"), khiến search ra
    // 0 kết quả vì "vào"/"giỏ"/"hàng" không nằm trong tên sản phẩm nào.
    "vào","giỏ","hàng","thêm","ngay","chốt","đặt",
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
  // \b sau "củ" không dùng được — "ủ" là ký tự có dấu, ngoài phạm vi \w (chỉ
  // ASCII) nên \b không bao giờ khớp ở đó (cùng lỗi \b đã gặp ở những chỗ
  // khác). Thay bằng lookahead Unicode: không cho theo sau bởi chữ/số khác.
  } else if ((m = msg.match(/(\d+(?:[,.]\d+)?)\s*(?:triệu|tr|củ)(?![\p{L}\p{N}])/iu))) {
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
- Khách có thể gõ sai chính tả, thiếu dấu, viết tắt, gõ tách rời tên hãng
  (VD: "sam sung", "iphonr", "kh mua dc")... TUYỆT ĐỐI KHÔNG chê, sửa lỗi hay
  hỏi lại vì lý do chính tả — luôn cố đoán đúng ý khách muốn nói và trả lời
  thẳng vào ý đó như thể khách gõ đúng hoàn toàn
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
- Tin tức/bài viết: khách hỏi "tin tức mới", "bài viết về...", "có gì mới không"
  → nếu có ghi chú "BÀI VIẾT CÓ THẬT" ở cuối, hệ thống đã tự hiện card bài viết
  kèm ảnh cho khách bấm vào rồi — chỉ cần nhắc ngắn gọn tự nhiên là có bài liên
  quan bên dưới, KHÔNG đọc lại từng tên bài, KHÔNG bịa bài viết không có trong
  ghi chú
- Thêm địa chỉ giao hàng: khách nói "thêm địa chỉ", "tạo địa chỉ mới" → hệ
  thống tự hỏi khách mẫu thông tin cần điền (tên, SĐT, tỉnh, quận, phường, địa
  chỉ cụ thể) và tự lưu thật khi khách điền đủ — bạn chỉ xác nhận ngắn gọn tự
  nhiên theo đúng ghi chú "[Hệ thống: ...]", KHÔNG tự bịa là đã lưu địa chỉ khi
  chưa có ghi chú xác nhận
- So sánh sản phẩm: khách nói "so sánh A và B" → nếu có ghi chú "[Hệ thống: ...
  SO SÁNH ...]" ở cuối, dùng đúng dữ liệu 2 sản phẩm đó để so sánh khách quan
  (giá, đánh giá, tồn kho, và các thông tin THẬT có trong dữ liệu) rồi gợi ý
  chọn con nào theo nhu cầu — không tự bịa thông số kỹ thuật không có trong dữ
  liệu shop
- Điều hướng trang web: SmartHub có đầy đủ các trang — trang chủ, tất cả sản
  phẩm, giỏ hàng, thanh toán, tra cứu đơn hàng, đơn hàng của tôi, tài khoản,
  yêu thích, so sánh sản phẩm, tin tức, giới thiệu, liên hệ, hệ thống cửa
  hàng, hướng dẫn mua hàng, tuyển dụng, đối tác, các trang chính sách (bảo
  hành/bảo mật/đổi trả/vận chuyển), thương hiệu, đăng nhập, đăng ký. Khách hỏi
  đường tới trang nào đó, nếu có ghi chú "[Hệ thống: ... đang hỏi đường tới
  trang ...]" ở cuối thì có nghĩa hệ thống đã tự thêm nút bấm dẫn thẳng tới đó
  — chỉ cần xác nhận ngắn gọn tự nhiên, KHÔNG cần đọc hay gõ đường link ra

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
        // "llama-3.3-70b-versatile" đã bị Groq gỡ bỏ (404 model_not_found) — dùng
        // model hiện hành. Model reasoning này "nghĩ" trước khi trả lời và có thể
        // ngốn hết max_tokens vào phần suy luận ẩn nếu không giới hạn, khiến content
        // trả về rỗng — hạ reasoning_effort xuống thấp nhất và nâng max_tokens.
        model: "openai/gpt-oss-120b",
        reasoning_effort: "low",
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
      console.error("[chat] Groq HTTP", res.status, errBody.slice(0, 500));
      return null;
    }
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
    return "SmartHub có các chính sách sau:\n• 🛡️ Bảo hành 12 tháng chính hãng\n• 🔄 Đổi trả miễn phí trong 30 ngày\n• 🚀 Giao hàng trong 2h nội thành";

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
  if (
    /mua (luôn|ngay)|đặt (hàng|mua)( ngay| luôn)?|chốt đơn|chốt luôn|xuống tiền|lấy (con|cái|mẫu) này( luôn)?/.test(lower) ||
    // "mua"/"ngay"/"luôn" có thể cách nhau bởi tên sản phẩm chen giữa (VD: "mua
    // iphone 16e ngay đi", "mua con samsung s26 này luôn nhé") — 2 pattern cố
    // định trên chỉ khớp khi 2 từ đứng NGAY SÁT nhau nên bỏ sót các câu này.
    // Vẫn đòi hỏi có "ngay"/"luôn" đi kèm để không tự kích hoạt mua ngay chỉ vì
    // câu có chữ "mua" chung chung (VD: "mình muốn mua điện thoại" phải hỏi
    // thêm, không chốt đơn ngay).
    (/\bmua\b/.test(lower) && /\b(ngay|luôn)\b/.test(lower))
  )
    return "buy_now";

  // Khách đang HỎI/XEM giỏ hàng (không phải ý định thêm) → không phải add_to_cart
  if (/xem giỏ|kiểm tra giỏ|giỏ hàng (của )?(tôi|mình) có|trong giỏ (của )?(tôi|mình)|giỏ hàng (ở đâu|thế nào|bao nhiêu)/.test(lower))
    return null;

  if (
    /thêm (vào |)giỏ( hàng)?|cho vào giỏ|bỏ vào giỏ/.test(lower) ||
    // Câu ra lệnh ngắn không kèm chữ "giỏ" nhưng rõ ràng đang tiếp nối một thao
    // tác vừa nói tới (VD: "thêm đi", "lấy giúp mình", "thêm cái này luôn") —
    // bắt buộc có động từ hành động NGAY ĐẦU câu để tránh dính câu bình thường
    // khác chứa "thêm" ở giữa (VD: "thêm sản phẩm khác đi").
    /^(thêm|lấy|cho)(\s+(nó|cái này|con này|cái đó|con đó))?\s+(đi|dùm|giúp|nhé|luôn)$/.test(lower) ||
    // "giỏ (hàng)" xuất hiện CÙNG với 1 động từ thêm/cho/bỏ ở bất kỳ đâu trong
    // câu — khách hay chèn tên sản phẩm ở giữa (VD: "thêm iphone 16e vào giỏ
    // hàng", "cho con samsung s26 vào giỏ giúp mình") khiến pattern đầu tiên
    // (đòi "thêm"/"cho"/"bỏ" đứng NGAY SÁT "giỏ") không khớp.
    (/giỏ(?: hàng)?\b/.test(lower) && /\bthêm\b|\bcho\b|\bbỏ\b/.test(lower))
  )
    return "add_to_cart";
  return null;
}

// Vị trí sản phẩm khách chỉ định bằng thứ tự thay vì tên (VD: "sản phẩm đầu
// tiên", "cái thứ 2", "con cuối cùng") — trả về index 0-based hoặc null.
function resolveOrdinalIndex(msg: string): number | null {
  const lower = msg.toLowerCase();
  // CHÚ Ý: KHÔNG dùng \b quanh cụm có dấu — \b dựa trên định nghĩa \w (chỉ
  // ASCII) nên với từ bắt đầu bằng ký tự có dấu như "đầu" ("đ" không phải \w),
  // ranh giới "khoảng trắng → đ" không được coi là word boundary, khiến \b
  // không bao giờ khớp (cùng gốc lỗi với keyword extraction ở trên). Thay bằng
  // ranh giới tường minh: đầu chuỗi/khoảng trắng ở trước, khoảng trắng/cuối
  // chuỗi/dấu câu ở sau.
  const boundary = (phrase: string) => new RegExp(`(?:^|\\s)(?:${phrase})(?:\\s|$|[?.,!])`);
  if (boundary("cuối cùng|sau cùng|cuối").test(lower)) return -1; // -1 = phần tử cuối, xử lý riêng ở nơi gọi
  const ORDINALS: [RegExp, number][] = [
    [boundary("đầu tiên|cái đầu|con đầu|đầu|số 1|thứ nhất|thứ 1"), 0],
    [boundary("thứ hai|thứ 2|số 2"), 1],
    [boundary("thứ ba|thứ 3|số 3"), 2],
    [boundary("thứ tư|thứ 4|số 4"), 3],
    [boundary("thứ năm|thứ 5|số 5"), 4],
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
    const rawMessage: string = body.message?.trim() || "";
    const history: any[]  = Array.isArray(body.history) ? body.history : [];

    if (!rawMessage) return NextResponse.json({ success: false, message: "Thiếu nội dung" }, { status: 400 });

    // Sửa lỗi chính tả/gõ tách rời nhẹ TRƯỚC khi tách intent lẫn gửi cho AI —
    // dùng bản đã sửa xuyên suốt từ đây (khách gõ sai vẫn được hiểu đúng ý mà
    // không cần gõ lại, và AI cũng nhận được câu đã chuẩn hoá).
    const message = correctTypos(rawMessage);

    const intent = extractIntent(message);

    // ── Tạo địa chỉ giao hàng qua chat — xét TRƯỚC khi tách sản phẩm ──────────
    // Nhãn "Số điện thoại:" trong mẫu địa chỉ vô tình chứa đúng cụm trigger
    // "điện thoại" của category Điện thoại, khiến extractIntent() ở trên hiểu
    // nhầm là khách đang hỏi mua điện thoại và kéo nguyên danh sách iPhone vào
    // — chặn is_product_query NGAY khi phát hiện đây là lượt đang điền địa chỉ.
    const addressIntentNow = extractAddressIntent(message);
    const inAddressFlow = !addressIntentNow && isAddressPromptReply(history);
    const addressFieldsParsed = inAddressFlow ? parseAddressFields(message) : {};
    const isAddressSubmission = inAddressFlow && Object.keys(addressFieldsParsed).length > 0;
    if (addressIntentNow || isAddressSubmission) {
      intent.is_product_query = false;
      intent.category = null;
      intent.keyword = null;
    }

    // Câu hỏi không khớp trigger nào NHƯNG khớp tên sản phẩm vừa hiển thị →
    // vẫn coi là truy vấn sản phẩm, tìm đúng sản phẩm đó thay vì bỏ qua.
    if (!intent.is_product_query && !addressIntentNow && !isAddressSubmission) {
      const resolved = resolveKeywordFromHistory(message, history);
      if (resolved) { intent.is_product_query = true; intent.keyword = resolved; }
    }

    // ── So sánh sản phẩm ("so sánh A và B") ─────────────────────────────────
    const compareTerms = extractCompareTerms(message);
    let compareNote = "";
    let products: any[];
    if (compareTerms) {
      const [termA, termB] = compareTerms;
      intent.is_product_query = true;
      const cmpIntent = (kw: string): Intent => ({
        is_product_query: true, keyword: kw, category: null, brand: null,
        price_min: null, price_max: null, sort: "newest",
      });
      const [prodA, prodB] = await Promise.all([fetchProducts(cmpIntent(termA)), fetchProducts(cmpIntent(termB))]);
      const combined = [prodA[0], prodB[0]].filter(Boolean);
      products = combined;
      compareNote = combined.length === 2
        ? `\n[Hệ thống: khách muốn SO SÁNH "${termA}" và "${termB}" — CHỈ dùng đúng dữ liệu giá/đánh giá/tồn kho của 2 sản phẩm bên dưới để so sánh khách quan, không bịa thông số không có trong dữ liệu, kết luận nên chọn sản phẩm nào tuỳ theo nhu cầu khách (giá rẻ hơn, đánh giá cao hơn...).]`
        : `\n[Hệ thống: khách muốn so sánh "${termA}" và "${termB}" nhưng chưa tìm đủ dữ liệu cả 2 sản phẩm trong kho — nói thật là thiếu dữ liệu 1 trong 2, hỏi lại tên chính xác hơn, không bịa so sánh.]`;
    } else {
      products = intent.is_product_query ? await fetchProducts(intent) : [];

      // Từ khóa gốc không ra kết quả nào — thử lại bằng tên sản phẩm đã hiển thị
      // trước đó (trường hợp trigger có khớp nhưng từ khóa trích ra bị lệch).
      if (intent.is_product_query && products.length === 0) {
        const resolved = resolveKeywordFromHistory(message, history);
        if (resolved && resolved.toLowerCase() !== (intent.keyword || "").toLowerCase()) {
          intent.keyword = resolved;
          products = await fetchProducts(intent);
        }
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

    // ── Điều hướng trang web ────────────────────────────────────────────────
    // Chỉ xét khi không có hành động giỏ hàng/màu đang xử lý ở lượt này, tránh
    // 2 CTA (nút hành động ngầm định + nút điều hướng) chồng lên nhau.
    const navPage = !actionTypeFromMsg && !pendingColor ? resolveNavPage(message) : null;
    const navNote = navPage
      ? `\n[Hệ thống: khách đang hỏi đường tới trang "${navPage.label}" — xác nhận ngắn gọn, tự nhiên rằng có nút bên dưới sẽ đưa họ tới đó luôn, KHÔNG cần đọc hay gõ lại đường link.]`
      : "";
    const cta = navPage ? { label: `Đến ${navPage.label}`, href: navPage.href } : undefined;

    // ── Tin tức / bài viết ─────────────────────────────────────────────────
    const newsWanted = NEWS_TRIGGERS.test(message.toLowerCase());
    const articles = newsWanted ? await fetchNews(extractNewsKeyword(message)) : [];
    const newsNote = newsWanted
      ? articles.length
        ? `\n[Hệ thống: khách hỏi tin tức/bài viết — dưới đây là các bài viết THẬT, đã hiện card kèm ảnh cho khách bấm vào rồi, bạn chỉ cần nhắc ngắn gọn tự nhiên là có mấy bài liên quan bên dưới, KHÔNG cần đọc tên từng bài ra.]\nBÀI VIẾT CÓ THẬT:\n${articles.map((a, i) => `${i + 1}. ${a.title}`).join("\n")}`
        : `\n[Hệ thống: khách hỏi tin tức nhưng chưa tìm thấy bài viết phù hợp — báo thật, không bịa tên bài viết.]`
      : "";

    // ── Tạo địa chỉ giao hàng qua chat ───────────────────────────────────────
    // (addressIntentNow/inAddressFlow/addressFieldsParsed đã tính ở đầu handler
    // để kịp chặn is_product_query trước khi tách sản phẩm — dùng lại ở đây)
    let addressAction: { type: "create_address"; address: Record<AddrKey, string> } | null = null;
    let addressReplyOverride = "";
    if (addressIntentNow) {
      addressReplyOverride = ADDRESS_PROMPT;
    } else if (isAddressSubmission) {
      const fields = addressFieldsParsed;
      const missing = ADDR_ORDER.filter((k) => !fields[k]);
      const phoneOk = fields.phone ? isValidVNPhone(fields.phone) : false;
      if (missing.length === 0 && phoneOk) {
        const cleanPhone = fields.phone!.replace(/[\s.-]/g, "");
        addressAction = {
          type: "create_address",
          address: {
            receiverName: fields.receiverName!, phone: cleanPhone,
            province: fields.province!, district: fields.district!,
            ward: fields.ward!, detailAddress: fields.detailAddress!,
          },
        };
        addressReplyOverride =
          `Mình đã lưu địa chỉ mới cho bạn rồi nè 🏠\n${fields.receiverName} - ${cleanPhone}\n` +
          `${fields.detailAddress}, ${fields.ward}, ${fields.district}, ${fields.province}\n` +
          `Bạn xem lại hoặc chỉnh sửa trong Tài khoản > Sổ địa chỉ nhé!`;
      } else if (!missing.includes("phone") && !phoneOk) {
        addressReplyOverride = `Số điện thoại "${fields.phone}" chưa đúng định dạng, bạn kiểm tra lại giúp mình theo mẫu nhé 😅\n${ADDRESS_PROMPT}`;
      } else {
        addressReplyOverride = `Mình còn thiếu: ${missing.map((k) => ADDR_LABELS[k]).join(", ")}. Bạn gửi lại đầy đủ giúp mình theo mẫu nhé:\n${ADDRESS_PROMPT}`;
      }
    }
    // isAddressSubmission false (fields rỗng): khách gõ câu không liên quan tới
    // địa chỉ giữa chừng luồng này — bỏ qua, để pipeline bình thường xử lý.
    const addressNote = addressIntentNow
      ? `\n[Hệ thống: khách muốn thêm địa chỉ giao hàng — hệ thống đã tự hỏi khách mẫu thông tin cần thiết, bạn chỉ cần xác nhận ngắn gọn tự nhiên, KHÔNG tự bịa ra là đã lưu địa chỉ.]`
      : addressAction
      ? `\n[Hệ thống: đã lưu địa chỉ mới thành công cho khách — xác nhận ngắn gọn tự nhiên.]`
      : "";

    const system = buildSystemPrompt(productCtx + actionNote + compareNote + navNote + newsNote + addressNote);

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

    // Luồng tạo địa chỉ (hỏi mẫu / thiếu trường / đã lưu) — LUÔN dùng câu chữ cố
    // định của hệ thống, cùng lý do với action ở trên: câu hỏi mẫu cần giữ
    // NGUYÊN VĂN để isAddressPromptReply() nhận lại được ở lượt sau, và câu xác
    // nhận đã lưu không được để AI tự bịa khi có thể chưa thực sự lưu thành công.
    if (addressReplyOverride) reply = addressReplyOverride;

    return NextResponse.json({ success: true, reply, products, action, cta, articles, addressAction });
  } catch (err: any) {
    console.error("[/api/chat]", err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
