"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Newspaper, Search, Eye, Calendar, ChevronLeft, ChevronRight,
  Home, ChevronRight as Crumb, ImageIcon,
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

function fmtDate(s: string) {
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-sm overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-gray-100" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="h-3 w-1/2 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function TinTucPage() {
  const [news, setNews]             = useState<NewsItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 9, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "9", ...(search && { search }) });
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

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* Breadcrumb + heading */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center gap-1.5 text-[12.5px] text-gray-400 mb-3">
            <Link href="/" className="hover:text-red-500 transition flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> Trang chủ
            </Link>
            <Crumb className="w-3 h-3 text-gray-300" />
            <span className="text-gray-700 font-medium">Tin tức</span>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
                <Newspaper className="w-6 h-6 text-red-500" />
                Tin tức công nghệ
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Cập nhật xu hướng, đánh giá và mẹo hay về thiết bị điện tử
              </p>
            </div>
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {news.map((n) => (
                <Link
                  key={n._id}
                  href={`/tintuc/${n.slug}`}
                  className="group bg-white border border-gray-100 rounded-sm overflow-hidden hover:shadow-md hover:border-gray-200 transition-all no-underline"
                >
                  <div className="aspect-[16/9] bg-gray-100 overflow-hidden flex items-center justify-center">
                    {n.thumbnail ? (
                      <img
                        src={n.thumbnail}
                        alt={n.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3 text-[11.5px] text-gray-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {fmtDate(n.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {n.views} lượt xem
                      </span>
                    </div>
                    <h2 className="text-[15px] font-bold text-gray-800 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
                      {n.title}
                    </h2>
                    {n.summary && (
                      <p className="text-[13px] text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{n.summary}</p>
                    )}
                    <p className="text-[12px] text-gray-400 mt-3">Bởi {n.author}</p>
                  </div>
                </Link>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
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
          </>
        )}
      </div>
    </div>
  );
}
