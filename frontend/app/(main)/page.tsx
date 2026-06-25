"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Star, ArrowRight,
  ShieldCheck, Truck, RefreshCw, Headphones,
  Smartphone, Laptop, Tablet, Watch, Mouse, Speaker,
} from "lucide-react";

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

interface Category {
  category_id: number;
  category_name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  image_url?: string;
  status: string;
  created_at: string;
}

const categoriesIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "dien-thoai": Smartphone,
  laptop: Laptop,
  chuot: Mouse,
  "tai-nghe": Headphones,
  loa: Speaker,
  "dong-ho": Watch,
  "phu-kien": Headphones,
};

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
  {
    id: 4, tag: "Đánh giá",
    tieu_de: "Galaxy Watch 7 Ultra: Smartwatch tốt nhất Android 2025?",
    tom_tat: "Dòng đồng hồ mới nhất của Samsung có đáng để nâng cấp hay không? Đánh giá nhanh tính năng, pin và thiết kế.",
    ngay: "11/05/2025",
    hinhAnh: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80&fit=crop",
  },
];

const baiVietMini = [
  {
    id: 4,
    tag: "Hướng dẫn",
    tieu_de: "5 cách kéo dài tuổi thọ pin điện thoại hiệu quả nhất",
    hinhAnh: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80&fit=crop",
  },
  {
    id: 5,
    tag: "Kinh nghiệm",
    tieu_de: "Mua tai nghe chống ồn: Những điều cần biết trước khi xuống tiền",
    hinhAnh: "https://images.unsplash.com/photo-1517519014922-8fc7eea9b7f1?w=800&q=80&fit=crop",
  },
  {
    id: 6,
    tag: "Xu hướng",
    tieu_de: "Laptop gaming tầm giá 20–25 triệu đáng mua nhất 2025",
    hinhAnh: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80&fit=crop",
  },
];

const tienIch = [
  { icon: ShieldCheck, title: "Hàng chính hãng 100%", sub: "Bảo hành toàn quốc" },
  { icon: Truck,       title: "Giao hàng trong 2h",   sub: "Nội thành miễn phí" },
  { icon: RefreshCw,   title: "Đổi trả 30 ngày",      sub: "Miễn phí, không điều kiện" },
  { icon: Headphones,  title: "Hỗ trợ 24/7",           sub: "Tư vấn chuyên sâu" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const badgeColor: Record<string, string> = {
  "Bán chạy": "bg-red-500",
  "Hot":       "bg-orange-500",
  "Mới":       "bg-green-500",
  "Nổi bật":  "bg-blue-500",
  "Bestseller":"bg-red-600",
};

// ─── SKELETON CARD ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
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
  return (
    <Link href={`/sanpham/${p.slug}`}>
      <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col relative cursor-pointer h-full">
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
        <div className="bg-gray-50 flex items-center justify-center h-48 overflow-hidden rounded-t-2xl">
          <img
            src={p.thumbnail || "https://placehold.co/400x300?text=No+Image"}
            alt={p.ten}
            className="w-full h-full min-w-full min-h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
              <p className="text-base font-bold text-gray-900">{fmt(displayPrice)}</p>
              {p.giamGia > 0 && (
                <p className="text-xs text-gray-400 line-through">{fmt(p.gia)}</p>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-gray-600">{p.danhGia || "—"}</span>
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
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ── Fetch sản phẩm nổi bật ──────────────────────────────────────────────
  useEffect(() => {
    setLoadingFeat(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/featured?limit=6`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setFeatured(json.data);
        else setErrorFeat("Không thể tải sản phẩm nổi bật");
      })
      .catch(() => setErrorFeat("Lỗi kết nối server"))
      .finally(() => setLoadingFeat(false));
  }, []);

  // ── Fetch danh mục từ backend ───────────────────────────────────────────
  useEffect(() => {
    setLoadingCats(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`)
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/best-selling?limit=4`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setBestSelling(json.data);
        else setErrorBest("Không thể tải sản phẩm bán chạy");
      })
      .catch(() => setErrorBest("Lỗi kết nối server"))
      .finally(() => setLoadingBest(false));
  }, []);

  // ── Banner carousel ─────────────────────────────────────────────────────
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
          {loadingCats ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 h-11 w-28 rounded-xl bg-white border border-gray-100 animate-pulse" />
            ))
          ) : errorCats ? (
            <p className="text-sm text-red-500">{errorCats}</p>
          ) : (
            categories
              .filter((cat) => cat.slug !== "phu-kien" && cat.category_name !== "Phụ kiện")
              .map((cat) => {
                const Icon = categoriesIconMap[cat.slug] || Tablet;
                return (
                  <Link key={cat.slug} href={`/sanpham?danh-muc=${cat.slug}`} className="flex-shrink-0 flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 hover:border-red-200 hover:bg-red-50 transition-all group">
                    <Icon className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-red-600 whitespace-nowrap">{cat.category_name}</span>
                  </Link>
                );
              })
          )}
          <Link href="/sanpham" className="flex-shrink-0 flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 px-3 whitespace-nowrap">
            Xem thêm <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ── SẢN PHẨM NỔI BẬT ────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-10">
        <SectionHeader title="Sản phẩm nổi bật" href="/sanpham" />
        {errorFeat ? (
          <p className="text-sm text-red-500 text-center py-8">{errorFeat}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {loadingFeat
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : featured.map((p) => <ProductCard key={p.id} p={p} />)
            }
          </div>
        )}
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
              : bestSelling.map((p, i) => {
                  const displayPrice = p.giaSale ?? p.gia;
                  return (
                    <Link key={p.id} href={`/sanpham/${p.slug}`}>
                      <div className="group overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl h-full">
                        <div className="relative overflow-hidden bg-slate-50">
                          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/90 to-transparent pointer-events-none" />
                                  <img
                            src={p.thumbnail || "https://placehold.co/400x300?text=No+Image"}
                            alt={p.ten}
                            className="w-full h-60 min-w-full min-h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className={`absolute top-3 left-3 z-20 w-9 h-9 flex items-center justify-center text-sm font-black rounded-br-xl rounded-tl-2xl
                            ${i === 0 ? "bg-amber-400 text-amber-900"
                            : i === 1 ? "bg-slate-300 text-slate-700"
                            : i === 2 ? "bg-orange-300 text-orange-800"
                            : "bg-slate-100 text-slate-600"}`}>
                            {i + 1}
                          </div>
                          {p.giamGia > 0 && (
                            <span className="absolute top-3 right-3 z-20 bg-red-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
                              -{p.giamGia}%
                            </span>
                          )}
                        </div>
                        <div className="p-4 flex flex-col gap-3 h-[220px]">
                          <div className="min-h-[68px]">
                            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{p.ten}</h3>
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{p.moTa}</p>
                          </div>
                          <div className="mt-auto grid gap-3">
                            <div className="flex items-end justify-between gap-4">
                              <div>
                                <p className="text-lg font-bold text-gray-900">{fmt(displayPrice)}</p>
                                {p.giamGia > 0 && (
                                  <p className="text-xs text-gray-400 line-through">{fmt(p.gia)}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                <span>{p.danhGia || "—"}</span>
                              </div>
                            </div>
                            <p className="text-sm text-slate-500">Đã bán: <span className="font-semibold text-slate-700">{p.luotBan}</span></p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
            }
          </div>
        )}
      </section>

      {/* ── MINI BANNER ĐÔI ──────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/sanpham?khuyen-mai" className="group block overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 items-center">
              <div>
                <span className="inline-block bg-red-50 text-red-600 text-[10px] font-semibold uppercase tracking-[0.3em] px-3 py-1 rounded-full mb-3">Sale giữa tháng</span>
                <h3 className="text-2xl font-bold text-gray-900 leading-snug">Ngập tràn ưu đãi</h3>
                <p className="text-sm text-gray-600 mt-3">Nhiều sản phẩm giảm giá sốc, mua ngay kẻo lỡ.</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                  Giảm đến 30%
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl bg-gray-100">
                <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&fit=crop" alt="sale" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
            </div>
          </Link>

          <Link href="/sanpham?gaming" className="group block overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 items-center">
              <div>
                <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase tracking-[0.3em] px-3 py-1 rounded-full mb-3">Gaming</span>
                <h3 className="text-2xl font-bold text-gray-900 leading-snug">Chơi không ngắt</h3>
                <p className="text-sm text-gray-600 mt-3">Máy gaming hiệu năng cao, pin bền lâu cho cả ngày.</p>
                <p className="text-sm text-red-600 font-semibold mt-4">Pin trâu, hiệu năng đỉnh</p>
              </div>
              <div className="overflow-hidden rounded-2xl bg-gray-100">
                <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80&fit=crop" alt="gaming" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── BÀI VIẾT ─────────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 mt-12 mb-16">
        <SectionHeader title="Tin tức & Đánh giá" href="/tin-tuc" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Link href={`/tin-tuc/${baiViet[0].id}`} className="group col-span-1 lg:col-span-2 bg-white border border-gray-100 rounded-[28px] overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="relative h-[420px] overflow-hidden">
              <img
                src={baiViet[0].hinhAnh}
                alt={baiViet[0].tieu_de}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className="inline-flex items-center rounded-full bg-red-500/10 text-red-600 text-[11px] font-semibold uppercase tracking-[1px] px-3 py-1">
                  {baiViet[0].tag}
                </span>
                <h3 className="mt-4 text-3xl lg:text-4xl font-bold text-white leading-tight">
                  {baiViet[0].tieu_de}
                </h3>
                <p className="mt-4 max-w-2xl text-sm text-white/85 leading-relaxed">{baiViet[0].tom_tat}</p>
                <p className="mt-5 text-xs text-white/70">{baiViet[0].ngay}</p>
              </div>
            </div>
          </Link>

          <div className="space-y-4">
            {baiViet.slice(1).map((bv) => (
              <Link
                key={bv.id}
                href={`/tin-tuc/${bv.id}`}
                className="group flex gap-4 bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300"
              >
                <div className="h-28 w-28 overflow-hidden rounded-r-none rounded-l-3xl">
                  <img
                    src={bv.hinhAnh}
                    alt={bv.tieu_de}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-[1px] text-blue-600">{bv.tag}</span>
                  <h4 className="mt-2 text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">{bv.tieu_de}</h4>
                  <p className="text-[11px] text-gray-400 mt-3">{bv.ngay}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {baiVietMini.map((item) => (
            <Link
              key={item.id}
              href={`/tin-tuc/${item.id}`}
              className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300"
            >
              <div className="h-32 overflow-hidden">
                <img
                  src={item.hinhAnh}
                  alt={item.tieu_de}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <span className="text-[10px] font-semibold uppercase tracking-[1px] text-red-500">{item.tag}</span>
                <h4 className="mt-2 text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{item.tieu_de}</h4>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}