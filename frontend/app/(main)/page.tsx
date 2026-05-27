"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Star, ArrowRight,
  ShieldCheck, Truck, RefreshCw, Headphones,
  Smartphone, Laptop, Tablet, Watch,
} from "lucide-react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const banners = [
  {
    id: 1,
    tag: "Ra mắt độc quyền",
    title: "iPhone 17\nPro Max",
    sub: "Chip A19 Bionic • Camera 200MP • Titanium Desert",
    cta: "Đặt trước ngay",
    badge: "Từ 34.990.000đ",
    img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1400&q=80&fit=crop",
  },
  {
    id: 2,
    tag: "Galaxy AI Flagship",
    title: "Samsung S25\nUltra",
    sub: "Galaxy AI • S Pen Pro • Camera 200MP • Snapdragon 8 Elite",
    cta: "Mua ngay",
    badge: "Tiết kiệm 3.000.000đ",
    img: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=1400&q=80&fit=crop",
  },
  {
    id: 3,
    tag: "Apple Silicon M4",
    title: "MacBook Air\nM4 2025",
    sub: "Chip M4 • 16GB RAM • 13.6 inch Liquid Retina • 18h pin",
    cta: "Khám phá ngay",
    badge: "Tặng AppleCare+ 3 tháng",
    img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1400&q=80&fit=crop",
  },
];

const categories = [
  { ten: "Điện thoại", icon: Smartphone, slug: "dien-thoai" },
  { ten: "Laptop", icon: Laptop, slug: "laptop" },
  { ten: "Máy tính bảng", icon: Tablet, slug: "may-tinh-bang" },
  { ten: "Tai nghe", icon: Headphones, slug: "tai-nghe" },
  { ten: "Đồng hồ", icon: Watch, slug: "dong-ho" },
];

const sanphamNoiBat = [
  {
    id: 1, ten: "iPhone 15 Pro Max", thuongHieu: "Apple",
    gia: 34990000, giamGia: 5, danhGia: 4.9, badge: "Bán chạy",
    moTa: "Chip A17 Pro, vỏ Titanium, camera zoom 5x",
    hinhAnh: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80&fit=crop",
  },
  {
    id: 2, ten: "Samsung Galaxy S24 Ultra", thuongHieu: "Samsung",
    gia: 31990000, giamGia: 10, danhGia: 4.8, badge: "Hot",
    moTa: "Galaxy AI, S Pen, camera 200MP",
    hinhAnh: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80&fit=crop",
  },
  {
    id: 3, ten: "MacBook Air M3", thuongHieu: "Apple",
    gia: 28990000, giamGia: 0, danhGia: 4.9, badge: "Mới",
    moTa: "Chip M3, siêu mỏng nhẹ, pin 18h",
    hinhAnh: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80&fit=crop",
  },
  {
    id: 4, ten: "Dell XPS 15", thuongHieu: "Dell",
    gia: 42000000, giamGia: 8, danhGia: 4.7, badge: "Cao cấp",
    moTa: "Màn hình OLED, RTX 4060, thiết kế tinh xảo",
    hinhAnh: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80&fit=crop",
  },
  {
    id: 5, ten: "iPad Pro M4 11 inch", thuongHieu: "Apple",
    gia: 23990000, giamGia: 0, danhGia: 4.8, badge: "Mới nhất",
    moTa: "Chip M4, mỏng nhất thế giới, Ultra Retina XDR",
    hinhAnh: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80&fit=crop",
  },
  {
    id: 6, ten: "Sony WH-1000XM5", thuongHieu: "Sony",
    gia: 8490000, giamGia: 15, danhGia: 4.9, badge: "Bestseller",
    moTa: "Chống ồn #1, Hi-Res Audio, pin 30h",
    hinhAnh: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80&fit=crop",
  },
];

const banChay = [
  {
    id: 1, ten: "iPhone 15 Pro Max 256GB", luotBan: "12.4K",
    gia: 34990000, giamGia: 5, danhGia: 4.9,
    moTa: "Chip A17 Pro, vỏ Titanium, camera zoom 5x",
    hinhAnh: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80&fit=crop",
  },
  {
    id: 2, ten: "Samsung Galaxy S24 Ultra", luotBan: "9.8K",
    gia: 31990000, giamGia: 10, danhGia: 4.8,
    moTa: "Galaxy AI, S Pen, camera 200MP",
    hinhAnh: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80&fit=crop",
  },
  {
    id: 3, ten: "Sony WH-1000XM5", luotBan: "8.1K",
    gia: 8490000, giamGia: 15, danhGia: 4.9,
    moTa: "Chống ồn #1, Hi-Res Audio, pin 30h",
    hinhAnh: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80&fit=crop",
  },
  {
    id: 4, ten: "MacBook Air M3 2024", luotBan: "6.3K",
    gia: 28990000, giamGia: 0, danhGia: 4.9,
    moTa: "Chip M3, siêu mỏng nhẹ, pin 18h",
    hinhAnh: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80&fit=crop",
  },
];

const baiViet = [
  {
    id: 1, tag: "Đánh giá",
    tieu_de: "iPhone 17 Pro Max: Đánh giá sau 2 tuần sử dụng",
    tom_tat: "Chip A19 Bionic mạnh mẽ, camera cải tiến đáng kể, nhưng giá vẫn là rào cản lớn với nhiều người.",
    ngay: "20/05/2025",
    hinhAnh: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80&fit=crop",
  },
  {
    id: 2, tag: "So sánh",
    tieu_de: "MacBook Air M4 vs Dell XPS 15: Nên chọn cái nào?",
    tom_tat: "Hai chiếc laptop cao cấp với điểm mạnh khác nhau — Apple hay Windows sẽ phù hợp với bạn hơn?",
    ngay: "17/05/2025",
    hinhAnh: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80&fit=crop",
  },
  {
    id: 3, tag: "Tin tức",
    tieu_de: "Samsung Galaxy Z Fold 7: Những nâng cấp đáng chú ý nhất",
    tom_tat: "Thế hệ mới của dòng gập đến gần — Samsung hứa hẹn màn hình bền hơn và pin lâu hơn.",
    ngay: "14/05/2025",
    hinhAnh: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80&fit=crop",
  },
];

const tienIch = [
  { icon: ShieldCheck, title: "Hàng chính hãng 100%", sub: "Bảo hành toàn quốc" },
  { icon: Truck, title: "Giao hàng trong 2h", sub: "Nội thành miễn phí" },
  { icon: RefreshCw, title: "Đổi trả 30 ngày", sub: "Miễn phí, không điều kiện" },
  { icon: Headphones, title: "Hỗ trợ 24/7", sub: "Tư vấn chuyên sâu" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const badgeColor: Record<string, string> = {
  "Bán chạy": "bg-red-500",
  "Hot": "bg-orange-500",
  "Mới": "bg-green-500",
  "Cao cấp": "bg-purple-500",
  "Mới nhất": "bg-blue-500",
  "Bestseller": "bg-red-600",
};

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────

function ProductCard({ p }: { p: typeof sanphamNoiBat[0] }) {
  const sale = Math.round(p.gia * (1 - p.giamGia / 100));
  return (
    <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col relative cursor-pointer">
      {p.badge && (
        <span className={`absolute top-3 left-3 z-10 text-white text-[10px] font-bold px-2.5 py-1 rounded-full ${badgeColor[p.badge] ?? "bg-gray-500"}`}>
          {p.badge}
        </span>
      )}
      {p.giamGia > 0 && (
        <span className="absolute top-3 right-3 z-10 bg-red-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
          -{p.giamGia}%
        </span>
      )}
      <div className="bg-gray-50 flex items-center justify-center h-48 overflow-hidden">
        <img
          src={p.hinhAnh}
          alt={p.ten}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-red-500 mb-1">{p.thuongHieu}</p>
          <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{p.ten}</h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.moTa}</p>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <div>
            <p className="text-base font-bold text-gray-900">{fmt(sale)}</p>
            {p.giamGia > 0 && (
              <p className="text-xs text-gray-400 line-through">{fmt(p.gia)}</p>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-gray-600">{p.danhGia}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────

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
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (idx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent((idx + banners.length) % banners.length);
      setIsAnimating(false);
    }, 250);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => goTo(current + 1), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current]);

  const b = banners[current];

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── BANNER ───────────────────────────────────────────────────── */}
      <section className="relative bg-gray-900 overflow-hidden" style={{ minHeight: 420 }}>
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-300 ${isAnimating ? "opacity-0" : "opacity-100"}`}
          style={{ backgroundImage: `url(${b.img})` }}
        />
        <div className="absolute inset-0 bg-gray-900/65" />
        <div className={`relative z-10 max-w-screen-xl mx-auto px-6 py-16 md:py-24 transition-all duration-300 ${isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
          <span className="inline-block text-xs font-semibold text-red-400 uppercase tracking-widest mb-3">{b.tag}</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight whitespace-pre-line mb-4">{b.title}</h1>
          <p className="text-gray-300 text-sm md:text-base max-w-lg mb-7">{b.sub}</p>
          <div className="flex items-center gap-4">
            <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition-colors">
              {b.cta}
            </button>
            <span className="text-sm text-gray-300 bg-white/10 px-4 py-3 rounded-xl border border-white/10">{b.badge}</span>
          </div>
        </div>
        <button onClick={() => goTo(current - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={() => goTo(current + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-red-500" : "w-2 bg-white/30"}`} />
          ))}
        </div>
      </section>

      {/* ── TIỆN ÍCH ─────────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 -mt-5 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tienIch.map((t) => (
            <div key={t.title} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm">
              <t.icon className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-700 leading-tight">{t.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DANH MỤC ─────────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-10">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.slug} href={`/sanpham?danh-muc=${cat.slug}`} className="flex-shrink-0 flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 hover:border-red-200 hover:bg-red-50 transition-all group">
                <Icon className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
                <span className="text-sm font-medium text-gray-600 group-hover:text-red-600 whitespace-nowrap">{cat.ten}</span>
              </Link>
            );
          })}
          <Link href="/sanpham" className="flex-shrink-0 flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 px-3 whitespace-nowrap">
            Xem thêm <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ── SẢN PHẨM NỔI BẬT ────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-10">
        <SectionHeader title="Sản phẩm nổi bật" href="/sanpham" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {sanphamNoiBat.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* ── BÁN CHẠY NHẤT ───────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-12">
        <SectionHeader title="Bán chạy nhất" href="/sanpham" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {banChay.map((p, i) => {
            const sale = Math.round(p.gia * (1 - p.giamGia / 100));
            const rankLabel = i + 1;
            return (
              <div key={p.id} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col relative cursor-pointer">
                <div className={`absolute top-0 left-0 z-10 w-8 h-8 flex items-center justify-center text-sm font-black rounded-br-xl rounded-tl-2xl ${i === 0 ? "bg-amber-400 text-amber-900" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-orange-300 text-orange-800" : "bg-gray-100 text-gray-500"}`}>{rankLabel}</div>
                {p.giamGia > 0 && (
                  <span className="absolute top-3 right-3 z-10 bg-red-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    -{p.giamGia}%
                  </span>
                )}
                <div className="h-48 overflow-hidden">
                  <img src={p.hinhAnh} alt={p.ten} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
                <div className="p-4 flex flex-col flex-1 gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{p.ten}</h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.moTa}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-base font-bold text-gray-900">{fmt(sale)}</p>
                      <p className="text-[10px] text-gray-400">Đã bán: {p.luotBan}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium text-gray-600">{p.danhGia}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── MINI BANNER ĐÔI ──────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-100 to-blue-200 p-6 flex items-center justify-between min-h-[160px] cursor-pointer group hover:brightness-95 transition-all">
            <div className="z-10">
              <span className="inline-block bg-white text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full mb-3 tracking-wider">SALE GIỮA THÁNG</span>
              <h3 className="text-2xl font-black text-blue-900 leading-tight">NGẬP TRÀN<br/>ƯU ĐÃI</h3>
              <div className="mt-3 inline-block bg-orange-400 text-white font-bold text-sm px-4 py-1.5 rounded-full">Giảm đến 30%</div>
            </div>
            <div className="absolute right-0 bottom-0 h-full w-1/2 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80&fit=crop"
                alt="sale"
                className="w-full h-full object-cover object-left group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-transparent" />
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-gray-900 p-6 flex items-center justify-between min-h-[160px] cursor-pointer group hover:brightness-110 transition-all">
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80&fit=crop"
                alt="gaming"
                className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent" />
            </div>
            <div className="z-10">
              <span className="inline-block bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-3 tracking-wider">GAMING</span>
              <h3 className="text-2xl font-black text-white leading-tight">CHƠI KHÔNG NGẮT<br/><span className="text-red-400">PIN TRÂU</span></h3>
              <p className="text-gray-400 text-xs mt-2">Cán mọi trận — không lo hết pin</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SALE ĐIỆN MÁY GIA ĐÌNH — MAGAZINE ──────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Sale Điện Máy Gia Đình</h2>
            <p className="text-sm text-gray-400 mt-0.5">Nâng cấp không gian sống — ưu đãi lớn nhất mùa</p>
          </div>
          <Link href="/sanpham?danh-muc=dien-may" className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors">
            Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden cursor-pointer group bg-[#0f172a] flex flex-col justify-between min-h-[380px]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
            <div className="p-7 z-10 relative">
              <span className="inline-block text-[10px] font-bold tracking-[0.2em] uppercase text-red-400 mb-4">Deal hôm nay</span>
              <h3 className="text-4xl font-black text-white leading-tight mb-2">
                Tủ Đông<br/><span className="text-slate-400 text-2xl font-semibold">510 Lít</span>
              </h3>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">Dual inverter • Nhiều ngăn<br/>Tiết kiệm điện — Trữ lạnh lâu</p>
              <div className="mt-6 flex items-end gap-3">
                <span className="text-2xl font-black text-white">8.500.000đ</span>
                <span className="text-sm text-slate-500 line-through mb-0.5">10.000.000đ</span>
              </div>
              <div className="mt-5 flex items-center gap-2">
                <button className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors">Mua ngay</button>
                <span className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-2 rounded-xl">-15%</span>
              </div>
            </div>
            <div className="relative h-44 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80&fit=crop"
                alt="Tủ đông"
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 flex justify-around bg-black/40 py-2 px-3">
                {["510 lít", "Dual inverter", "Nhiều ngăn"].map((t) => (
                  <span key={t} className="text-white/70 text-[10px] text-center">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 flex flex-col gap-4">
            {[
              {
                ten: "Điều hòa Casper 2HP Inverter", moTa: "Tiết kiệm điện • 1 chiều • 18.000 BTU",
                gia: 9990000, giaCu: 11350000, giamGia: 12, tag: "Tiết kiệm điện",
                tagColor: "bg-blue-50 text-blue-700", accent: "border-l-blue-400",
                hinhAnh: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&q=80&fit=crop",
              },
              {
                ten: 'Smart TV Samsung 4K 55"', moTa: "4K UHD • LED • Google TV • Kết nối đa thiết bị",
                gia: 12490000, giaCu: 15230000, giamGia: 18, tag: "Hình ảnh 4K",
                tagColor: "bg-emerald-50 text-emerald-700", accent: "border-l-emerald-400",
                hinhAnh: "https://images.unsplash.com/photo-1593359677879-a4bb92f4834a?w=200&q=80&fit=crop",
              },
              {
                ten: "Máy giặt LG 12kg Steam", moTa: "Lồng ngang • AI DD • Hơi nước diệt khuẩn",
                gia: 14990000, giaCu: 16650000, giamGia: 10, tag: "Giặt sạch sâu",
                tagColor: "bg-purple-50 text-purple-700", accent: "border-l-purple-400",
                hinhAnh: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=200&q=80&fit=crop",
              },
            ].map((item) => (
              <div key={item.ten} className={`group flex items-center gap-4 bg-white border border-gray-100 border-l-4 ${item.accent} rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex-1`}>
                <div className="w-24 h-24 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden">
                  <img src={item.hinhAnh} alt={item.ten} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full mb-1.5 ${item.tagColor}`}>{item.tag}</span>
                  <h4 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-1">{item.ten}</h4>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.moTa}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-gray-900">{fmt(item.gia)}</p>
                  <p className="text-xs text-gray-400 line-through mt-0.5">{fmt(item.giaCu)}</p>
                  <span className="inline-block mt-1.5 bg-red-50 text-red-600 text-[10px] font-bold px-2.5 py-1 rounded-full">-{item.giamGia}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BÀI VIẾT ─────────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-12 mb-16">
        <SectionHeader title="Tin tức & Đánh giá" href="/tin-tuc" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {baiViet.map((bv) => (
            <Link key={bv.id} href={`/tin-tuc/${bv.id}`} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer">
              <div className="h-44 overflow-hidden">
                <img src={bv.hinhAnh} alt={bv.tieu_de} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              </div>
              <div className="p-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-red-500">{bv.tag}</span>
                <h3 className="text-sm font-semibold text-gray-800 mt-1.5 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">{bv.tieu_de}</h3>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">{bv.tom_tat}</p>
                <p className="text-[10px] text-gray-300 mt-3">{bv.ngay}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}