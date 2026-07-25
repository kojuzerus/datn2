"use client";

import { useState } from "react";
import Link from "next/link";
import { ARTICLES } from "./data";
import { Calendar, ArrowRight, Tag } from "lucide-react";

const CATEGORIES = ["Tất cả", "Đánh giá", "So sánh", "Tin tức", "Hướng dẫn", "Kinh nghiệm", "Xu hướng"];

const TAG_COLOR: Record<string, string> = {
  "Đánh giá":  "bg-red-600 text-white",
  "So sánh":   "bg-blue-600 text-white",
  "Tin tức":   "bg-emerald-600 text-white",
  "Hướng dẫn": "bg-amber-500 text-white",
  "Kinh nghiệm":"bg-purple-600 text-white",
  "Xu hướng":  "bg-cyan-600 text-white",
};

export default function TinTucPage() {
  const [cat, setCat] = useState("Tất cả");
  const filtered = cat === "Tất cả" ? ARTICLES : ARTICLES.filter((a) => a.tag === cat);
  const [featured, ...rest] = filtered;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 bg-red-600 rounded-full" />
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">SmartHub Blog</p>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Tin tức & Công nghệ</h1>
          <p className="mt-1 text-sm text-gray-500">Cập nhật nhanh nhất về thiết bị, thủ thuật và xu hướng công nghệ</p>
        </div>

        {/* Category filter — scrollable */}
        <div className="max-w-6xl mx-auto px-6 pb-0">
          <div className="flex items-center gap-1 overflow-x-auto pb-0" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  cat === c
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {!featured ? (
          <p className="py-20 text-center text-gray-400">Không có bài viết nào trong danh mục này.</p>
        ) : (
          <>
            {/* ── Featured article ── */}
            <Link href={`/tin-tuc/${featured.id}`} className="group block mb-10">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                {/* Image */}
                <div className="lg:col-span-3 relative overflow-hidden" style={{ minHeight: 280 }}>
                  <img
                    src={featured.hinhAnh}
                    alt={featured.tieu_de}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  {/* Tag overlay */}
                  <span className={`absolute top-4 left-4 text-xs font-bold px-2.5 py-1 rounded ${TAG_COLOR[featured.tag] ?? "bg-gray-700 text-white"}`}>
                    {featured.tag}
                  </span>
                </div>
                {/* Text */}
                <div className="lg:col-span-2 flex flex-col justify-center p-7 lg:p-9">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-red-600 mb-3">Bài nổi bật</p>
                  <h2 className="text-xl font-bold text-gray-900 leading-snug mb-3 group-hover:text-red-700 transition-colors lg:text-2xl">
                    {featured.tieu_de}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-3">{featured.tom_tat}</p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5" /> {featured.ngay}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-red-600 group-hover:gap-2 transition-all">
                      Đọc tiếp <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* ── Article grid ── */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((article) => (
                  <Link
                    key={article.id}
                    href={`/tin-tuc/${article.id}`}
                    className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
                  >
                    {/* Thumbnail */}
                    <div className="relative overflow-hidden" style={{ paddingTop: "56.25%" /* 16:9 */ }}>
                      <img
                        src={article.hinhAnh}
                        alt={article.tieu_de}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                      <span className={`absolute top-3 left-3 text-[11px] font-bold px-2 py-0.5 rounded ${TAG_COLOR[article.tag] ?? "bg-gray-700 text-white"}`}>
                        {article.tag}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-5">
                      <h3 className="text-sm font-bold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-red-700 transition-colors">
                        {article.tieu_de}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1 mb-4">
                        {article.tom_tat}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                          <Calendar className="w-3 h-3" /> {article.ngay}
                        </span>
                        <span className="text-[11px] font-semibold text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          Đọc <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
