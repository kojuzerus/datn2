"use client";

import { useMemo, useState } from "react";
import { MapPin, Phone, Clock, Store, Search } from "lucide-react";

const stores = [
  { city: "Hà Nội", address: "543 Nguyễn Trãi, Thanh Liệt, Hà Nội", phone: "024.7303.0119", hours: "8:00 - 21:30" },
  { city: "Hà Nội", address: "12 Cầu Giấy, Cầu Giấy, Hà Nội", phone: "024.7303.0120", hours: "8:00 - 21:30" },
  { city: "Hà Nội", address: "76 Xã Đàn, Đống Đa, Hà Nội", phone: "024.7303.0125", hours: "8:00 - 21:30" },
  { city: "TP. Hồ Chí Minh", address: "88 Nguyễn Huệ, Quận 1, TP. HCM", phone: "028.7303.0121", hours: "8:00 - 21:30" },
  { city: "TP. Hồ Chí Minh", address: "215 Cộng Hòa, Tân Bình, TP. HCM", phone: "028.7303.0122", hours: "8:00 - 21:30" },
  { city: "Đà Nẵng", address: "30 Nguyễn Văn Linh, Hải Châu, Đà Nẵng", phone: "0236.730.0123", hours: "8:00 - 21:00" },
  { city: "Cần Thơ", address: "99 Đường 3/2, Ninh Kiều, Cần Thơ", phone: "0292.730.0124", hours: "8:00 - 21:00" },
  { city: "Hải Phòng", address: "20 Lạch Tray, Ngô Quyền, Hải Phòng", phone: "0225.730.0126", hours: "8:00 - 21:00" },
];

const cities = ["Tất cả", ...Array.from(new Set(stores.map((s) => s.city)))];

export default function Page() {
  const [city, setCity] = useState("Tất cả");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return stores.filter((s) => {
      const matchCity = city === "Tất cả" || s.city === city;
      const matchQuery = !query.trim() || s.address.toLowerCase().includes(query.trim().toLowerCase());
      return matchCity && matchQuery;
    });
  }, [city, query]);

  return (
    <div className="bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-400">
            <Store className="h-4 w-4" /> Hệ thống cửa hàng
          </div>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Hơn 50 cửa hàng trên toàn quốc</h1>
          <p className="mt-3 max-w-xl text-sm text-slate-300 sm:text-base">
            Tìm cửa hàng SMARTHUB gần bạn để trải nghiệm sản phẩm trực tiếp và nhận hỗ trợ kỹ thuật nhanh chóng.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo địa chỉ, quận..."
                className="w-full rounded-full border border-slate-700 bg-slate-800 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {cities.map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  city === c ? "bg-red-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Store list */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm text-slate-500">{filtered.length} cửa hàng phù hợp</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <div key={i} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">{s.city}</span>
              </div>
              <div className="mt-4 flex items-start gap-2.5 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span className="text-slate-700">{s.address}</span>
              </div>
              <div className="mt-2.5 flex items-center gap-2.5 text-sm text-slate-500">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                {s.phone}
              </div>
              <div className="mt-2.5 flex items-center gap-2.5 text-sm text-slate-500">
                <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                {s.hours}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-slate-400">
              Không tìm thấy cửa hàng phù hợp.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
