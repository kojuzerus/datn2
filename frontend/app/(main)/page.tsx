"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Star, ArrowRight,
  ShieldCheck, Truck, RefreshCw, Headphones,
  Smartphone, Heart, Wallet, CreditCard, Flame,
} from "lucide-react";
import { useFavorites, type FavoriteProduct } from "../components/favoritesContext";
import { specChips } from "../lib/specChips";
import { ARTICLES } from "./tin-tuc/data";
import HeroBanner from "../components/HeroBanner";
import Rabbit3D from "../components/Rabbit3D";

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

const eduPromos = [
  {
    title: "Copilot+ PC ưu đãi",
    tag: "Windows 11",
    highlight: "Chỉ từ 15.99 triệu",
    sub: "Trợ giá lên đến 4 triệu",
    img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80&fit=crop",
    titleColor: "#ffffff",
    subColor: "#bfdbfe",
    tagClass: "bg-white/15 text-cyan-300",
    href: "/sanpham?danh-muc=laptop",
  },
  {
    title: "Toàn bộ Laptop",
    tag: "Ưu đãi học sinh - sinh viên",
    highlight: "Giảm thêm 5%",
    sub: "Tối đa đến 1 triệu",
    img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80&fit=crop",
    titleColor: "#ffffff",
    subColor: "#d1d5db",
    tagClass: "bg-white/15 text-amber-300",
    href: "/sanpham?danh-muc=laptop",
  },
  {
    title: "S-Financing",
    tag: "Dành riêng cho S-Student",
    highlight: "Trả góp 0%",
    sub: "Duyệt dễ mua nhanh",
    img: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80&fit=crop",
    titleColor: "#ffffff",
    subColor: "#ccfbf1",
    tagClass: "bg-white/15 text-white",
    href: "/sanpham",
  },
  {
    title: "S-Student & S-Teacher",
    tag: "Say Hi!",
    highlight: "Giảm thêm 10%",
    sub: "Trả góp 0% phụ phí 0đ",
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80&fit=crop",
    titleColor: "#ffffff",
    subColor: "#ffe4e6",
    tagClass: "bg-white/15 text-white",
    href: "/sanpham",
  },
];

const paymentPromos = [
  {
    brand: "Home Credit",
    icon: Wallet,
    title: "Ưu đãi thanh toán Home Credit",
    highlight: "Giảm 400K",
    sub: "Cho đơn hàng từ 10 triệu",
    img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80&fit=crop",
    titleColor: "#ffffff",
    subColor: "#fecaca",
    href: "/sanpham",
  },
  {
    brand: "ZaloPay",
    icon: Smartphone,
    title: "Ưu đãi thanh toán ZaloPay",
    highlight: "Giảm 5%",
    sub: "Tối đa 1 triệu, áp dụng đơn từ 10 triệu",
    img: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80&fit=crop",
    titleColor: "#ffffff",
    subColor: "#dbeafe",
    href: "/sanpham",
  },
  {
    brand: "SPayLater",
    icon: Wallet,
    title: "Ưu đãi thanh toán SPayLater",
    highlight: "Giảm đến 500.000đ",
    sub: "Áp dụng ShopeePay & SPayLater",
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80&fit=crop",
    titleColor: "#ffffff",
    subColor: "#ffedd5",
    href: "/sanpham",
  },
  {
    brand: "Visa / Mastercard",
    icon: CreditCard,
    title: "Ưu đãi thanh toán thẻ",
    highlight: "Giảm 500K - 1 triệu",
    sub: "Cho sản phẩm từ 12 - 30 triệu",
    img: "https://images.unsplash.com/photo-1605792657660-596af9009e82?w=600&q=80&fit=crop",
    titleColor: "#ffffff",
    subColor: "#cbd5e1",
    href: "/sanpham",
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
      <div className="p-3 space-y-1.5">
        <div className="h-3 bg-gray-200 rounded w-2/5" />
        <div className="h-2 bg-gray-100 rounded w-3/4" />
        <div className="h-2 bg-gray-100 rounded w-2/3" />
      </div>
      <div className="h-[145px] mx-3 rounded-lg bg-gray-200" />
      <div className="p-3 space-y-2 mt-1">
        <div className="h-3 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-2/5 mt-1" />
        <div className="h-5 bg-red-100 rounded-full" />
      </div>
    </div>
  );
}

// ─── FLASH SALE PRODUCT CARD — 3D tilt + cursor shine ────────────────────────
function FlashSaleProductCard({ p }: { p: ProductFeatured }) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const displayPrice = p.giaSale ?? p.gia;
  const totalSlots = ((p.id * 13 + 7) % 40) + 10;
  const soldSlots  = Math.floor(totalSlots * (((p.id * 7 + 3) % 60) + 10) / 100);
  const soldPct    = Math.max((soldSlots / totalSlots) * 100, 8);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r  = el.getBoundingClientRect();
    const x  = (e.clientX - r.left) / r.width;
    const y  = (e.clientY - r.top)  / r.height;
    const rx = (y - 0.5) * -18;
    const ry = (x - 0.5) *  18;
    el.style.transform  = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.04,1.04,1.04)`;
    el.style.transition = "transform 0.08s linear";
    el.style.boxShadow  = `${ry * -0.8}px ${rx * 0.8}px 28px rgba(239,68,68,0.22), 0 12px 28px rgba(0,0,0,0.14)`;
    if (shineRef.current) {
      shineRef.current.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.26) 0%, transparent 65%)`;
      shineRef.current.style.opacity    = "1";
    }
  };

  const onLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform  = "perspective(700px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    el.style.transition = "transform 0.55s cubic-bezier(0.23,1,0.32,1), box-shadow 0.55s ease";
    el.style.boxShadow  = "";
    if (shineRef.current) shineRef.current.style.opacity = "0";
  };

  return (
    <Link href={`/sanpham/${p.slug}`} style={{ display: "block", flexShrink: 0 }}>
      <div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="w-[190px] bg-white rounded-xl overflow-visible border border-gray-100 cursor-pointer relative"
        style={{ willChange: "transform", transformStyle: "preserve-3d" }}
      >
        {/* Inner clip so content doesn't overflow the rounded corners */}
        <div className="rounded-xl overflow-hidden">
          {/* Cursor-tracking light reflection */}
          <div
            ref={shineRef}
            className="absolute inset-0 pointer-events-none z-30 rounded-xl opacity-0"
            style={{ transition: "opacity 0.3s ease" }}
          />

          {/* Brand */}
          <div className="px-3 pt-3 pb-0.5">
            <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest truncate">{p.thuongHieu || "Thương hiệu"}</p>
          </div>

          {/* Image + discount badge */}
          <div className="relative h-[140px] mx-3 flex items-center justify-center overflow-hidden bg-white">
            {p.giamGia > 0 && (
              <div className="absolute top-1.5 left-1.5 z-10 bg-gradient-to-br from-red-500 to-rose-700 text-white font-black text-[11px] px-2 py-0.5 rounded-md"
                style={{ boxShadow: "0 2px 8px rgba(239,68,68,0.5)" }}
              >
                -{p.giamGia}%
              </div>
            )}
            <img
              src={p.thumbnail || "https://placehold.co/300x300?text=No+Image"}
              alt={p.ten}
              className="h-full w-full object-contain p-1"
              style={{ transition: "transform 0.4s ease" }}
              loading="lazy"
            />
          </div>

          {/* Name */}
          <div className="px-3 pt-2">
            <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug min-h-[2.5rem]">{p.ten}</h3>
          </div>

          {/* Price */}
          <div className="px-3 pt-1 flex items-baseline gap-2">
            <span className="text-[15px] font-black text-red-600">{fmt(displayPrice)}</span>
            {p.giamGia > 0 && (
              <span className="text-[11px] text-gray-400 line-through">{fmt(p.gia)}</span>
            )}
          </div>

          {/* Progress bar */}
          <div className="px-3 pt-1.5 pb-3">
            <div className="relative h-[22px] rounded-full overflow-hidden" style={{ background: "#f3f4f6", border: "1px solid #e5e7eb" }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${soldPct}%`, background: "#dc2626" }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold z-10" style={{ color: "#111111" }}>
                Đã bán {soldSlots}/{totalSlots} suất
              </span>
            </div>
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
  const [saleProducts,  setSaleProducts]  = useState<ProductFeatured[]>([]);
  const [btsProducts,   setBtsProducts]   = useState<ProductFeatured[]>([]);
  const [loadingBts,    setLoadingBts]    = useState(true);
  const [loadingSale,   setLoadingSale]   = useState(true);
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

  // ── Fetch sản phẩm Flash Sale ────────────────────────────────────────────
  useEffect(() => {
    setLoadingSale(true);
    fetch(`${BASE_URL}/api/products?discount_only=1&limit=10&sort=newest`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setSaleProducts(json.data); })
      .catch(() => {})
      .finally(() => setLoadingSale(false));
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

  // ── Countdown Flash Sale ─────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const diff = Math.max(0, end.getTime() - now.getTime());
      setSaleTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

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
    <div className="bg-gray-50 min-h-screen">

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
      <section className="max-w-screen-xl mx-auto px-6 mt-10 relative z-20">
        <div
          className="relative rounded-2xl overflow-hidden fs-bg-animated"
          style={{ boxShadow: "0 20px 60px rgba(185,28,28,0.38), 0 6px 20px rgba(0,0,0,0.22)" }}
        >
          {/* Ánh sáng quét chéo */}
          <div className="absolute inset-0 pointer-events-none z-0 opacity-12"
            style={{ background: "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.7) 50%, transparent 80%)", animation: "fs-shine-sweep 6s ease-in-out infinite" }} />

          {/* Hạt confetti trắng */}
          {[...Array(14)].map((_, i) => (
            <span key={i} className="absolute rounded-full bg-white pointer-events-none z-0"
              style={{ width: `${1.5 + (i % 3)}px`, height: `${1.5 + (i % 3)}px`,
                left: `${5 + i * 6.5}%`, bottom: "8%", opacity: 0,
                animation: `fs-particle ${1.8 + (i % 4) * 0.6}s ease-in-out ${i * 0.25}s infinite` }} />
          ))}

          {/* ── Header lớn: tiêu đề + linh vật + đếm ngược ── */}
          <div className="relative z-10 flex items-center justify-between gap-4 px-6 sm:px-10 pt-6 pb-5 min-h-[120px]">
            {/* Trái: tiêu đề */}
            <div className="shrink-0">
              <div className="flex items-center gap-3">
                <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300 fill-yellow-300"
                  style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" }} />
                <p className="text-white text-[26px] sm:text-4xl font-black uppercase tracking-[0.18em] leading-none"
                  style={{ textShadow: "0 3px 10px rgba(0,0,0,0.35)" }}>
                  Flash Sale
                </p>
              </div>
              <div className="mt-2.5 ml-12 sm:ml-14 h-1 w-24 rounded-full bg-yellow-300/90" />
              <p className="ml-12 sm:ml-14 mt-1.5 text-white/70 text-[11px] font-semibold">
                Giá sốc mỗi ngày · Số lượng có hạn
              </p>
            </div>

            {/* Giữa: linh vật thỏ SmartHub nhảy tưng tưng + badge deal */}
            <div className="hidden md:flex items-center gap-3 absolute left-1/2 -translate-x-1/2 bottom-0">
              <div style={{ animation: "rabbit-jump 2.4s ease-in-out infinite" }}>
                <Rabbit3D size={82} />
              </div>
              <div className="-rotate-6 bg-yellow-300 text-red-700 font-black text-[15px] leading-tight px-3.5 py-2 rounded-xl shadow-lg mb-8"
                style={{ boxShadow: "0 6px 18px rgba(0,0,0,0.3)" }}>
                DEAL SỐC<br />BAY GIÁ
              </div>
            </div>

            {/* Phải: đếm ngược */}
            <div className="shrink-0 flex items-center gap-3">
              <span className="hidden sm:block text-white/80 text-[11px] font-black uppercase tracking-[0.18em] text-right leading-tight">
                Kết thúc<br />sau
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { val: pad(saleTimeLeft.h), label: "GIỜ" },
                  { val: pad(saleTimeLeft.m), label: "PHÚT" },
                  { val: pad(saleTimeLeft.s), label: "GIÂY" },
                ].map(({ val, label }, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="flex flex-col items-center justify-center rounded-xl w-12 h-14 pt-1"
                      style={{ background: "linear-gradient(180deg,#1a1a2e 0%,#16213e 100%)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)" }}>
                      <span key={val} className="font-mono font-black text-[24px] text-white leading-none fs-flip-digit">{val}</span>
                      <span className="text-[7px] font-bold tracking-[0.18em] text-white/30 mt-1">{label}</span>
                    </div>
                    {i < 2 && <span className="font-black text-2xl text-white/70 leading-none pb-2"
                      style={{ animation: "fs-dot-pulse 1s ease-in-out infinite" }}>:</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-4 mt-2 mb-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)" }} />

          {/* ── Inner panel ── */}
          <div className="relative z-10 bg-white/[0.97] mx-2 mb-2 mt-2 rounded-xl p-4">

            {/* Dải tab ngày: hôm nay đang mở, các ngày sau sắp mở */}
            <div className="flex items-center justify-center gap-2.5 mb-4 flex-wrap">
              {Array.from({ length: 4 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                const f2 = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
                return i === 0 ? (
                  <div key={i} className="px-5 py-2 rounded-xl border-2 border-red-500 bg-red-50 text-center shadow-sm shadow-red-100">
                    <p className="text-[13px] font-black text-red-600 uppercase leading-tight">Hôm nay</p>
                    <p className="text-[10.5px] text-gray-500 font-semibold">Kết thúc: <span className="font-bold text-gray-700">23:59</span></p>
                  </div>
                ) : (
                  <div key={i} className="px-5 py-2 rounded-xl border border-gray-200 text-center opacity-80">
                    <p className="text-[13px] font-bold text-gray-700 leading-tight tabular-nums">{f2}</p>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Sắp mở</p>
                  </div>
                );
              })}
            </div>

            {/* Product carousel */}
            <div className="relative">
              <button onClick={() => saleScrollRef.current?.scrollBy({ left: -420, behavior: "smooth" })}
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 border border-gray-100 transition-all hover:scale-110"
                style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div ref={saleScrollRef} className="flex gap-3 overflow-x-auto pb-1"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" as React.CSSProperties["msOverflowStyle"] }}>
                {loadingSale
                  ? Array.from({ length: 6 }).map((_, i) => <FlashSaleSkeletonCard key={i} />)
                  : saleProducts.length > 0
                    ? saleProducts.map((pp) => <FlashSaleProductCard key={pp.id} p={pp} />)
                    : <div className="w-full py-10 text-center"><p className="text-gray-400 text-sm">Hiện chưa có sản phẩm Flash Sale</p></div>
                }
              </div>
              <button onClick={() => saleScrollRef.current?.scrollBy({ left: 420, behavior: "smooth" })}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 border border-gray-100 transition-all hover:scale-110"
                style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom note */}
          <div className="relative z-10 px-4 pb-4">
            <p className="text-center text-[10px] text-white/40 leading-relaxed">
              Chỉ áp dụng thanh toán online thành công — Mỗi tài khoản chỉ được mua 1 sản phẩm cùng loại — Không áp dụng cùng ưu đãi khác
            </p>
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

      {/* ── ƯU ĐÃI GIÁO DỤC & THANH TOÁN ─────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ưu đãi giáo dục */}
          <div className="bg-white border border-gray-100 rounded-sm p-6">
            <h2 className="text-center text-base font-bold text-gray-800 uppercase tracking-wide mb-5">Ưu đãi giáo dục</h2>
            <div className="grid grid-cols-2 gap-3">
              {eduPromos.map((promo) => (
                <Link
                  key={promo.title}
                  href={promo.href}
                  className="group relative overflow-hidden rounded-xl p-4 flex flex-col justify-between min-h-[150px] transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <img
                    src={promo.img}
                    alt={promo.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 bg-slate-700"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                  <div className="relative z-10">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${promo.tagClass}`}>
                      {promo.tag}
                    </span>
                    <h3 className="mt-2 text-sm font-bold leading-snug" style={{ color: promo.titleColor }}>
                      {promo.title}
                    </h3>
                  </div>
                  <div className="relative z-10">
                    <p className="text-lg font-extrabold" style={{ color: promo.titleColor }}>{promo.highlight}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: promo.subColor }}>{promo.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Ưu đãi thanh toán */}
          <div className="bg-white border border-gray-100 rounded-sm p-6">
            <h2 className="text-center text-base font-bold text-gray-800 uppercase tracking-wide mb-5">Ưu đãi thanh toán</h2>
            <div className="grid grid-cols-2 gap-3">
              {paymentPromos.map((promo) => (
                <Link
                  key={promo.title}
                  href={promo.href}
                  className="group relative overflow-hidden rounded-xl p-4 flex flex-col justify-between min-h-[150px] transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <img
                    src={promo.img}
                    alt={promo.brand}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 bg-slate-700"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                  <div className="relative z-10 flex items-center gap-1.5">
                    <promo.icon className="w-4 h-4" style={{ color: promo.titleColor }} />
                    <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: promo.titleColor }}>
                      {promo.brand}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <p className="text-sm font-semibold leading-snug" style={{ color: promo.titleColor }}>{promo.title}</p>
                    <p className="text-lg font-extrabold mt-1" style={{ color: promo.titleColor }}>{promo.highlight}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: promo.subColor }}>{promo.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
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
