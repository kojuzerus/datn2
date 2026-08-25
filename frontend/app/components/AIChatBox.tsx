"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Send, Star, ChevronRight, Sparkles, ShoppingCart } from "lucide-react";
import Rabbit3D from "./Rabbit3D";
import { useCart } from "../hooks/useCart";
import { toastSuccess, toastError } from "../utils/toast";
import { isLoggedIn } from "../lib/authPrompt";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  ten: string;
  slug: string;
  thuongHieu: string;
  thumbnail: string;
  moTa: string;
  gia: number;
  giaSale: number | null;
  giamGia: number;
  danhGia: number;
  badge: string;
  categoryName: string;
}

interface Article {
  title: string;
  slug: string;
  thumbnail: string;
  summary: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  articles?: Article[];
  cta?: { label: string; href: string };
}

interface ChatAction {
  type: "add_to_cart" | "buy_now";
  product: {
    id: number;
    ten: string;
    slug: string;
    thumbnail: string;
    gia: number;
    variant: string | null;
  };
}

interface AddressAction {
  type: "create_address";
  address: {
    receiverName: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    detailAddress: string;
  };
}

// Lưu lịch sử chat vào localStorage để "duy trì ngữ cảnh" — khách đóng tab,
// tải lại trang hay quay lại sau vẫn thấy đúng đoạn hội thoại vừa nãy, không
// phải chào lại từ đầu. Chỉ lưu trên máy khách đó (không đồng bộ nhiều thiết
// bị), giống cách giỏ hàng khách vãng lai đã lưu local.
const CHAT_HISTORY_KEY = "smarthub_chat_history";
const MAX_SAVED_MESSAGES = 40;

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

const GREETING: Message = {
  id: "init",
  role: "assistant",
  content:
    "Xin chào! 🐰 Mình là Bunny — trợ lý AI của SmartHub.\nBạn đang tìm sản phẩm gì? Mình sẵn sàng tư vấn điện thoại, laptop, tai nghe, phụ kiện… và nhiều hơn nữa! ✨",
};

const QUICK_CHIPS = [
  "iPhone mới nhất",
  "Laptop dưới 15 triệu",
  "Tai nghe không dây",
  "Samsung Galaxy S",
  "Laptop gaming",
];

// ── Mini product card (dùng trong chat) ─────────────────────────────────────
function ChatProductCard({ p }: { p: Product }) {
  const displayPrice = p.giaSale ?? p.gia;
  const { addToCart, adding } = useCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await addToCart({
      productId: String(p.id),
      tenSanPham: p.ten,
      hinhAnh: p.thumbnail,
      gia: displayPrice,
      soLuong: 1,
    });
    if (ok) toastSuccess(`Đã thêm "${p.ten}" vào giỏ hàng!`);
    else toastError("Không thể thêm vào giỏ hàng, thử lại nhé!");
  };

  return (
    <Link
      href={`/sanpham/${p.slug}`}
      className="relative flex-shrink-0 w-[130px] rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
    >
      {/* Ảnh */}
      <div className="relative bg-gray-50 h-[100px] overflow-hidden">
        {p.badge && (
          <span className="absolute top-1 left-1 z-10 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {p.badge}
          </span>
        )}
        {p.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.thumbnail}
            alt={p.ten}
            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📦</div>
        )}
        {p.giamGia > 0 && (
          <span className="absolute bottom-1 right-1 bg-orange-500 text-white text-[9px] font-bold px-1 py-0.5 rounded">
            -{p.giamGia}%
          </span>
        )}
        {/* Thêm vào giỏ hàng — nổi góc trên phải ảnh, không chiếm thêm chỗ của card hẹp */}
        <button
          onClick={handleAddToCart}
          disabled={adding}
          title="Thêm vào giỏ hàng"
          className="absolute top-1 right-1 z-10 w-6 h-6 rounded-full bg-white/95 shadow-md flex items-center justify-center text-gray-500 hover:text-red-600 hover:scale-110 active:scale-95 transition-all disabled:opacity-60"
        >
          <ShoppingCart size={12} />
        </button>
      </div>

      {/* Info */}
      <div className="p-2 space-y-0.5">
        <p className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-2">{p.ten}</p>
        <p className="text-[10px] text-gray-400">{p.thuongHieu}</p>

        {/* Giá */}
        <div className="pt-0.5">
          <p className="text-[12px] font-bold text-red-600">{fmt(displayPrice)}</p>
          {p.giaSale && p.gia > p.giaSale && (
            <p className="text-[10px] text-gray-400 line-through">{fmt(p.gia)}</p>
          )}
        </div>

        {/* Đánh giá */}
        {p.danhGia > 0 && (
          <div className="flex items-center gap-0.5 pt-0.5">
            <Star size={9} className="fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] text-gray-500">{p.danhGia.toFixed(1)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Mini article card (dùng trong chat) ─────────────────────────────────────
function ChatArticleCard({ a }: { a: Article }) {
  return (
    <Link
      href={`/tintuc/${a.slug}`}
      className="relative flex-shrink-0 w-[150px] rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
    >
      <div className="relative bg-gray-50 h-[85px] overflow-hidden">
        {a.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.thumbnail}
            alt={a.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📰</div>
        )}
      </div>
      <div className="p-2">
        <p className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-3">{a.title}</p>
      </div>
    </Link>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
        <Rabbit3D size={28} />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-1 h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-gray-400 rounded-full inline-block"
              style={{ animation: `chatDot 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AIChatBox() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(false);

  const router = useRouter();
  const { addToCart } = useCart();

  const endRef    = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const bodyRef   = useRef<HTMLDivElement>(null);

  // Khôi phục lịch sử chat đã lưu (nếu có) ngay khi component mount — chỉ chạy
  // phía client (localStorage không tồn tại lúc SSR) nên đặt trong useEffect
  // thay vì initializer của useState để tránh lệch hydration.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }
    } catch {}
  }, []);

  // Lưu lại lịch sử mỗi khi có tin mới — giữ ngữ cảnh hội thoại qua các lần
  // tải lại trang/đóng mở chat, chỉ giữ MAX_SAVED_MESSAGES tin gần nhất.
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-MAX_SAVED_MESSAGES)));
    } catch {}
  }, [messages]);

  // Auto-scroll khi có tin mới
  useEffect(() => {
    if (open) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [messages, open, loading]);

  // Focus input khi mở chat
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setUnread(false);
    }
  }, [open]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Nhét kèm tên + giá sản phẩm đã từng hiển thị vào lịch sử gửi lên backend
      // (không đổi nội dung hiển thị trên UI) — để khi khách nói "mua cái này",
      // "cái đó bao nhiêu tiền"... AI biết đang nói về sản phẩm nào thay vì đoán mò.
      const history = messages.slice(-10).map((m) => {
        if (m.role === "assistant" && m.products && m.products.length) {
          const productList = m.products
            .slice(0, 6)
            .map((p) => `${p.ten} (${fmt(p.giaSale ?? p.gia)})`)
            .join(", ");
          return { role: m.role, content: `${m.content}\n[Sản phẩm đã hiển thị: ${productList}]` };
        }
        return { role: m.role, content: m.content };
      });

      // Gửi kèm danh sách sp đã hiển thị gần nhất để backend hiểu "thêm tất cả
      // vào giỏ", "mua cái đầu tiên"... đang nói tới sản phẩm nào.
      const lastWithProducts = [...messages].reverse().find((m) => m.role === "assistant" && m.products?.length);
      const lastProducts = lastWithProducts?.products || [];

      const res = await fetch(`/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history, lastProducts }),
      });

      const data = await res.json();

      // Backend đã resolve chắc chắn 1 sản phẩm (đủ hàng, không cần hỏi thêm
      // màu) và trả về action → thực thi thêm giỏ hàng thật ngay tại đây (chỉ
      // trình duyệt mới có token/giỏ hàng khách, nên phần thực thi phải ở FE).
      // Backend không biết trạng thái đăng nhập của khách (không gửi token khi
      // gọi /api/chat) — nên việc yêu cầu đăng nhập cho "mua ngay" phải chốt ở
      // đây, TRƯỚC khi hiển thị tin nhắn, để không hiển thị 2 câu mâu thuẫn nhau.
      const action: ChatAction | null = data.action || null;
      const needsLogin = action?.type === "buy_now" && !isLoggedIn();

      // Backend đã trả lời như thể địa chỉ SẼ được lưu thật (action không null),
      // nhưng việc lưu thật chỉ thực thi được ở đây (chỉ trình duyệt mới có
      // token khách) — nếu chưa đăng nhập thì phải chặn TRƯỚC khi hiển thị tin
      // nhắn, không để lộ câu "đã lưu địa chỉ" trong khi thực tế chưa lưu gì.
      const addressAction: AddressAction | null = data.addressAction || null;
      const addressNeedsLogin = !!addressAction && !isLoggedIn();

      // Backend trả lỗi (success: false hoặc không có reply)
      const replyText = needsLogin
        ? `Bạn cần đăng nhập trước để mình chốt đơn "${action!.product.ten}" giúp nhé! 🐰 Bấm vào biểu tượng tài khoản ở góc trên để đăng nhập rồi quay lại đây nha.`
        : addressNeedsLogin
        ? `Bạn cần đăng nhập trước để mình lưu địa chỉ này giúp nhé! 🐰 Bấm vào biểu tượng tài khoản ở góc trên để đăng nhập rồi gửi lại thông tin cho mình nha.`
        : data.reply || (data.message ? `⚠️ ${data.message}` : "Xin lỗi, mình gặp sự cố. Thử lại nhé! 🐰");

      // AI xác định được hành động thêm giỏ hàng thật (không chỉ chat suông)
      // → thực thi ngay bằng logic giỏ hàng có sẵn (hỗ trợ cả khách vãng lai).
      if (data.cartAction?.items?.length) {
        for (const item of data.cartAction.items) {
          await addToCart(item);
        }
        window.dispatchEvent(new Event("cart-updated"));
        toastSuccess(
          data.cartAction.items.length === 1
            ? `Đã thêm "${data.cartAction.items[0].tenSanPham}" vào giỏ hàng!`
            : `Đã thêm ${data.cartAction.items.length} sản phẩm vào giỏ hàng!`
        );
      }

      const assistantMsg: Message = {
        id:       `a-${Date.now()}`,
        role:     "assistant",
        content:  replyText,
        products: data.products || [],
        articles: data.articles || [],
        cta:      data.cta || undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (!open) setUnread(true);

      if (action?.type === "buy_now") {
        // Giống nút "Mua ngay" trên trang sản phẩm: đi thẳng sang thanh toán 1
        // món, không cộng dồn vào giỏ hàng — cần đăng nhập trước.
        if (!needsLogin) {
          sessionStorage.setItem(
            "smarthub_buynow_item",
            JSON.stringify({
              _id: `buynow_${action.product.id}`,
              productId: String(action.product.id),
              tenSanPham: action.product.ten,
              hinhAnh: action.product.thumbnail,
              gia: action.product.gia,
              soLuong: 1,
              variant: action.product.variant || "",
            })
          );
          localStorage.removeItem("smarthub_checkout_ids");
          setTimeout(() => router.push("/thanhtoan"), 400);
        }
      } else if (action?.type === "add_to_cart") {
        const ok = await addToCart({
          productId:  String(action.product.id),
          tenSanPham: action.product.ten,
          hinhAnh:    action.product.thumbnail,
          gia:        action.product.gia,
          soLuong:    1,
          variant:    action.product.variant || undefined,
        });
        if (ok) toastSuccess(`Đã thêm "${action.product.ten}" vào giỏ hàng!`);
        else toastError("Không thêm được vào giỏ hàng, bạn thử bấm vào sản phẩm nhé!");
      }

      // Backend đã xác nhận đủ thông tin hợp lệ để tạo địa chỉ — lưu thật ngay
      // tại đây (chỉ trình duyệt có token khách, backend /api/chat không có).
      if (addressAction?.type === "create_address" && !addressNeedsLogin) {
        try {
          const token = localStorage.getItem("smarthub_token");
          const res = await fetch(`${API_BASE}/api/addresses`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(addressAction.address),
          });
          const json = await res.json();
          if (json.success) toastSuccess("Đã lưu địa chỉ giao hàng mới!");
          else toastError(json.message || "Không lưu được địa chỉ, bạn thử lại nhé!");
        } catch {
          toastError("Không lưu được địa chỉ, bạn thử lại nhé!");
        }
      }
    } catch (err) {
      const isOffline = err instanceof TypeError && (err.message.includes("fetch") || err.message.includes("network"));
      setMessages((prev) => [
        ...prev,
        {
          id:      `err-${Date.now()}`,
          role:    "assistant",
          content: isOffline
            ? "⚠️ Không kết nối được server (localhost:5000). Hãy kiểm tra backend đã chạy chưa nhé! 🐰"
            : `⚠️ Lỗi: ${err instanceof Error ? err.message : "Không xác định"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, open]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showChips = messages.length <= 1;

  return (
    <>
      {/* ── Keyframe styles inject ─────────────────────────────────────────── */}
      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes chatBounceIn {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
        .chat-window { animation: chatSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1); }
        .chat-btn-in { animation: chatBounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1); }
      `}</style>

      {/* ── Cụm nút nổi: Zalo ở dưới, chat AI ở trên ─────────────────────────
           flex-col-reverse: phần tử khai báo TRƯỚC (Zalo) lại nằm DƯỚI CÙNG
           trong cách hiển thị, phần tử sau (chat) xếp lên trên nó. */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-center gap-3">
        {/* Liên hệ Zalo */}
        <a
          href="https://zalo.me/84399006749"
          target="_blank"
          rel="noopener noreferrer"
          title="Liên hệ qua Zalo"
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:shadow-blue-400/40 hover:scale-110 active:scale-95 transition-all duration-200"
          style={{ background: "linear-gradient(140deg,#0068FF 0%,#0052CC 100%)" }}
        >
          {/* Icon Zalo — bong bóng chat bo góc kiểu logo Zalo, chữ "Zalo" màu xanh bên trong */}
          <svg width="30" height="30" viewBox="0 0 48 48" className="drop-shadow-sm">
            <path
              d="M24 4C12.95 4 4 11.85 4 21.5c0 5.62 3.06 10.62 7.82 13.82-0.26 2.02-0.98 4.6-2.62 6.98-0.22 0.32 0.08 0.74 0.46 0.64 3.5-0.94 6.44-2.66 8.34-3.98C20.02 39.32 21.98 39.5 24 39.5c11.05 0 20-7.85 20-17.5S35.05 4 24 4Z"
              fill="#fff"
            />
            <text
              x="24" y="27"
              textAnchor="middle"
              fill="#0068FF"
              fontSize="13.5"
              fontWeight="800"
              fontFamily="Arial, sans-serif"
              letterSpacing="-0.3"
            >
              Zalo
            </text>
          </svg>
        </a>

        {/* Nút chat AI (con thỏ) */}
        <div className="flex flex-col items-center gap-1">
          {/* Tooltip nhỏ — chỉ hiện trên desktop (hover), ẩn hẳn trên mobile:
              di động không có "hover" nên tooltip luôn tự hiện lên (do
              animation banner-fade-up chạy sau 1.2s) rồi đứng yên mãi mãi,
              đè lên nội dung khác khi cuộn trang (VD: đè lên nút "Chia sẻ"
              ở trang chi tiết sản phẩm) — icon con thỏ đã đủ rõ để nhận biết
              là nút chat, không cần thêm nhãn chữ gây rối trên mobile. */}
          {!open && (
            <div className="hidden sm:block bg-gray-800 text-white text-xs px-2.5 py-1 rounded-full whitespace-nowrap shadow-lg mb-1 opacity-0 group-hover:opacity-100 pointer-events-none select-none"
              style={{ animation: "banner-fade-up 0.4s ease both 1.2s" }}>
              Tư vấn AI
            </div>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            title="Tư vấn AI SmartHub"
            className="relative w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-2xl hover:shadow-red-400/40 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center overflow-visible"
          >
            {/* Rabbit con thỏ nhảy */}
            <div className="flex items-center justify-center">
              <Rabbit3D size={46} />
            </div>

            {/* Dấu chấm online */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow" />

            {/* Badge unread */}
            {unread && !open && (
              <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow chat-btn-in border border-white">
                1
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Chat window ────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="chat-window fixed bottom-[10.75rem] right-6 z-50 w-[360px] max-h-[580px] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)" }}
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-red-600 via-red-500 to-rose-500 flex-shrink-0">
            {/* Avatar thỏ */}
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Rabbit3D size={36} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-white font-bold text-sm leading-tight">Bunny</p>
                <Sparkles size={11} className="text-yellow-300" />
              </div>
              <p className="text-red-100 text-[11px] leading-tight">Trợ lý AI SmartHub</p>
            </div>
            {/* Dot online */}
            <div className="flex items-center gap-1 mr-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-200 text-[10px]">Online</span>
            </div>
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X size={14} className="text-white" />
            </button>
          </div>

          {/* ── Messages ────────────────────────────────────────────────────── */}
          <div
            ref={bodyRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 min-h-0"
            style={{ maxHeight: "400px" }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} items-end`}
              >
                {/* Avatar assistant */}
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                    <Rabbit3D size={26} />
                  </div>
                )}

                <div className={`flex flex-col gap-1.5 max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  {/* Bubble */}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-red-500 to-red-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Product cards (horizontal scroll) */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="w-full">
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
                           style={{ scrollbarWidth: "thin" }}>
                        {msg.products.map((p) => (
                          <ChatProductCard key={p.id} p={p} />
                        ))}
                      </div>
                      {/* Xem tất cả */}
                      <Link
                        href={`/sanpham`}
                        className="mt-1.5 flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 font-medium"
                      >
                        <ChevronRight size={12} />
                        Xem tất cả sản phẩm
                      </Link>
                    </div>
                  )}

                  {/* Article cards (horizontal scroll) */}
                  {msg.articles && msg.articles.length > 0 && (
                    <div className="w-full">
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
                           style={{ scrollbarWidth: "thin" }}>
                        {msg.articles.map((a) => (
                          <ChatArticleCard key={a.slug} a={a} />
                        ))}
                      </div>
                      <Link
                        href={`/tintuc`}
                        className="mt-1.5 flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 font-medium"
                      >
                        <ChevronRight size={12} />
                        Xem tất cả bài viết
                      </Link>
                    </div>
                  )}

                  {/* CTA (VD: đến trang thanh toán) khi AI vừa thực hiện thêm giỏ hàng */}
                  {msg.cta && (
                    <Link
                      href={msg.cta.href}
                      className="flex items-center justify-center gap-1 w-full text-center text-xs font-semibold text-white bg-gradient-to-br from-red-500 to-red-600 hover:brightness-105 rounded-full px-3 py-2 shadow-sm transition-all"
                    >
                      {msg.cta.label}
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && <TypingDots />}

            {/* Scroll anchor */}
            <div ref={endRef} />
          </div>

          {/* ── Quick chips ─────────────────────────────────────────────────── */}
          {showChips && !loading && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex gap-1.5 flex-wrap">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* ── Input bar ───────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-gray-100 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Nhập câu hỏi của bạn…"
              disabled={loading}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 placeholder-gray-400 disabled:opacity-50 transition"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-40 flex items-center justify-center shadow-sm transition-all duration-150 active:scale-90"
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
