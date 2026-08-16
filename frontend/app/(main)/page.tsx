"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Star, ArrowRight,
  ShieldCheck, Truck, RefreshCw, Headphones,
  Heart, Zap, Clock,
} from "lucide-react";
import { useFavorites, type FavoriteProduct } from "../components/favoritesContext";
import { specChips } from "../lib/specChips";
import { ARTICLES } from "./tin-tuc/data";
import HeroBanner from "../components/HeroBanner";
import Rabbit3D from "../components/Rabbit3D";
import { isLoggedIn } from "../lib/authPrompt";

// ─── API CONFIG ───────────────────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface ProductFeatured {
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
  luotDanhGia: number;
  badge: string;
  specification?: { label: string; value: string }[];
}

// Dữ liệu thật từ collection flash_sale (GET /api/flash-sales/active)
interface FlashSaleActiveItem {
  _id: string;
  name: string;
  sale_price: number;
  quantity: number;
  remaining_quantity: number;
  start_time: string;
  end_time: string;
  variant: { _id: string; color: string; price: number; sku: string; stock_quantity: number } | null;
  product: {
    product_id: number;
    product_name: string;
    thumbnail: string;
    slug: string;
    specification?: { label: string; value: string }[];
  } | null;
}

interface ProductBestSelling {
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
  luotBan: string;
  rank: number;
}

// ─── STATIC DATA (banner, categories, bài viết không cần API) ────────────────

const youtubeReviews = [
  {
    videoId: "YNZW6L13IYs",
    title: "Samsung Galaxy S26 Ultra Review: Siêu phẩm Android đỉnh nhất 2026!",
    channel: "MobileTechReview",
    channelAvatar: "https://yt3.googleusercontent.com/zQ_Xo3V4VSqpUR3h8rqxOs2hKnMH9wiO55Bwp8IVg3rHzFE0zKbclHtBU3e8RcNsKvM_J34z=s200-c-k-c0x00ffffff-no-rj",
    duration: "13:42",
    product: {
      ten: "Samsung Galaxy S26 Ultra 5G",
      gia: 29000000,
      giaSale: 26000000,
      slug: "samsung-galaxy-s26-ultra-5g-205",
      thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/s/a/samsung-galaxy-s26-ultra-1.jpg",
    },
  },
  {
    videoId: "V0krlJi-d_A",
    title: "Apple iPhone 17 Pro Review: Chip A19 Pro, Camera 48MP – Đáng nâng cấp?",
    channel: "MobileTechReview",
    channelAvatar: "https://yt3.googleusercontent.com/zQ_Xo3V4VSqpUR3h8rqxOs2hKnMH9wiO55Bwp8IVg3rHzFE0zKbclHtBU3e8RcNsKvM_J34z=s200-c-k-c0x00ffffff-no-rj",
    duration: "16:08",
    product: {
      ten: "iPhone 17 Pro 1TB",
      gia: 25000000,
      giaSale: 22000000,
      slug: "iphone-17-pro-1tb-206",
      thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone_17_pro_512gb_1.jpg",
    },
  },
  {
    videoId: "EOYJGSTxtd4",
    title: "Review MacBook Air M3: Đáng mua không? Hay nên mua M2?",
    channel: "Duy Luân Dễ Thương",
    channelAvatar: "https://yt3.googleusercontent.com/T6oTPNuvvjhcN3NejfeZJONHr-S_Mh0hxkPcHSZm-dRUPXji_pM8ynorKISuaq0u_jzyg2oJzao=s200-c-k-c0x00ffffff-no-rj",
    duration: "18:24",
    product: {
      ten: "MacBook Air M3",
      gia: 28990000,
      giaSale: 27990000,
      slug: "macbook-air-m3",
      thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/a/macbook-air-m3-13-inch-2024_1__5.png",
    },
  },
  {
    videoId: "tuAhB8Hsu30",
    title: "Sony WH-1000XM5 – 'Ông kẹ' trong làng tai nghe chống ồn hiện nay!",
    channel: "CellphoneS Official",
    channelAvatar: "https://yt3.googleusercontent.com/rK8cTvkOXk2t-f1xlBTsyx4VtHjrKWdBPKHaMTUdxTuQBY3oZ8Gok-H2NZPwp3aJAYO_cRLO=s200-c-k-c0x00ffffff-no-rj",
    duration: "11:53",
    product: {
      ten: "Sony WH-1000XM5",
      gia: 8990000,
      giaSale: 8490000,
      slug: "sony-wh-1000xm5",
      thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/o/sony-wh-1000xm6-11.jpg",
    },
  },
];

const banners = [
  {
    id: 1,
    tag: "Ra mắt độc quyền",
    title: "iPhone 17\nPro Max",
    subtitle: "Titanium Deep Blue. Camera 200MP kép đỉnh.",
    specs: ["Chip A19 Bionic", "Camera 200MP", "Titanium Deep Blue"],
    cta: "Đặt trước ngay",
    badge: "Từ 34.990.000đ",
    productImg: "/banners/iphone-17-pro.png",
    productBg: "transparent" as const,
    device: "phone",
    accent: "#60a5fa",
    bg: "linear-gradient(140deg, #f0f6ff 0%, #e6f0ff 50%, #f8faff 100%)",
    href: "/sanpham?tu-khoa=iPhone%2017%20Pro%20Max",
  },
  {
    id: 2,
    tag: "Galaxy AI Flagship",
    title: "Samsung S25\nUltra",
    subtitle: "Galaxy AI mạnh nhất. S Pen thông minh.",
    specs: ["Galaxy AI", "S Pen Pro", "Camera 200MP", "Snapdragon 8 Elite"],
    cta: "Mua ngay",
    badge: "Tiết kiệm 3.000.000đ",
    productImg: "/banners/samsung-s25-ultra.png",
    productBg: "transparent" as const,
    device: "phone",
    accent: "#7c3aed",
    bg: "linear-gradient(140deg, #f5f0ff 0%, #ede8ff 50%, #faf8ff 100%)",
    href: "/sanpham?tu-khoa=Samsung%20S25%20Ultra",
  },
  {
    id: 3,
    tag: "Apple Silicon M4",
    title: "MacBook Air\nM4 2025",
    subtitle: "Mỏng nhẹ nhất. Pin 18h. Siêu nhanh.",
    specs: ["Chip M4", "16GB RAM", "Liquid Retina 13.6\"", "18h pin"],
    cta: "Khám phá ngay",
    badge: "Tặng AppleCare+ 3 tháng",
    productImg: "/banners/macbook-air-m4.png",
    productBg: "transparent" as const,
    device: "laptop",
    accent: "#059669",
    bg: "linear-gradient(140deg, #f0fff8 0%, #e6fff4 50%, #f5fffb 100%)",
    href: "/sanpham?tu-khoa=MacBook%20Air%20M4",
  },
];

interface Category {
  category_id: number;
  category_name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  image_url?: string;
  product_thumbnail?: string;
  status: string;
  created_at: string;
}



const CAT_EMOJI: Record<string, string> = {
  "dien-thoai": "📱", "laptop": "💻", "may-tinh-bang": "📟",
  "chuot": "🖱️", "ban-phim": "⌨️", "tai-nghe": "🎧",
  "loa": "🔊", "sac-cap": "🔌", "sac-va-cap": "🔌",
  "tivi": "📺", "dong-ho": "⌚", "dong-ho-thong-minh": "⌚",
  "may-anh": "📷", "phu-kien": "🎒",
};

// Fallback Unsplash — dùng khi DB không có ảnh
const CAT_UNSPLASH: Record<string, string> = {
  "dien-thoai":         "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&q=80&fit=crop",
  "laptop":             "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&q=80&fit=crop",
  "may-tinh-bang":      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&h=200&q=80&fit=crop",
  "chuot":              "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&q=80&fit=crop",
  "ban-phim":           "https://images.unsplash.com/photo-1595225476474-4e8bbe5fb1e2?w=200&h=200&q=80&fit=crop",
  "tai-nghe":           "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&q=80&fit=crop",
  "loa":                "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=200&h=200&q=80&fit=crop",
  "sac-cap":            "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&h=200&q=80&fit=crop",
  "sac-va-cap":         "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&h=200&q=80&fit=crop",
  "tivi":               "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=200&h=200&q=80&fit=crop",
  "dong-ho":            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&q=80&fit=crop",
  "dong-ho-thong-minh": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=200&h=200&q=80&fit=crop",
  "may-anh":            "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=200&h=200&q=80&fit=crop",
  "phu-kien":           "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&h=200&q=80&fit=crop",
};

const tienIch = [
  { icon: ShieldCheck, title: "Hàng chính hãng 100%", sub: "Bảo hành toàn quốc" },
  { icon: Truck,       title: "Giao hàng trong 2h",   sub: "Nội thành miễn phí" },
  { icon: RefreshCw,   title: "Đổi trả 30 ngày",      sub: "Miễn phí, không điều kiện" },
  { icon: Headphones,  title: "Hỗ trợ 24/7",           sub: "Tư vấn chuyên sâu" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);


// ─── PRODUCT CAROUSEL ────────────────────────────────────────────────────────
function ProductCarousel({ children, cardWidth = 210 }: { children: React.ReactNode; cardWidth?: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "right" ? cardWidth * 2 : -(cardWidth * 2), behavior: "smooth" });
  return (
    <div className="relative group">
      <button
        onClick={() => scroll("left")}
        aria-label="Trước"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-200 hover:shadow-xl transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {children}
      </div>

      <button
        onClick={() => scroll("right")}
        aria-label="Tiếp"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-200 hover:shadow-xl transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─── SKELETON CARD ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-sm overflow-hidden animate-pulse">
      <div className="bg-gray-200 h-48 w-full" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded w-1/3 mt-2" />
      </div>
    </div>
  );
}

// ─── PRODUCT CARD (Nổi bật) ───────────────────────────────────────────────────
function ProductCard({ p }: { p: ProductFeatured }) {
  const displayPrice = p.giaSale ?? p.gia;
  const chips = specChips(p.specification);
  const { isFavorite, toggleItem } = useFavorites();
  const liked = isFavorite(p.id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fav: FavoriteProduct = {
      id: p.id, ten: p.ten, slug: p.slug, thumbnail: p.thumbnail,
      gia: p.gia, giaSale: p.giaSale, giamGia: p.giamGia,
      danhGia: p.danhGia, thuongHieu: p.thuongHieu, categoryName: "",
    };
    toggleItem(fav);
  };

  return (
    <Link href={`/sanpham/${p.slug}`} className="block h-full">
      <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer">

        {/* ── Ảnh + badges ── */}
        <div className="relative bg-white px-5 pt-9 pb-4">
          {/* Giảm % — top-left pill */}
          {p.giamGia > 0 && (
            <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[11px] font-bold px-2.5 py-[3px] rounded-full">
              Giảm {p.giamGia}%
            </span>
          )}
          {/* Trả góp ribbon — dán mép phải */}
          <div
            className="absolute top-3 right-0 z-10 bg-blue-50 text-blue-600 text-[10px] font-bold py-[3px] pl-4 pr-3 leading-none"
            style={{ clipPath: "polygon(14px 0%,100% 0%,100% 100%,14px 100%,0% 50%)" }}
          >
            Trả góp 0%
          </div>

          <img
            src={p.thumbnail || "https://placehold.co/300x300?text=No+Image"}
            alt={p.ten}
            className="w-full aspect-square object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* ── Thông tin ── */}
        <div className="px-4 pt-3 pb-4 flex flex-col flex-1 gap-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 min-h-[2.6rem]">
            {p.ten}
          </h3>

          {/* Chip thông số nổi bật */}
          <div className="flex flex-wrap gap-1 min-h-[20px]">
            {chips.map((c) => (
              <span key={c} className="bg-gray-100 text-gray-600 text-[10.5px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap">
                {c}
              </span>
            ))}
          </div>

          <div>
            <p className="text-red-500 font-bold text-[15px]">{fmt(displayPrice)}</p>
            {p.giamGia > 0 && (
              <p className="text-gray-400 text-xs line-through mt-0.5">{fmt(p.gia)}</p>
            )}
          </div>

          {/* Bottom row: giao hàng + yêu thích */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
            <span className="inline-flex items-center gap-1.5 bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
              <Truck className="w-3 h-3 flex-shrink-0" />
              Giao 2 Giờ
            </span>
            <button
              onClick={handleToggleFavorite}
              title="Yêu thích"
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                liked
                  ? "border-red-400 text-red-500 bg-red-50"
                  : "border-blue-200 text-blue-300 hover:border-red-300 hover:text-red-400"
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-red-500" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── PRODUCT CARD (Bán chạy) ──────────────────────────────────────────────────
function BestSellingCard({ p }: { p: ProductBestSelling }) {
  const displayPrice = p.giaSale ?? p.gia;
  const { isFavorite, toggleItem } = useFavorites();
  const liked = isFavorite(p.id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fav: FavoriteProduct = {
      id: p.id, ten: p.ten, slug: p.slug, thumbnail: p.thumbnail,
      gia: p.gia, giaSale: p.giaSale, giamGia: p.giamGia,
      danhGia: p.danhGia, thuongHieu: p.thuongHieu, categoryName: "",
    };
    toggleItem(fav);
  };

  return (
    <Link href={`/sanpham/${p.slug}`}>
      <div className="group bg-white border border-gray-100 rounded-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col relative cursor-pointer h-full">
        <div className="flex items-center justify-center rounded-t-2xl aspect-[4/3] bg-white p-3 overflow-hidden">
          <img
            src={p.thumbnail || "https://placehold.co/400x300?text=No+Image"}
            alt={p.ten}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        {p.giamGia > 0 && (
          <span className="absolute top-3 right-12 z-10 bg-red-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
            -{p.giamGia}%
          </span>
        )}
        <button
          onClick={handleToggleFavorite}
          title="Yêu thích"
          className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur transition-colors ${
            liked ? "bg-red-500 text-white" : "bg-white/90 text-gray-400 hover:text-red-500"
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-white" : ""}`} />
        </button>
        <div className="p-4 flex flex-col flex-1 gap-3">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{p.ten}</h3>
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.moTa}</p>
          </div>
          <div className="mt-auto">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-bold text-gray-900">{fmt(displayPrice)}</p>
                {p.giamGia > 0 && (
                  <p className="text-xs text-gray-400 line-through">{fmt(p.gia)}</p>
                )}
              </div>
              {p.danhGia > 0 && (
                <div className="flex items-center gap-1 bg-amber-50 rounded-full px-2 py-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-700">{p.danhGia.toFixed(1)}</span>
                </div>
              )}
            </div>
            {/* Số lượng đã bán — bằng chứng "bán chạy" */}
            <div className="mt-2 pt-2 border-t border-gray-50">
              <span className="text-xs font-semibold text-orange-600">Đã bán {p.luotBan}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── FLASH SALE SKELETON CARD ─────────────────────────────────────────────────
function FlashSaleSkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[190px] bg-white rounded-xl overflow-hidden animate-pulse border border-gray-100">
      <div className="h-[150px] bg-gray-100 mx-3 mt-3 rounded-lg" />
      <div className="p-3 space-y-2 mt-1">
        <div className="h-3 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-2/5" />
        <div className="h-1.5 bg-gray-100 rounded-full" />
        <div className="h-7 bg-red-100 rounded-full" />
      </div>
    </div>
  );
}

// ─── FLASH SALE PRODUCT CARD ──────────────────────────────────────────────────
// Nhận thẳng bản ghi flash_sale thật (từ /api/flash-sales/active hoặc /upcoming).
// locked=true: đợt chưa tới giờ mở — cho xem giá/sản phẩm trước nhưng khoá nút mua.
function FlashSaleProductCard({ f, locked = false }: { f: FlashSaleActiveItem; locked?: boolean }) {
  const product = f.product;
  const variant = f.variant;
  if (!product) return null;

  const originalPrice = variant?.price ?? f.sale_price;
  const discountPct   = originalPrice > f.sale_price
    ? Math.round((1 - f.sale_price / originalPrice) * 100)
    : 0;
  const chips = specChips(product.specification);

  const soldSlots  = f.quantity - f.remaining_quantity;
  const totalSlots = f.quantity;
  const soldOut    = f.remaining_quantity <= 0;
  const soldPct    = totalSlots > 0 ? Math.max((soldSlots / totalSlots) * 100, soldSlots > 0 ? 4 : 0) : 0;

  const startLabel = (() => {
    const d = new Date(f.start_time);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  // id số dùng cho giỏ hàng/yêu thích khớp với product_id ở các nơi khác trong app
  const id = product.product_id;

  const { isFavorite, toggleItem } = useFavorites();
  const liked = isFavorite(id);
  const router = useRouter();

  // "Mua ngay" bỏ qua giỏ hàng, đi thẳng tới trang thanh toán — khớp hành vi
  // nút "Mua ngay" ở trang chi tiết sản phẩm (sanpham/[slug]).
  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (locked || soldOut) return;
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    const item = {
      _id: `buynow_${id}`,
      productId: String(id),
      tenSanPham: product.product_name,
      hinhAnh: product.thumbnail,
      gia: f.sale_price,
      soLuong: 1,
      variant: variant?.color || "",
    };
    sessionStorage.setItem("smarthub_buynow_item", JSON.stringify(item));
    localStorage.removeItem("smarthub_checkout_ids");
    router.push("/thanhtoan");
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fav: FavoriteProduct = {
      id, ten: product.product_name, slug: product.slug, thumbnail: product.thumbnail,
      gia: originalPrice, giaSale: f.sale_price, giamGia: discountPct,
      danhGia: 0, thuongHieu: "", categoryName: "",
    };
    toggleItem(fav);
  };

  return (
    <Link href={`/sanpham/${product.slug}`} className="block flex-shrink-0 w-[195px]">
      <div className={`bg-white rounded-xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col h-full ${(soldOut || locked) ? "opacity-70" : ""}`}>

        {/* Spec chips */}
        <div className="flex gap-1 px-3 pt-3 min-h-[24px] flex-wrap">
          {chips.slice(0, 2).map((c) => (
            <span key={c} className="bg-gray-100 text-gray-500 text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap">
              {c}
            </span>
          ))}
        </div>

        {/* Image */}
        <div className="relative h-[148px] flex items-center justify-center px-3 py-2">
          {discountPct > 0 && (
            <span className="absolute top-2 left-4 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              -{discountPct}%
            </span>
          )}
          {locked ? (
            <span className="absolute top-2 right-4 z-10 bg-gray-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              Sắp mở
            </span>
          ) : soldOut && (
            <span className="absolute top-2 right-4 z-10 bg-gray-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              Hết hàng
            </span>
          )}
          <img
            src={product.thumbnail || "https://placehold.co/300x300?text=No+Image"}
            alt={product.product_name}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="px-3 pb-3 flex flex-col gap-2 flex-1">
          {/* Price row */}
          <div>
            <p className="text-red-600 font-bold text-[15px] leading-tight">{fmt(f.sale_price)}</p>
            {discountPct > 0 && (
              <p className="text-gray-400 text-[11px] line-through">{fmt(originalPrice)}</p>
            )}
          </div>

          {/* Name */}
          <p className="text-[12px] font-semibold text-gray-800 line-clamp-2 leading-snug flex-1">
            {product.product_name}{variant?.color ? ` - ${variant.color}` : ""}
          </p>

          {/* Progress bar (đợt đang chạy) hoặc giờ mở bán (đợt sắp tới) */}
          {locked ? (
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-gray-50 rounded-md px-2 py-1.5">
              <Clock size={11} className="shrink-0" />
              Mở bán lúc {startLabel}
            </div>
          ) : (
            <div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${soldPct}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">Đã bán {soldSlots}/{totalSlots} suất</p>
            </div>
          )}

          {/* Bottom: Mua ngay + yêu thích */}
          <div className="flex items-center gap-2 mt-auto">
            <button
              onClick={handleBuyNow}
              disabled={locked || soldOut}
              className="flex-1 py-1.5 rounded-full border border-red-500 text-red-600 text-[12px] font-bold hover:bg-red-500 hover:text-white transition-colors disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-red-600"
            >
              {locked ? "Sắp mở bán" : soldOut ? "Hết hàng" : "Mua ngay"}
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                liked ? "border-red-400 bg-red-50 text-red-500" : "border-gray-200 text-gray-300 hover:border-red-300 hover:text-red-400"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? "fill-red-500" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors">
          Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

// ─── YOUTUBE VIDEO CARD ───────────────────────────────────────────────────────
function YoutubeVideoCard({ v }: { v: (typeof youtubeReviews)[number] }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      {/* Video embed area */}
      <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${v.videoId}?autoplay=1&rel=0`}
            title={v.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <button
            className="absolute inset-0 w-full h-full group"
            onClick={() => setPlaying(true)}
            aria-label={`Xem video: ${v.title}`}
          >
            <img
              src={`https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`}
              alt={v.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=480&q=70&fit=crop";
              }}
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
            {/* YouTube-style play button (rounded rectangle) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="group-hover:scale-110 transition-transform duration-200 ease-out">
                <div
                  className="flex items-center justify-center w-[68px] h-[48px] rounded-[14px]"
                  style={{
                    background: "rgba(255,0,0,0.93)",
                    boxShadow: "0 6px 28px rgba(0,0,0,0.55), 0 0 0 3px rgba(255,255,255,0.18)",
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-white ml-1">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
            {/* Duration */}
            <span className="absolute bottom-2 right-2.5 bg-black/80 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-[3px] rounded-md tracking-wide">
              {v.duration}
            </span>
          </button>
        )}
      </div>

      {/* Channel avatar + title */}
      <div className="flex gap-2.5">
        <img
          src={v.channelAvatar}
          alt={v.channel}
          className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5 shadow-sm object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = "none";
            const parent = el.parentElement;
            if (parent) {
              const d = document.createElement("div");
              d.style.cssText = "width:32px;height:32px;border-radius:50%;background:#cc0000;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px";
              d.innerHTML = `<span style="color:white;font-weight:900;font-size:12px">${v.channel[0]}</span>`;
              parent.insertBefore(d, el.nextSibling);
            }
          }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug">{v.title}</h4>
          <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{v.channel}</p>
        </div>
      </div>

      {/* Linked product */}
      <Link
        href={`/sanpham/${v.product.slug}`}
        className="group/prod flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-red-50 hover:border-red-100 transition-all duration-200"
      >
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow-sm border border-gray-100 flex items-center justify-center">
          <img src={v.product.thumbnail} alt={v.product.ten} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11.5px] font-semibold text-gray-800 line-clamp-2 leading-snug group-hover/prod:text-red-700 transition-colors">
            {v.product.ten}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[13px] font-bold text-red-500">{fmt(v.product.giaSale ?? v.product.gia)}</span>
            {v.product.giaSale && (
              <span className="text-[11px] text-gray-400 line-through">{fmt(v.product.gia)}</span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover/prod:text-red-400 flex-shrink-0 transition-colors" />
      </Link>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [current, setCurrent] = useState(0);
  const [dir,     setDir]     = useState<"next"|"prev">("next");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // API state
  const [featured,    setFeatured]    = useState<ProductFeatured[]>([]);
  const [bestSelling, setBestSelling] = useState<ProductBestSelling[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [loadingFeat, setLoadingFeat] = useState(true);
  const [loadingBest, setLoadingBest] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);
  const [errorFeat,   setErrorFeat]   = useState("");
  const [errorBest,   setErrorBest]   = useState("");
  const [errorCats,   setErrorCats]   = useState("");

  // Flash Sale state
  const [saleProducts,   setSaleProducts]   = useState<FlashSaleActiveItem[]>([]);
  const [upcomingSale,   setUpcomingSale]   = useState<FlashSaleActiveItem[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [selectedDay,    setSelectedDay]    = useState(0); // 0 = hôm nay, 1..3 = các ngày sắp tới
  const [btsProducts,    setBtsProducts]    = useState<ProductFeatured[]>([]);
  const [loadingBts,     setLoadingBts]     = useState(true);
  const [loadingSale,    setLoadingSale]    = useState(true);
  const [saleTimeLeft,  setSaleTimeLeft]  = useState({ h: 0, m: 0, s: 0 });
  const saleScrollRef = useRef<HTMLDivElement>(null);

  // ── Fetch sản phẩm mới ──────────────────────────────────────────────────
  useEffect(() => {
    setLoadingFeat(true);
    fetch(`${BASE_URL}/api/products?sort=newest&limit=10`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setFeatured(json.data);
        else setErrorFeat("Không thể tải sản phẩm mới");
      })
      .catch(() => setErrorFeat("Lỗi kết nối server"))
      .finally(() => setLoadingFeat(false));
  }, []);

  // ── Fetch danh mục từ backend ───────────────────────────────────────────
  useEffect(() => {
    setLoadingCats(true);
    fetch(`${BASE_URL}/api/categories`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setCategories(json.data || []);
        } else {
          setErrorCats("Không thể tải danh mục");
        }
      })
      .catch(() => setErrorCats("Lỗi kết nối server"))
      .finally(() => setLoadingCats(false));
  }, []);

  // ── Fetch sản phẩm bán chạy ─────────────────────────────────────────────
  useEffect(() => {
    setLoadingBest(true);
    fetch(`${BASE_URL}/api/products/best-selling?limit=4`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setBestSelling(json.data);
        else setErrorBest("Không thể tải sản phẩm bán chạy");
      })
      .catch(() => setErrorBest("Lỗi kết nối server"))
      .finally(() => setLoadingBest(false));
  }, []);

  // ── Fetch các đợt Flash Sale đang thật sự diễn ra ────────────────────────
  useEffect(() => {
    setLoadingSale(true);
    fetch(`${BASE_URL}/api/flash-sales/active`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setSaleProducts(json.data); })
      .catch(() => {})
      .finally(() => setLoadingSale(false));
  }, []);

  // ── Fetch các đợt Flash Sale sắp mở (cho tab xem trước 3 ngày tới) ───────
  useEffect(() => {
    setLoadingUpcoming(true);
    fetch(`${BASE_URL}/api/flash-sales/upcoming?days=4`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setUpcomingSale(json.data); })
      .catch(() => {})
      .finally(() => setLoadingUpcoming(false));
  }, []);

  // ── Fetch deal Back To School (hàng giảm giá bán chạy) ──────────────────
  useEffect(() => {
    setLoadingBts(true);
    fetch(`${BASE_URL}/api/products?discount_only=1&sort=sold&limit=10`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setBtsProducts(json.data); })
      .catch(() => {})
      .finally(() => setLoadingBts(false));
  }, []);

  // ── Countdown Flash Sale — đếm tới thời điểm kết thúc gần nhất trong các đợt đang chạy ──
  useEffect(() => {
    const tick = () => {
      if (saleProducts.length === 0) {
        setSaleTimeLeft({ h: 0, m: 0, s: 0 });
        return;
      }
      const now = new Date();
      const nearestEnd = saleProducts
        .map((f) => new Date(f.end_time).getTime())
        .reduce((min, t) => (t < min ? t : min), Infinity);
      const diff = Math.max(0, nearestEnd - now.getTime());
      setSaleTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [saleProducts]);

  const pad = (n: number) => String(n).padStart(2, "0");

  // ── Flash Sale: 4 tab ngày (Hôm nay + 3 ngày tới) — mỗi tab gắn đúng sản phẩm
  // dự kiến mở bán ngày đó, lấy từ /api/flash-sales/active (hôm nay) và /upcoming (các ngày sau) ──
  // Nếu đúng ngày đó chưa có đợt nào lên lịch, vẫn hiện các đợt sắp mở gần nhất
  // (thay vì để trống) để khách luôn thấy có sản phẩm sắp về — chỉ là chưa mua được.
  const flashSaleDays = Array.from({ length: 4 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const exactMatch = i === 0
      ? saleProducts
      : upcomingSale.filter((f) => {
          const s = new Date(f.start_time);
          return s.getFullYear() === d.getFullYear() && s.getMonth() === d.getMonth() && s.getDate() === d.getDate();
        });
    const items = i > 0 && exactMatch.length === 0 ? upcomingSale : exactMatch;
    return {
      dayStr: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      items,
    };
  });
  const activeDayItems    = flashSaleDays[selectedDay]?.items ?? [];
  const activeDayLoading  = selectedDay === 0 ? loadingSale : loadingUpcoming;

  // ── Banner carousel ─────────────────────────────────────────────────────
  const goTo = (idx: number) => {
    const norm = ((idx % banners.length) + banners.length) % banners.length;
    setDir(norm === (current - 1 + banners.length) % banners.length ? "prev" : "next");
    setCurrent(norm);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => { setDir("next"); setCurrent(c => (c + 1) % banners.length); }, 5500);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => { setDir("next"); setCurrent(c => (c + 1) % banners.length); }, 5500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div className="bg-white min-h-screen">

      {/* ── VIDEO BANNER ─────────────────────────────────────────────── */}
      {false && <section className="relative overflow-hidden" style={{ height: "clamp(520px, 60vw, 700px)" }}>
        {/* Gradient backgrounds per slide — crossfade */}
        {banners.map((b, i) => (
          <div
            key={b.id}
            className="absolute inset-0"
            style={{ background: b.bg, opacity: i === current ? 1 : 0, transition: "opacity 0.9s ease", zIndex: 0 }}
          />
        ))}

        {/* Mesh grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        {/* Ambient glow orb — top-left */}
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 1,
            top: "-18%", left: "-8%",
            width: 640, height: 640,
            background: `radial-gradient(circle, ${banners[current].accent}28 0%, transparent 65%)`,
            transition: "background 0.9s ease",
            animation: "accent-glow 6s ease-in-out infinite",
            filter: "blur(48px)",
          }}
        />
        {/* Ambient glow orb — bottom-right */}
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 1,
            bottom: "-28%", right: "12%",
            width: 520, height: 520,
            background: `radial-gradient(circle, ${banners[current].accent}22 0%, transparent 65%)`,
            transition: "background 0.9s ease",
            animation: "accent-glow 8s ease-in-out 2.5s infinite",
            filter: "blur(60px)",
          }}
        />

        {/* Decorative ring behind device */}
        <div
          className="absolute pointer-events-none hidden lg:block"
          style={{
            zIndex: 2,
            right: "calc(22% - 220px)", top: "50%", transform: "translateY(-50%)",
            width: 460, height: 460,
            borderRadius: "50%",
            border: `1.5px solid ${banners[current].accent}35`,
            boxShadow: `0 0 0 36px ${banners[current].accent}0d, 0 0 0 72px ${banners[current].accent}07`,
            transition: "border-color 0.9s ease, box-shadow 0.9s ease",
          }}
        />
        {/* Inner ring */}
        <div
          className="absolute pointer-events-none hidden lg:block"
          style={{
            zIndex: 2,
            right: "calc(22% - 148px)", top: "50%", transform: "translateY(-50%)",
            width: 316, height: 316,
            borderRadius: "50%",
            border: `1px solid ${banners[current].accent}25`,
            transition: "border-color 0.9s ease",
          }}
        />

        {/* Floating accent particles */}
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="absolute pointer-events-none rounded-full"
            style={{
              zIndex: 2,
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${6 + i * 10}%`,
              top: `${18 + (i % 5) * 13}%`,
              background: banners[current].accent,
              opacity: 0,
              transition: "background 0.9s ease",
              animation: `fs-particle ${1.8 + (i % 4) * 0.7}s ease-in-out ${i * 0.35}s infinite`,
            }}
          />
        ))}

        {/* Main split layout */}
        <div className="relative h-full max-w-screen-xl mx-auto px-6 md:px-10 flex items-center" style={{ zIndex: 3 }}>

          {/* LEFT — text content, remounts on slide change for direction-aware animation */}
          <div
            key={`text-${current}`}
            className="flex-1 py-16 pr-6"
            style={{ animation: `${dir === "next" ? "banner-text-next" : "banner-text-prev"} 0.72s cubic-bezier(0.23,1,0.32,1) both` }}
          >
            {/* Tag */}
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px bg-red-500 shrink-0" style={{ width: "2rem", animation: "banner-line-in 0.48s 0.10s ease both" }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-500">{banners[current].tag}</span>
            </div>

            {/* Title */}
            <h1
              className="font-black text-gray-900 leading-[1.0] whitespace-pre-line tracking-tight mb-4"
              style={{ fontSize: "clamp(2.8rem, 5.5vw, 5.2rem)" }}
            >
              {banners[current].title}
            </h1>

            {/* Subtitle */}
            <p className="text-gray-500 mb-7" style={{ fontSize: "clamp(0.9rem, 1.35vw, 1.05rem)", lineHeight: 1.65 }}>
              {banners[current].subtitle}
            </p>

            {/* Spec pills — accent-coloured per slide */}
            <div className="flex flex-wrap gap-2 mb-9">
              {banners[current].specs.map((s) => (
                <span
                  key={s}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-full border"
                  style={{
                    borderColor: `${banners[current].accent}40`,
                    color: banners[current].accent,
                    background: `${banners[current].accent}12`,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>

            {/* CTA row */}
            <div className="flex items-center gap-5 flex-wrap">
              <Link
                href={banners[current].href}
                className="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-full transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-red-600/40 no-underline"
                style={{ boxShadow: "0 8px 28px rgba(220,38,38,0.30)" }}
              >
                {banners[current].cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <div className="border-l border-gray-200 pl-5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Ưu đãi đặc biệt</p>
                <p className="text-sm font-semibold text-gray-700">{banners[current].badge}</p>
              </div>
            </div>
          </div>

          {/* RIGHT — product image, remounts for entry animation + continuous float */}
          <div className="hidden lg:flex items-center justify-center flex-shrink-0" style={{ width: "44%" }}>
            <div
              key={`device-${current}`}
              style={{
                position: "relative",
                animation: `${dir === "next" ? "device-entry-next" : "device-entry-prev"} 0.75s cubic-bezier(0.23,1,0.32,1) both, device-float 5.5s ease-in-out 0.76s infinite`,
              }}
            >
              {/* Accent glow bloom */}
              <div style={{
                position: "absolute", inset: -80,
                background: `radial-gradient(ellipse, ${banners[current].accent}35 0%, transparent 65%)`,
                filter: "blur(48px)", pointerEvents: "none", zIndex: 0,
                animation: "accent-glow 4s ease-in-out infinite",
                transition: "background 0.9s ease",
              }} />
              <img
                src={banners[current].productImg}
                alt={banners[current].title}
                style={{
                  position: "relative", zIndex: 1,
                  maxHeight: 460, maxWidth: 480,
                  width: "auto", height: "auto",
                  objectFit: "contain", display: "block",
                  filter: `drop-shadow(0 32px 64px ${banners[current].accent}60) drop-shadow(0 8px 24px rgba(0,0,0,0.28))`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Prev / Next arrows */}
        <button
          onClick={() => goTo(current - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 transition-all shadow-md hover:shadow-lg hover:scale-110"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => goTo(current + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 transition-all shadow-md hover:shadow-lg hover:scale-110"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-500 ${i === current ? "bg-red-500 h-2" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"}`}
              style={i === current ? { width: "2rem" } : {}}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 z-30 h-0.5 bg-gray-200">
          <div
            key={current}
            className="h-full w-full bg-red-500"
            style={{ transformOrigin: "left center", animation: "banner-progress 5.5s linear forwards" }}
          />
        </div>
      </section>}
      <HeroBanner />

      {/* ── DANH MỤC + TIỆN ÍCH — one unified card ─────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-6 relative z-10">
        <div
          className="bg-white rounded-3xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 16px 48px rgba(15,23,42,0.07), 0 2px 8px rgba(15,23,42,0.04)" }}
        >
          {/* Categories — 1 hàng ngang, ảnh trên tên dưới */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-start justify-evenly overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {loadingCats ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[88px] flex flex-col items-center gap-2">
                    <div className="w-[72px] h-[72px] rounded-2xl bg-gray-100 animate-pulse" />
                    <div className="w-14 h-2.5 rounded bg-gray-100 animate-pulse" />
                  </div>
                ))
              ) : errorCats ? (
                <p className="text-sm text-red-500 px-2 py-4">{errorCats}</p>
              ) : (
                categories
                  .filter((cat) =>
                    cat.slug !== "phu-kien" &&
                    cat.slug !== "sac-cap" &&
                    cat.slug !== "sac-va-cap" &&
                    cat.category_name !== "Phụ kiện" &&
                    !cat.category_name.toLowerCase().includes("sạc")
                  )
                  .map((cat) => {
                    // Ưu tiên: ảnh sản phẩm thật từ DB (CellphoneS CDN) → Unsplash fallback
                    const dbThumb    = cat.product_thumbnail || cat.image_url || "";
                    const unsplashImg = CAT_UNSPLASH[cat.slug] || "";
                    const imgSrc      = dbThumb || unsplashImg;
                    return (
                      <Link
                        key={cat.slug}
                        href={`/sanpham?danh-muc=${cat.slug}`}
                        className="group flex-shrink-0 w-[88px] flex flex-col items-center gap-2"
                      >
                        <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-md">
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={cat.category_name}
                              className="w-full h-full object-contain drop-shadow-sm"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              data-fallback={dbThumb ? unsplashImg : ""}
                              onError={(e) => {
                                const el = e.currentTarget;
                                const next = el.getAttribute("data-fallback") || "";
                                if (next && el.src !== next) {
                                  el.src = next;
                                  el.setAttribute("data-fallback", "");
                                } else {
                                  el.style.display = "none";
                                  const parent = el.parentElement;
                                  if (parent) parent.innerHTML = `<span style="font-size:28px">${CAT_EMOJI[cat.slug] || "🛒"}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: 28 }}>{CAT_EMOJI[cat.slug] || "🛒"}</span>
                          )}
                        </div>
                        <span className="text-[11.5px] font-semibold text-gray-600 group-hover:text-red-500 text-center leading-tight transition-colors line-clamp-2">
                          {cat.category_name}
                        </span>
                      </Link>
                    );
                  })
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          {/* Benefits strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 md:divide-x divide-gray-100 bg-gray-50/50">
            {tienIch.map((t, i) => {
              const c = [
                { color: "#3b82f6", soft: "#eff6ff" },
                { color: "#10b981", soft: "#ecfdf5" },
                { color: "#8b5cf6", soft: "#f5f3ff" },
                { color: "#f97316", soft: "#fff7ed" },
              ][i % 4];
              return (
                <div key={t.title} className="flex items-center gap-3 px-5 py-3.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: c.soft }}
                  >
                    <t.icon className="w-[18px] h-[18px]" style={{ color: c.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 leading-tight">{t.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-tight truncate">{t.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FLASH SALE ────────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-6 relative">

        <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 6px 24px rgba(185,28,28,0.25), 0 2px 6px rgba(0,0,0,0.08)" }}>

          {/* ── Header đỏ — 1 bar duy nhất ── */}
          <div className="fs-bg-animated px-5 py-0 flex items-stretch min-h-[64px]">

            {/* Trái: icon + title */}
            <div className="flex items-center gap-3 pr-5 border-r border-white/20">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15">
                <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              </div>
              <div>
                <p className="text-white font-black uppercase tracking-wide leading-none" style={{ fontSize: "1.25rem" }}>
                  Flash Sale
                </p>
                <p className="text-yellow-300 text-[10px] font-bold tracking-widest uppercase mt-0.5 opacity-90">Giá sốc mỗi ngày</p>
              </div>
            </div>

            {/* Giữa: tabs ngày — flex-1, scroll ẩn */}
            <div
              className="flex items-center gap-2 flex-1 px-4 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {flashSaleDays.map((day, i) => {
                const isSelected = selectedDay === i;
                const isToday = i === 0;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    className="flex-shrink-0 flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all cursor-pointer"
                    style={isSelected
                      ? { background: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.5)" }
                      : { background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.12)" }}
                  >
                    <span className="text-white font-black text-[12px] leading-tight">
                      {isToday ? "Hôm nay" : day.dayStr}
                    </span>
                    <span className={`text-[9px] font-semibold uppercase leading-tight ${isSelected ? "text-yellow-200" : "text-white/50"}`}>
                      {isToday ? "23:59" : "Sắp mở"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Phải: countdown + link */}
            <div className="flex items-center gap-4 pl-5 border-l border-white/20 shrink-0">
              {/* Countdown */}
              <div className="flex items-center gap-1.5">
                {[
                  { v: pad(saleTimeLeft.h), l: "Giờ"  },
                  { v: pad(saleTimeLeft.m), l: "Phút" },
                  { v: pad(saleTimeLeft.s), l: "Giây" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="flex flex-col items-center">
                      <div
                        className="font-mono font-black text-white flex items-center justify-center rounded-lg tabular-nums"
                        style={{
                          fontSize: "1.15rem",
                          width: "2.2rem", height: "2.2rem",
                          background: "rgba(0,0,0,0.45)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 6px rgba(0,0,0,0.3)",
                        }}
                      >
                        {item.v}
                      </div>
                      <span className="text-white/50 text-[8.5px] font-semibold mt-0.5 tracking-wide">{item.l}</span>
                    </div>
                    {i < 2 && <span className="text-white/60 font-black text-base leading-none mb-3">:</span>}
                  </div>
                ))}
              </div>
              {/* CTA */}
              <Link
                href="/sanpham?giam-gia=1"
                className="hidden md:flex items-center gap-1 text-yellow-300 hover:text-yellow-200 text-[12.5px] font-bold whitespace-nowrap transition-colors"
              >
                Xem tất cả
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ── Panel trắng ── */}
          <div className="bg-white relative z-10 rounded-b-2xl">

            {/* Product carousel */}
            <div className="px-5 py-4 relative">
              <button
                onClick={() => saleScrollRef.current?.scrollBy({ left: -420, behavior: "smooth" })}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-500 border border-gray-200 hover:bg-gray-50 transition shadow-md"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={saleScrollRef}
                className="flex gap-3 overflow-x-auto pb-1"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" as React.CSSProperties["msOverflowStyle"] }}
              >
                {activeDayLoading
                  ? Array.from({ length: 6 }).map((_, i) => <FlashSaleSkeletonCard key={i} />)
                  : activeDayItems.length > 0
                    ? activeDayItems.map((pp) => (
                        <FlashSaleProductCard key={pp._id} f={pp} locked={selectedDay !== 0} />
                      ))
                    : (
                      <div className="w-full py-10 text-center">
                        <p className="text-gray-400 text-sm">
                          {selectedDay === 0 ? "Hiện chưa có sản phẩm Flash Sale" : "Chưa có chương trình Flash Sale nào sắp diễn ra"}
                        </p>
                      </div>
                    )
                }
              </div>

              <button
                onClick={() => saleScrollRef.current?.scrollBy({ left: 420, behavior: "smooth" })}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-500 border border-gray-200 hover:bg-gray-50 transition shadow-md"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Footer note */}
            <div className="px-5 pb-4 border-t border-gray-50">
              <p className="text-center text-[10px] text-gray-400 pt-2">
                Chỉ áp dụng thanh toán online · Mỗi tài khoản 1 sản phẩm cùng loại · Không áp dụng cùng ưu đãi khác
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROMO BANNER — Laptop Vivobook ─────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-10">
        <Link href="/sanpham?danh-muc=laptop" className="block group">
          <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
            <img
              src="/banners/promo-vivobook.jpg"
              alt="Laptop Asus Vivobook - Mua 1 được 2, chỉ từ 19.99 triệu"
              className="w-full h-auto block select-none transition-transform duration-500 group-hover:scale-[1.015]"
            />
          </div>
        </Link>
      </section>

      {/* ── SẢN PHẨM MỚI ────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-10">
        <SectionHeader title="Sản phẩm mới" href="/sanpham?sort=newest" />
        {errorFeat ? (
          <p className="text-sm text-red-500 text-center py-8">{errorFeat}</p>
        ) : (
          <ProductCarousel cardWidth={240}>
            {loadingFeat
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[240px]"><SkeletonCard /></div>
                ))
              : featured.map((p) => (
                  <div key={p.id} className="flex-shrink-0 w-[240px]"><ProductCard p={p} /></div>
                ))
            }
          </ProductCarousel>
        )}
      </section>

      {/* ── PROMO BANNER — Laptop tựu trường ────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-10">
        <Link href="/sanpham?tu-khoa=laptop" className="block group rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
          <img
            src="/ads/tgdd-laptop.png"
            alt="Laptop tựu trường - tặng Microsoft Office bản quyền, giảm thêm đến 3 triệu"
            className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-300"
            loading="lazy"
          />
        </Link>
      </section>

      {/* ── BÁN CHẠY NHẤT ───────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-12">
        <SectionHeader title="Bán chạy nhất" href="/sanpham" />
        {errorBest ? (
          <p className="text-sm text-red-500 text-center py-8">{errorBest}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {loadingBest
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : bestSelling.map((p) => <BestSellingCard key={p.id} p={p} />)
            }
          </div>
        )}
      </section>

      {/* ── BANNER QUẢNG CÁO — bộ 3 ─────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/sanpham?tu-khoa=MacBook" className="block group">
            <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow" style={{ aspectRatio: "1036 / 450" }}>
              <img
                src="/banners/promo-macbook.png"
                alt="MacBook Pro với M5, M5 Pro và M5 Max"
                className="w-full h-full object-cover block select-none transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </Link>
          <Link href="/sanpham?tu-khoa=Samsung" className="block group">
            <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow" style={{ aspectRatio: "1036 / 450" }}>
              <img
                src="/banners/promo-unpacked.webp"
                alt="Galaxy Unpacked - Đăng ký sớm nhận voucher 500K"
                className="w-full h-full object-cover block select-none transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </Link>
          <Link href="/sanpham?tu-khoa=OPPO" className="block group sm:col-span-2 lg:col-span-1">
            <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow" style={{ aspectRatio: "1036 / 450" }}>
              <img
                src="/banners/promo-oppo.webp"
                alt="OPPO Reno16F 5G - Bộ quà tặng trị giá 10 triệu"
                className="w-full h-full object-cover block select-none transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </Link>
        </div>
      </section>

      {/* ── BACK TO SCHOOL — DEAL CỰC COOL ──────────────────────────── */}
      {(loadingBts || btsProducts.length > 0) && (
        <section className="max-w-screen-xl mx-auto px-6 mt-12">
          <div className="rounded-3xl p-5 sm:p-6 border border-red-100" style={{ background: "linear-gradient(180deg,#fff5f5 0%,#fee2e2 100%)" }}>
            <h2 className="text-[22px] font-black text-gray-900 mb-4">
              Back To School <span className="text-red-600">- Deal Cực Cool</span>
            </h2>
            <div className="flex items-stretch gap-4">
              {/* Banner dọc bên trái */}
              <Link
                href="/sanpham?giam-gia=1"
                className="hidden lg:block relative w-[210px] shrink-0 rounded-2xl overflow-hidden group/bts"
              >
                <img
                  src="/ads/portrait-iphone17.png"
                  alt="Back To School - Siu hời để lên đời"
                  className="absolute inset-0 w-full h-full object-cover group-hover/bts:scale-[1.03] transition-transform duration-300"
                  loading="lazy"
                />
              </Link>

              {/* Dàn sản phẩm giảm giá */}
              <div className="flex-1 min-w-0">
                <ProductCarousel cardWidth={240}>
                  {loadingBts
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[240px]"><SkeletonCard /></div>
                      ))
                    : btsProducts.map((p) => (
                        <div key={p.id} className="flex-shrink-0 w-[240px]"><ProductCard p={p} /></div>
                      ))
                  }
                </ProductCarousel>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── REVIEW SẢN PHẨM ──────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-[22px] rounded"
              style={{ background: "#FF0000" }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-3.5 fill-white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <h2 className="text-[17px] font-black text-gray-900 uppercase tracking-tight">
              Review Sản Phẩm
            </h2>
          </div>
          <a
            href="https://www.youtube.com/@CellphoneS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-[13px] font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            Xem YouTube <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {youtubeReviews.map((v) => (
            <YoutubeVideoCard key={v.videoId} v={v} />
          ))}
        </div>
      </section>

      {/* ── TIN TỨC ─────────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-12 mb-16">

        {/* Header giống CellphoneS */}
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-[17px] font-extrabold text-gray-900 uppercase tracking-tight">Tin Tức</h2>
          <span className="w-px h-[18px] bg-gray-300" />
          <Link
            href="/tin-tuc"
            className="flex items-center gap-0.5 text-[13px] font-medium text-blue-500 hover:text-blue-600 transition-colors"
          >
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Horizontal card scroll */}
        <div
          className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {ARTICLES.map((art) => (
            <Link
              key={art.id}
              href={`/tin-tuc/${art.id}`}
              className="flex-shrink-0 w-[210px] group"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* Thumbnail */}
              <div className="rounded-xl overflow-hidden mb-2.5 bg-gray-100" style={{ height: 140 }}>
                <img
                  src={art.hinhAnh}
                  alt={art.tieu_de}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=70&fit=crop";
                  }}
                />
              </div>
              {/* Title */}
              <h4 className="text-[12.5px] font-semibold text-gray-800 leading-snug line-clamp-3 group-hover:text-blue-600 transition-colors">
                {art.tieu_de}
              </h4>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
