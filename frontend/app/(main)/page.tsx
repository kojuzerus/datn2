"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Star, ArrowRight,
  ShieldCheck, Truck, RefreshCw, Headphones,
  Smartphone, Heart, Wallet, CreditCard,
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
function FlashSaleProductCard({ p }: { p: ProductFeatured }) {
  const displayPrice = p.giaSale ?? p.gia;
  const chips = specChips(p.specification);
  const totalSlots = ((p.id * 13 + 7) % 40) + 10;
  const soldSlots  = Math.floor(totalSlots * (((p.id * 7 + 3) % 60) + 10) / 100);
  const soldPct    = Math.max((soldSlots / totalSlots) * 100, 8);
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
    <Link href={`/sanpham/${p.slug}`} className="block flex-shrink-0 w-[195px]">
      <div className="bg-white rounded-xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col h-full">

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
          {p.giamGia > 0 && (
            <span className="absolute top-2 left-4 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              -{p.giamGia}%
            </span>
          )}
          <img
            src={p.thumbnail || "https://placehold.co/300x300?text=No+Image"}
            alt={p.ten}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="px-3 pb-3 flex flex-col gap-2 flex-1">
          {/* Price row */}
          <div>
            <p className="text-red-600 font-bold text-[15px] leading-tight">{fmt(displayPrice)}</p>
            {p.giamGia > 0 && (
              <p className="text-gray-400 text-[11px] line-through">{fmt(p.gia)}</p>
            )}
          </div>

          {/* Name */}
          <p className="text-[12px] font-semibold text-gray-800 line-clamp-2 leading-snug flex-1">{p.ten}</p>

          {/* Progress bar */}
          <div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${soldPct}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Đã bán {soldSlots}/{totalSlots} suất</p>
          </div>

          {/* Bottom: Mua ngay + yêu thích */}
          <div className="flex items-center gap-2 mt-auto">
            <button className="flex-1 py-1.5 rounded-full border border-red-500 text-red-600 text-[12px] font-bold hover:bg-red-500 hover:text-white transition-colors">
              Mua ngay
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
      {/* pt-14 để dành chỗ cho tai thỏ nhô lên */}
      <section className="max-w-screen-xl mx-auto px-6 mt-6 pt-14 relative">

        {/* Con thỏ đặt ngoài khung — tai nhô lên trên */}
        <div className="hidden md:flex items-end gap-2 absolute left-1/2 -translate-x-1/2 top-0 z-30">
          <div style={{ animation: "rabbit-jump 2.4s ease-in-out infinite" }}>
            <Rabbit3D size={96} />
          </div>
          <div
            className="-rotate-6 bg-yellow-300 text-red-700 font-black leading-tight px-3 py-1.5 rounded-xl mb-10"
            style={{ fontSize: "0.8rem", boxShadow: "0 4px 14px rgba(0,0,0,0.22)" }}
          >
            DEAL SỤT<br />BAY GIÁ
          </div>
        </div>

        {/* Khung chính — KHÔNG overflow-hidden để tai thỏ nhô ra */}
        <div className="rounded-2xl" style={{ boxShadow: "0 8px 32px rgba(220,38,38,0.22), 0 2px 8px rgba(0,0,0,0.1)" }}>

          {/* ── Header đỏ ── */}
          <div
            className="relative px-6 pt-5 pb-16 rounded-t-2xl"
            style={{ background: "linear-gradient(90deg, #b91c1c 0%, #dc2626 50%, #b91c1c 100%)" }}
          >
            <div className="flex items-center justify-between">
              {/* Trái: FLASH SALE */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className="text-white font-black uppercase tracking-wider"
                  style={{ fontSize: "clamp(1.3rem, 2vw, 1.7rem)", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                >
                  Flash Sale
                </span>
              </div>

              {/* Phải: đếm ngược */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="hidden sm:block text-white/70 text-[11px] font-bold uppercase tracking-widest text-right leading-tight">
                  Kết thúc<br />sau
                </span>
                <div className="flex items-center gap-1">
                  {[pad(saleTimeLeft.h), pad(saleTimeLeft.m), pad(saleTimeLeft.s)].map((val, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div
                        className="font-mono font-black text-white flex items-center justify-center rounded-lg"
                        style={{
                          fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)",
                          width: "2.6rem", height: "2.6rem",
                          background: "linear-gradient(180deg,#1a1a2e 0%,#111827 100%)",
                          boxShadow: "0 3px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
                        }}
                      >
                        {val}
                      </div>
                      {i < 2 && <span className="text-white/70 font-bold text-lg leading-none">:</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Panel trắng — top cong nhô lên ── */}
          <div
            className="bg-white relative z-10 rounded-b-2xl"
            style={{ borderRadius: "28px 28px 16px 16px", marginTop: "-28px" }}
          >
            {/* Tab ngày */}
            <div
              className="flex items-center justify-center gap-2 px-5 pt-4 pb-3 border-b border-gray-100 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              <button className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition">
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: 4 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                const f2 = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
                return i === 0 ? (
                  <div key={i} className="px-5 py-2 rounded-xl border-2 border-red-500 bg-red-50 text-center flex-shrink-0 shadow-sm shadow-red-100">
                    <p className="text-red-600 text-[13px] font-black uppercase leading-tight">Hôm nay</p>
                    <p className="text-gray-500 text-[10px] font-medium">Kết thúc: <strong className="text-gray-700">23:59</strong></p>
                  </div>
                ) : (
                  <div key={i} className="px-5 py-2 rounded-xl border border-gray-200 text-center flex-shrink-0">
                    <p className="text-gray-700 text-[13px] font-bold tabular-nums leading-tight">{f2}</p>
                    <p className="text-red-500 text-[10px] font-bold uppercase tracking-wide">Sắp mở</p>
                  </div>
                );
              })}

              <button className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

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
                {loadingSale
                  ? Array.from({ length: 6 }).map((_, i) => <FlashSaleSkeletonCard key={i} />)
                  : saleProducts.length > 0
                    ? saleProducts.map((pp) => <FlashSaleProductCard key={pp.id} p={pp} />)
                    : <div className="w-full py-10 text-center"><p className="text-gray-400 text-sm">Hiện chưa có sản phẩm Flash Sale</p></div>
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
