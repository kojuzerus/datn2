"use client";

import { useState } from "react";
import Link from "next/link";
import { Smartphone, Laptop, Sparkles, Cpu, Calendar, ArrowRight } from "lucide-react";

const CATEGORIES = ["Tất cả", "Điện thoại", "Laptop", "Thủ thuật", "Công nghệ"];

const featured = {
  title: "iPhone 17 Pro Max: Có gì mới so với thế hệ trước?",
  excerpt:
    "Apple tiếp tục nâng cấp camera, hiệu năng chip A19 Pro và thời lượng pin trên iPhone 17 Pro Max. Cùng SMARTHUB điểm qua những thay đổi đáng chú ý nhất.",
  category: "Điện thoại",
  date: "20/06/2026",
  icon: Smartphone,
};

const articles = [
  { title: "So sánh MacBook Air M4 và Dell XPS 15: Nên chọn máy nào?", category: "Laptop", date: "18/06/2026", icon: Laptop },
  { title: "5 mẹo tăng thời lượng pin điện thoại Android hiệu quả", category: "Thủ thuật", date: "15/06/2026", icon: Sparkles },
  { title: "Xu hướng chip AI trên laptop 2026: Những điều cần biết", category: "Công nghệ", date: "10/06/2026", icon: Cpu },
  { title: "Đánh giá Samsung Galaxy S25 Ultra sau 1 tháng sử dụng", category: "Điện thoại", date: "05/06/2026", icon: Smartphone },
  { title: "Laptop gaming dưới 25 triệu: Lựa chọn nào tốt nhất?", category: "Laptop", date: "01/06/2026", icon: Laptop },
  { title: "Cách vệ sinh laptop đúng cách để tăng độ bền", category: "Thủ thuật", date: "28/05/2026", icon: Sparkles },
];

export default function Page() {
  const [cat, setCat] = useState("Tất cả");
  const filtered = cat === "Tất cả" ? articles : articles.filter((a) => a.category === cat);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">Tin tức & Công nghệ</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Cập nhật công nghệ mới nhất</h1>

        {/* Featured */}
        <Link
          href="/sanpham"
          className="mt-8 grid gap-0 overflow-hidden rounded-2xl bg-slate-900 text-white shadow-lg transition hover:shadow-xl sm:grid-cols-2"
        >
          <div className="flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800 p-10">
            <featured.icon className="h-24 w-24 text-white/80" />
          </div>
          <div className="flex flex-col justify-center p-8">
            <span className="inline-flex w-fit rounded-full bg-red-600 px-3 py-1 text-xs font-semibold">{featured.category}</span>
            <h2 className="mt-4 text-xl font-bold leading-snug sm:text-2xl">{featured.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{featured.excerpt}</p>
            <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {featured.date}</span>
              <span className="flex items-center gap-1 font-medium text-red-400">
                Đọc tiếp <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </Link>

        {/* Category filter */}
        <div className="mt-10 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                cat === c ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Article grid */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Link
              key={a.title}
              href="/sanpham"
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 transition hover:shadow-md"
            >
              <div className="flex h-32 items-center justify-center bg-slate-50">
                <a.icon className="h-10 w-10 text-red-500 transition group-hover:scale-110" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-red-600">{a.category}</span>
                <h3 className="mt-2 flex-1 text-sm font-semibold leading-snug text-slate-900">{a.title}</h3>
                <span className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="h-3 w-3" /> {a.date}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
