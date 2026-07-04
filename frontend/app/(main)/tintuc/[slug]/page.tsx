"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Newspaper, Eye, Calendar, User, Home, ChevronRight, ArrowLeft, ImageIcon,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface NewsDetail {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string;
  summary: string;
  content: string;
  author: string;
  views: number;
  createdAt: string;
}

interface RelatedNews {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string;
  summary: string;
  createdAt: string;
}

function fmtDate(s: string) {
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function TinTucChiTietPage() {
  const params = useParams();
  const slug   = params?.slug as string;

  const [news, setNews]       = useState<NewsDetail | null>(null);
  const [related, setRelated] = useState<RelatedNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API_BASE}/api/news/${slug}`);
        const json = await res.json();
        if (json.success) {
          setNews(json.data);
          setRelated(json.related || []);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-4">
          <div className="h-3 w-40 bg-gray-200 rounded" />
          <div className="h-8 w-full bg-gray-200 rounded" />
          <div className="h-8 w-2/3 bg-gray-200 rounded" />
          <div className="h-3 w-52 bg-gray-200 rounded" />
          <div className="aspect-[16/9] bg-gray-200 rounded-sm" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (notFound || !news) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-gray-800 mb-1.5">Không tìm thấy bài viết</h1>
          <p className="text-sm text-gray-400 mb-6">Bài viết không tồn tại hoặc đã bị gỡ.</p>
          <Link
            href="/tintuc"
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-sm text-sm font-semibold transition no-underline"
          >
            <ArrowLeft className="w-4 h-4" /> Về trang tin tức
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-1.5 text-[12.5px] text-gray-400">
            <Link href="/" className="hover:text-red-500 transition flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> Trang chủ
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <Link href="/tintuc" className="hover:text-red-500 transition">Tin tức</Link>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="text-gray-700 font-medium truncate max-w-[280px]">{news.title}</span>
          </div>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-100 rounded-sm p-6 sm:p-8">
          <h1 className="text-2xl sm:text-[28px] font-bold text-gray-800 leading-snug mb-4">
            {news.title}
          </h1>

          <div className="flex items-center gap-4 text-[12.5px] text-gray-400 pb-5 border-b border-gray-100 flex-wrap">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> {news.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {fmtDate(news.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> {news.views} lượt xem
            </span>
          </div>

          {news.summary && (
            <p className="text-[15px] text-gray-600 font-medium leading-relaxed mt-5 pl-4 border-l-[3px] border-red-400">
              {news.summary}
            </p>
          )}

          {news.thumbnail && (
            <div className="mt-6 rounded-sm overflow-hidden bg-gray-100">
              <img src={news.thumbnail} alt={news.title} className="w-full object-cover" />
            </div>
          )}

          <div
            className="news-content mt-6 text-[15px] text-gray-700 leading-relaxed
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-800 [&_h2]:mt-8 [&_h2]:mb-3
              [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gray-800 [&_h3]:mt-6 [&_h3]:mb-2
              [&_p]:mb-4 [&_a]:text-red-500 [&_a]:underline
              [&_img]:rounded-sm [&_img]:my-4 [&_img]:max-w-full
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
              [&_li]:mb-1.5 [&_blockquote]:border-l-[3px] [&_blockquote]:border-gray-200 [&_blockquote]:pl-4 [&_blockquote]:text-gray-500 [&_blockquote]:italic"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />
        </div>

        {/* Bài viết khác */}
        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="text-[17px] font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Newspaper className="w-4.5 h-4.5 text-red-500" />
              Bài viết khác
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((r) => (
                <Link
                  key={r._id}
                  href={`/tintuc/${r.slug}`}
                  className="group bg-white border border-gray-100 rounded-sm overflow-hidden hover:shadow-md hover:border-gray-200 transition-all flex no-underline"
                >
                  <div className="w-[110px] shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {r.thumbnail ? (
                      <img src={r.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <div className="p-3.5 min-w-0">
                    <h3 className="text-[13.5px] font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-[11.5px] text-gray-400 mt-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {fmtDate(r.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/tintuc"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition no-underline"
          >
            <ArrowLeft className="w-4 h-4" /> Xem tất cả tin tức
          </Link>
        </div>
      </article>
    </div>
  );
}
