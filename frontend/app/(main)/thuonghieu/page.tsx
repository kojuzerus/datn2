"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag, ChevronRight } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Brand {
  brand_id: number;
  brand_name: string;
  logo: string;
}

export default function ThuongHieuPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/brands`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setBrands(j.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white min-h-[60vh]">
      <div className="mx-auto max-w-6xl px-6 py-10">

        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:text-red-600 no-underline">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600">Thương hiệu</span>
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">Đối tác chính hãng</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Tất cả thương hiệu</h1>

        {loading ? (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <p className="mt-10 text-center text-gray-400">Chưa có thương hiệu nào</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {brands.map((b) => (
              <Link
                key={b.brand_id}
                href={`/sanpham?thuong-hieu=${b.brand_id}`}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-red-100 transition-all no-underline"
              >
                <div className="w-16 h-16 flex items-center justify-center">
                  {b.logo
                    ? <img src={b.logo} alt={b.brand_name} className="max-w-full max-h-full object-contain" />
                    : <Tag className="w-8 h-8 text-gray-300" />}
                </div>
                <span className="text-sm font-semibold text-slate-800 text-center">{b.brand_name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
