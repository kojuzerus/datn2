"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Newspaper, Search, Eye, ChevronLeft, ChevronRight,
  Home, ChevronRight as Crumb, ImageIcon, MapPin, Flame, Gift,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface NewsItem {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string;
  summary: string;
  author: string;
  views: number;
  createdAt: string;
}

interface Pagination { total: number; page: number; limit: number; totalPages: number; }

// 1 bài hero + 4 bài cột giữa + 8 bài danh sách dưới
const PAGE_SIZE = 13;

// Chip chủ đề — bấm vào sẽ tìm bài theo từ khóa
const TOPICS = ["iPhone", "Samsung", "Laptop", "Đánh giá", "Mẹo hay", "Khuyến mãi"];

const HOT_TOPICS = ["Galaxy Unpacked 2026", "Tất tần tật về AI", "Thế giới phụ kiện", "iPhone 17", "Thế giới đồng hồ"];

const EVENTS = [
  { date: "04/09", name: "IFA 2026", place: "Berlin, Đức" },
  { date: "07/01", name: "Sự kiện CES 2027", place: "Las Vegas, Nevada, Hoa Kỳ" },
];

const PROMOS = [
  { img: "/ads/redmi-17-home.png",   title: "Redmi 17 Series mở bán — ưu đãi lên đời cực chất",              href: "/sanpham?tu-khoa=redmi" },
  { img: "/ads/OppoReno16F-2.jpg",   title: "OPPO Reno16 F 5G — giảm sốc kèm quà tặng chính hãng",           href: "/sanpham?tu-khoa=oppo" },
  { img: "/ads/690x300_iPhone17Pro_1.png", title: "iPhone 17 Pro — siu hời để lên đời",                       href: "/sanpham?tu-khoa=iphone" },
  { img: "/ads/Z8-OPEN.png",         title: "Galaxy Z Fold8 series — đặt trước nhận ưu đãi tới 7 triệu",     href: "/sanpham?tu-khoa=galaxy" },
];

function timeAgo(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function Thumb({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`bg-gray-100 overflow-hidden flex items-center justify-center ${className || ""}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
      ) : (
        <ImageIcon className="w-8 h-8 text-gray-300" />
      )}
    </div>
  );
}

function Meta({ n, showViews }: { n: NewsItem; showViews?: boolean }) {
  return (
    <div className="flex items-center gap-3 text-[12px] text-gray-400">
      <span className="text-gray-500 font-medium">{n.author}</span>
      <span>{timeAgo(n.createdAt)}</span>
      {showViews && (
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {n.views}</span>
      )}
    </div>
  );
}

function SkeletonHero() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
      <div className="lg:col-span-6 space-y-4">
        <div className="aspect-[16/9] bg-gray-100 rounded-sm" />
        <div className="h-6 w-5/6 bg-gray-100 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />
      </div>
      <div className="lg:col-span-3 space-y-4">
        <div className="aspect-[16/9] bg-gray-100 rounded-sm" />
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-4/5 bg-gray-100 rounded" />
      </div>
      <div className="lg:col-span-3 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded" />)}
      </div>
    </div>
  );
}

export default function TinTucPage() {
  const [news, setNews]             = useState<NewsItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), ...(search && { search }) });
      const res  = await fetch(`${API_BASE}/api/news?${params}`);
      const json = await res.json();
      if (json.success) {
        setNews(json.data);
        setPagination(json.pagination);
      }
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  // Bố cục hero chỉ dùng ở trang 1 khi không tìm kiếm; còn lại hiện danh sách phẳng
  const heroLayout = page === 1 && !search && news.length > 0;
  const hero       = heroLayout ? news[0] : null;
  const midWithImg = heroLayout ? news[1] : null;
  const midTextOnly = heroLayout ? news.slice(2, 5) : [];
  const listItems  = heroLayout ? news.slice(5) : news;

  return (
    <div className="min-h-[100dvh] bg-white">
      {/* Breadcrumb + heading + search */}
      <div className="border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 py-5">
          <div className="flex items-center gap-1.5 text-[12.5px] text-gray-400 mb-3">
            <Link href="/" className="hover:text-red-500 transition flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> Trang chủ
            </Link>
            <Crumb className="w-3 h-3 text-gray-300" />
            <span className="text-gray-700 font-medium">Tin tức</span>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
              <Newspaper className="w-6 h-6 text-red-500" />
              Tin tức công nghệ
            </h1>
            <div className="flex items-center gap-2 bg-gray-50 rounded-sm px-3.5 py-2.5 border border-gray-200 w-full sm:w-[300px] focus-within:border-red-400 focus-within:bg-white transition-all">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                placeholder="Tìm bài viết..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="border-none bg-transparent outline-none text-sm text-gray-900 w-full placeholder-gray-400"
              />
            </div>
          </div>

          {/* Chip chủ đề gợi ý */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="text-[12px] font-bold italic text-gray-600 uppercase">Bạn có thể thích:</span>
            {TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => { setSearch(t === search ? "" : t); setPage(1); }}
                className={`text-[12.5px] px-3 py-1 rounded-full border transition-colors ${
                  search === t
                    ? "bg-red-600 border-red-600 text-white"
                    : "border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600"
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-7">
        {loading ? (
          <SkeletonHero />
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Newspaper className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-[15px] font-semibold text-gray-700 mb-1">
              {search ? `Không tìm thấy bài viết cho "${search}"` : "Chưa có bài viết nào"}
            </p>
            <p className="text-sm text-gray-400">
              {search ? "Thử từ khóa khác xem sao." : "Các bài viết sẽ sớm được cập nhật."}
            </p>
          </div>
        ) : (
          <>
            {/* ── Khối hero 3 cột kiểu trang tin lớn ── */}
            {heroLayout && hero && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8 border-b border-gray-100">
                {/* Bài nổi bật nhất (mới nhất) */}
                <Link href={`/tintuc/${hero.slug}`} className="lg:col-span-6 group block">
                  <Thumb src={hero.thumbnail} alt={hero.title} className="aspect-[16/9] rounded-sm" />
                  <h2 className="text-[22px] font-bold text-gray-900 leading-snug mt-4 group-hover:text-red-600 transition-colors">
                    {hero.title}
                  </h2>
                  {hero.summary && (
                    <p className="text-[14px] text-gray-500 leading-relaxed mt-2 line-clamp-3">{hero.summary}</p>
                  )}
                  <div className="mt-3"><Meta n={hero} showViews /></div>
                </Link>

                {/* Cột giữa: 1 bài có ảnh + các tiêu đề gọn */}
                <div className="lg:col-span-3">
                  {midWithImg && (
                    <Link href={`/tintuc/${midWithImg.slug}`} className="group block">
                      <Thumb src={midWithImg.thumbnail} alt={midWithImg.title} className="aspect-[16/9] rounded-sm" />
                      <h3 className="text-[15.5px] font-bold text-gray-900 leading-snug mt-3 group-hover:text-red-600 transition-colors line-clamp-3">
                        {midWithImg.title}
                      </h3>
                      <div className="mt-2"><Meta n={midWithImg} /></div>
                    </Link>
                  )}
                  {midTextOnly.map((n) => (
                    <Link
                      key={n._id}
                      href={`/tintuc/${n.slug}`}
                      className="group block border-t border-gray-100 mt-4 pt-4"
                    >
                      <h3 className="text-[14px] font-semibold text-gray-800 leading-snug group-hover:text-red-600 transition-colors line-clamp-3">
                        {n.title}
                      </h3>
                    </Link>
                  ))}
                </div>

                {/* Sidebar phải: chủ đề hot + sự kiện + khuyến mãi */}
                <aside className="lg:col-span-3 space-y-7">
                  <div>
                    <p className="text-[13px] font-bold text-red-600 uppercase flex items-center gap-1.5 mb-3">
                      <Flame className="w-4 h-4" /> Chủ đề hot
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {HOT_TOPICS.map((t) => (
                        <button
                          key={t}
                          onClick={() => { setSearch(t.split(" ")[0]); setPage(1); }}
                          className="text-[12px] px-2.5 py-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-600 hover:text-white transition-colors"
                        >
                          #{t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[13px] font-bold text-red-600 uppercase mb-3"># Sự kiện</p>
                    <div className="space-y-3">
                      {EVENTS.map((e) => (
                        <div key={e.name} className="flex items-center gap-3">
                          <div className="w-12 shrink-0 rounded-md border border-gray-200 overflow-hidden text-center">
                            <div className="bg-orange-500 h-1.5" />
                            <div className="text-[12px] font-bold text-gray-700 py-1.5 tabular-nums">{e.date}</div>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-semibold text-gray-800 truncate">{e.name}</p>
                            <p className="text-[12px] text-gray-400 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 shrink-0" /> {e.place}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[13px] font-bold text-red-600 uppercase flex items-center gap-1.5 mb-3">
                      <Gift className="w-4 h-4" /> Khuyến mãi
                    </p>
                    <Link href={PROMOS[0].href} className="group block">
                      <Thumb src={PROMOS[0].img} alt={PROMOS[0].title} className="aspect-[16/7] rounded-sm" />
                      <p className="text-[14px] font-bold text-gray-900 leading-snug mt-2.5 group-hover:text-red-600 transition-colors">
                        {PROMOS[0].title}
                      </p>
                    </Link>
                  </div>
                </aside>
              </div>
            )}

            {/* ── Danh sách bài + cột khuyến mãi ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
              <div className="lg:col-span-8">
                {listItems.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6">Hết bài viết.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {listItems.map((n) => (
                      <Link
                        key={n._id}
                        href={`/tintuc/${n.slug}`}
                        className="group flex gap-5 py-5 first:pt-0"
                      >
                        <Thumb src={n.thumbnail} alt={n.title} className="w-[220px] sm:w-[260px] aspect-[16/9] rounded-sm shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[16.5px] font-bold text-gray-900 leading-snug group-hover:text-red-600 transition-colors line-clamp-3">
                            {n.title}
                          </h3>
                          {n.summary && (
                            <p className="text-[13px] text-gray-500 mt-1.5 line-clamp-2 leading-relaxed hidden sm:block">
                              {n.summary}
                            </p>
                          )}
                          <div className="mt-2"><Meta n={n} showViews /></div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      disabled={page <= 1}
                      onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="w-9 h-9 rounded-sm border border-gray-200 bg-white flex items-center justify-center text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:border-red-400 hover:text-red-500 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500 px-2 tabular-nums">
                      Trang {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      disabled={page >= pagination.totalPages}
                      onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="w-9 h-9 rounded-sm border border-gray-200 bg-white flex items-center justify-center text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:border-red-400 hover:text-red-500 transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Cột khuyến mãi bên phải danh sách */}
              <aside className="lg:col-span-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {PROMOS.slice(1).map((p) => (
                    <Link key={p.img} href={p.href} className="group block">
                      <Thumb src={p.img} alt={p.title} className="aspect-[16/8] rounded-sm" />
                      <p className="text-[13px] font-semibold text-gray-800 leading-snug mt-2 group-hover:text-red-600 transition-colors">
                        {p.title}
                      </p>
                    </Link>
                  ))}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
