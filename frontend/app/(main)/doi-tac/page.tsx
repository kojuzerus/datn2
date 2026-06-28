"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Handshake, ShieldCheck, Globe2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Brand { brand_id: number; brand_name: string; logo?: string; }

const stats = [
  { value: "24+", label: "Thương hiệu", icon: Globe2 },
  { value: "100%", label: "Hàng chính hãng", icon: ShieldCheck },
  { value: "6 năm", label: "Hợp tác trung bình", icon: Handshake },
];

export default function Page() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/brands`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setBrands(j.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="mx-auto max-w-4xl px-6 pt-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">Đối tác thương hiệu</p>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
          Đồng hành cùng những thương hiệu công nghệ hàng đầu
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          SMARTHUB tự hào là đại lý phân phối chính hãng, hợp tác trực tiếp với các nhà sản xuất để đảm bảo
          mỗi sản phẩm đến tay khách hàng đều chính hãng, đầy đủ chế độ bảo hành.
        </p>
      </div>

      {/* Stats */}
      <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-4 px-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-100 p-5 text-center">
            <s.icon className="mx-auto h-6 w-6 text-red-600" />
            <p className="mt-2 text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="mt-1 text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Logo wall */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        {loading ? (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {brands.map((b) => (
              <div
                key={b.brand_id}
                className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-gray-100 bg-white p-5 text-center transition hover:-translate-y-1 hover:border-red-200 hover:shadow-lg"
              >
                {b.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logo} alt={b.brand_name} className="h-9 w-9 object-contain transition group-hover:scale-110" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-xs font-bold text-white">
                    {b.brand_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-slate-700">{b.brand_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-slate-900">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 py-14 text-center text-white">
          <Handshake className="h-8 w-8 text-red-400" />
          <h2 className="text-2xl font-bold sm:text-3xl">Bạn muốn trở thành đối tác của SMARTHUB?</h2>
          <p className="max-w-xl text-sm text-slate-300">
            Chúng tôi luôn chào đón cơ hội hợp tác phân phối với các thương hiệu công nghệ uy tín.
          </p>
          <Link
            href="/lien-he"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Liên hệ hợp tác
          </Link>
        </div>
      </div>
    </div>
  );
}
