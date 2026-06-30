"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Calendar, ChevronRight, ArrowLeft } from "lucide-react";
import { ARTICLES, getArticleById } from "../data";

export default function ArticleDetailPage() {
  const params = useParams();
  const id = parseInt(typeof params.id === "string" ? params.id : "");
  const article = getArticleById(id);

  if (!article) {
    return (
      <div className="bg-white min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900">Không tìm thấy bài viết</p>
          <Link href="/tin-tuc" className="mt-4 inline-flex items-center gap-1.5 text-sm text-red-600 font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" /> Quay lại Tin tức
          </Link>
        </div>
      </div>
    );
  }

  const related = ARTICLES.filter((a) => a.id !== article.id).slice(0, 3);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-6 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Link href="/" className="hover:text-red-600 no-underline">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/tin-tuc" className="hover:text-red-600 no-underline">Tin tức</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600 truncate max-w-[200px]">{article.tieu_de}</span>
        </div>

        <span className="mt-5 inline-flex w-fit rounded-full bg-red-50 text-red-600 px-3 py-1 text-xs font-semibold">
          {article.tag}
        </span>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
          {article.tieu_de}
        </h1>
        <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-400">
          <Calendar className="w-3.5 h-3.5" /> {article.ngay}
        </div>

        <div className="mt-6 rounded-2xl overflow-hidden">
          <img src={article.hinhAnh} alt={article.tieu_de} className="w-full h-[320px] sm:h-[420px] object-cover" />
        </div>

        <div className="mt-8 space-y-4">
          {article.body.map((p, i) => (
            <p key={i} className="text-[15px] text-slate-700 leading-7">{p}</p>
          ))}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-14 border-t border-gray-100 pt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Bài viết liên quan</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((a) => (
                <Link
                  key={a.id}
                  href={`/tin-tuc/${a.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 transition hover:shadow-md no-underline"
                >
                  <div className="h-28 overflow-hidden">
                    <img src={a.hinhAnh} alt={a.tieu_de} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600">{a.tag}</span>
                    <h3 className="mt-1.5 text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{a.tieu_de}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Link href="/tin-tuc" className="mt-10 inline-flex items-center gap-1.5 text-sm text-red-600 font-medium hover:underline no-underline">
          <ArrowLeft className="w-4 h-4" /> Xem tất cả tin tức
        </Link>
      </div>
    </div>
  );
}
