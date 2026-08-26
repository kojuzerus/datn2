"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Laptop,
  Tv2,
  Headphones,
  Clock,
} from "lucide-react";

// ── Màu chung cho cả banner — đồng bộ với màu thương hiệu đỏ dùng xuyên suốt
// web (header, nút mua hàng, Flash Sale...), không đổi màu theo từng slide nữa.
const BRAND_BG = "linear-gradient(135deg, #ffffff 0%, #fff5f5 55%, #ffffff 100%)";
const BRAND_COLOR = "#D32F2F";

// ── Slide data ───────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 1,
    tag: "KHUYẾN MÃI HÔM NAY",
    tabLabel: "Siêu phẩm công nghệ 2026",
    title: "iPhone 17",
    titleLine2: "Pro Max",
    subtitle: "Titanium Deep Blue. Camera 200MP kép đỉnh.\nChip A19 Bionic thế hệ mới nhất.",
    cta: "Đặt trước ngay",
    href: "/sanpham?tu-khoa=iPhone%2017%20Pro%20Max",
    productImg: "/banners/iphone-17-pro.png",
    bg: BRAND_BG,
    tagColor: BRAND_COLOR,
    ctaBg: BRAND_COLOR,
  },
  {
    id: 2,
    tag: "GALAXY AI FLAGSHIP",
    tabLabel: "Chiến game đỉnh - Làm việc nhanh",
    title: "Samsung S25",
    titleLine2: "Ultra",
    subtitle: "Galaxy AI mạnh nhất. S Pen thông minh.\nSnapdragon 8 Elite — vượt mọi giới hạn.",
    cta: "Mua ngay",
    href: "/sanpham?tu-khoa=Samsung%20S25%20Ultra",
    productImg: "/banners/samsung-s25-ultra.png",
    bg: BRAND_BG,
    tagColor: BRAND_COLOR,
    ctaBg: BRAND_COLOR,
  },
  {
    id: 3,
    tag: "APPLE SILICON M4",
    tabLabel: "Làm việc nhanh - Sống đẳng cấp",
    title: "MacBook Air",
    titleLine2: "M4 2025",
    subtitle: "Mỏng nhẹ nhất. Pin 18h. Siêu nhanh.\nLiquid Retina — màu sắc sống động.",
    cta: "Khám phá ngay",
    href: "/sanpham?tu-khoa=MacBook%20Air%20M4",
    productImg: "/banners/macbook-air-m4.png",
    bg: BRAND_BG,
    tagColor: BRAND_COLOR,
    ctaBg: BRAND_COLOR,
  },
];

// ── Sidebar categories ───────────────────────────────────────────────
const SIDEBAR_CATS = [
  { label: "Điện thoại", Icon: Smartphone, href: "/sanpham?danh-muc=dien-thoai" },
  { label: "Laptop",     Icon: Laptop,     href: "/sanpham?danh-muc=laptop" },
  { label: "Phụ Kiện",   Icon: Headphones, href: "/sanpham?danh-muc=phu-kien" },
];

// ── Right promo banners (ảnh thật từ /public/banners) ────────────────
const PROMO_CARDS = [
  { src: "/banners/promo-unpacked.webp", href: "/sanpham?tu-khoa=Samsung", alt: "Samsung Unpacked" },
  { src: "/banners/promo-vivobook.jpg",  href: "/sanpham?danh-muc=laptop", alt: "ASUS Vivobook ưu đãi" },
  { src: "/banners/promo-oppo.webp",     href: "/sanpham?tu-khoa=OPPO",    alt: "OPPO ưu đãi" },
];

interface RecentProduct {
  id: number;
  ten: string;
  thumbnail: string;
  gia: number;
  giaSale?: number;
  slug: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [imgKey, setImgKey]   = useState(0);
  const [recent, setRecent]   = useState<RecentProduct[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length);
      setImgKey((k) => k + 1);
    }, 5000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("smarthub_recently_viewed");
      if (raw) setRecent(JSON.parse(raw).slice(0, 10));
    } catch {}
  }, []);

  const goTo = (idx: number) => {
    const n = ((idx % SLIDES.length) + SLIDES.length) % SLIDES.length;
    setCurrent(n);
    setImgKey((k) => k + 1);
    startTimer();
  };

  const slide = SLIDES[current];

  return (
    <section className="max-w-screen-xl mx-auto px-4 sm:px-6 mt-4">
      {/* Dưới lg: xếp dọc (slider lên đầu vì bắt mắt nhất), 3 cột cố định
          198/246px gộp lại đã vượt quá bề rộng màn hình điện thoại (390px)
          nên trước đây bị cắt/mất hẳn nội dung bên phải — không có responsive
          gì cả. Từ lg trở lên giữ nguyên bố cục 3 cột ngang như cũ. */}
      <div className="flex flex-col lg:flex-row gap-3 lg:h-[400px]">

        {/* ── Center: Slider (lên đầu trên mobile) ─────────────── */}
        <div
          className="order-1 lg:order-2 lg:flex-1 rounded-2xl overflow-hidden flex flex-col relative border border-gray-100"
          style={{ background: slide.bg, transition: "background 0.5s ease" }}
        >
          {/* Slide content — hai cột cố định, không chồng chéo */}
          <div className="flex-1 flex items-stretch relative overflow-hidden">

            {/* Cột trái: Text */}
            <div className="w-[50%] flex flex-col justify-center pl-10 pr-4 py-6 z-10">
              <span
                className="inline-block text-[10.5px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full mb-4 w-fit"
                style={{ background: `${slide.tagColor}18`, color: slide.tagColor }}
              >
                {slide.tag}
              </span>
              <h2
                className="font-black leading-tight mb-3 text-gray-900"
                style={{ fontSize: "clamp(1.5rem, 2.4vw, 2.2rem)" }}
              >
                {slide.title}
                <br />
                <span style={{ color: slide.tagColor }}>{slide.titleLine2}</span>
              </h2>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-6 whitespace-pre-line">
                {slide.subtitle}
              </p>
              <Link
                href={slide.href}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm text-white transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-md w-fit"
                style={{ background: slide.ctaBg, boxShadow: `0 4px 14px ${slide.ctaBg}44` }}
              >
                {slide.cta}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Cột phải: Ảnh sản phẩm */}
            <div className="flex-1 flex items-center justify-center pr-6 overflow-hidden">
              <img
                key={imgKey}
                src={slide.productImg}
                alt={slide.title}
                style={{
                  maxHeight: 270,
                  maxWidth: "100%",
                  width: "auto",
                  objectFit: "contain",
                  animation: "hero-slide-in 0.45s cubic-bezier(0.23,1,0.32,1)",
                }}
                className="drop-shadow-2xl"
              />
            </div>

            {/* Prev arrow */}
            <button
              onClick={() => goTo(current - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 hover:bg-white shadow flex items-center justify-center transition-all z-20"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>

            {/* Next arrow */}
            <button
              onClick={() => goTo(current + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 hover:bg-white shadow flex items-center justify-center transition-all z-20"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-black/10">
            <div
              key={`${current}-progress`}
              className="h-full"
              style={{
                background: slide.ctaBg,
                transformOrigin: "left center",
                animation: "banner-progress 5s linear forwards",
              }}
            />
          </div>

          {/* Tab bar */}
          <div className="bg-white/85 backdrop-blur-sm flex">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                className={`flex-1 px-3 py-2.5 text-[10px] font-semibold text-center transition-all border-b-2 leading-tight ${
                  i === current
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {s.tabLabel}
              </button>
            ))}
          </div>
        </div>

        {/* ── Left: Sidebar danh mục + đã xem gần đây (lên dưới slider trên
            mobile) — trên mobile rút gọn thành hàng ngang, bỏ "Đã xem gần
            đây" (chiếm chỗ, không thiết yếu bằng slider/khuyến mãi) ── */}
        <div className="order-2 lg:order-1 w-full lg:w-[198px] lg:flex-shrink-0 bg-white rounded-2xl flex flex-col overflow-hidden">
          {/* Danh mục */}
          <div className="px-3 pt-3 lg:pt-4 pb-3 lg:pb-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
              Danh mục
            </p>
            <div className="flex lg:flex-col gap-2 lg:gap-0">
              {SIDEBAR_CATS.map(({ label, Icon, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex-1 lg:flex-initial flex flex-col lg:flex-row items-center lg:items-center gap-1.5 lg:gap-2.5 px-2 py-2.5 lg:py-[9px] rounded-xl bg-gray-50 lg:bg-transparent hover:bg-red-50 group transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                    <Icon className="w-3.5 h-3.5 text-red-500" />
                  </span>
                  <span className="flex-1 text-[11px] lg:text-[12.5px] text-center lg:text-left font-semibold text-gray-700 group-hover:text-red-600 transition-colors">
                    {label}
                  </span>
                  <ChevronRight className="hidden lg:block w-3.5 h-3.5 text-gray-300 group-hover:text-red-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Đã xem gần đây — chỉ hiện từ lg trở lên */}
          <div className="hidden lg:block px-3 pb-4 flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent" }}>
            <div className="mx-0 my-2 h-px bg-gray-100" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Đã xem gần đây
            </p>
            {recent.length === 0 ? (
              <p className="text-[11px] text-gray-400 px-1 leading-snug">
                Sản phẩm bạn đã xem sẽ hiển thị ở đây.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {recent.map((p) => (
                  <Link
                    key={p.id}
                    href={`/sanpham/${p.slug}`}
                    className="flex items-center gap-2 group"
                  >
                    <img
                      src={p.thumbnail}
                      alt={p.ten}
                      className="w-10 h-10 rounded-lg border border-gray-100 object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10.5px] font-medium text-gray-700 group-hover:text-red-500 line-clamp-1 transition-colors">
                        {p.ten}
                      </p>
                      <p className="text-[10.5px] font-bold text-red-600">
                        {fmt(p.giaSale ?? p.gia)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Promo banners — hàng cuộn ngang trên mobile, cột dọc
            cố định từ lg trở lên ─────────────────────────────── */}
        <div className="order-3 w-full lg:w-[246px] lg:flex-shrink-0 flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">
            Khuyến mãi nổi bật
          </p>
          <div className="flex lg:flex-col gap-2 lg:gap-2 lg:flex-1 overflow-x-auto lg:overflow-visible [&::-webkit-scrollbar]:hidden [scrollbar-width:none] -mx-4 px-4 lg:mx-0 lg:px-0">
            {PROMO_CARDS.map((b) => (
              <Link
                key={b.href}
                href={b.href}
                className="w-[220px] h-[120px] lg:w-auto lg:h-auto shrink-0 lg:flex-1 rounded-xl overflow-hidden block group"
              >
                <img
                  src={b.src}
                  alt={b.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
