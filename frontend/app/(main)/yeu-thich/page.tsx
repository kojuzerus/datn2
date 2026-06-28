"use client";

import Link from "next/link";
import { Heart, ChevronRight, Home, X, Star } from "lucide-react";
import { useFavorites } from "../../components/favoritesContext";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

export default function YeuThichPage() {
  const { items, removeItem } = useFavorites();

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12.5px] text-gray-400 mb-4">
        <Link href="/" className="flex items-center gap-1 hover:text-red-500 transition-colors">
          <Home className="w-3 h-3" /> Trang chủ
        </Link>
        <ChevronRight className="w-3 h-3 text-gray-300" />
        <span className="text-gray-700 font-medium">Sản phẩm yêu thích</span>
      </nav>

      <div className="flex items-center gap-2 mb-5">
        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
        <h1 className="text-lg font-bold text-gray-800">Sản phẩm yêu thích</h1>
        <span className="text-sm text-gray-400">({items.length})</span>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-20 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-gray-300" />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-gray-700">Chưa có sản phẩm yêu thích</p>
            <p className="text-[13px] text-gray-400 mt-1">Bấm vào icon tim trên sản phẩm để lưu vào đây</p>
          </div>
          <Link
            href="/sanpham"
            className="mt-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((p) => (
            <div key={p.id} className="group flex flex-col h-full">
              <Link href={`/sanpham/${p.slug}`} className="flex-1 block">
                <div className="bg-white border border-gray-100 rounded-t-2xl overflow-hidden hover:shadow-lg hover:border-red-100 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative">
                  {p.giamGia > 0 && (
                    <span className="absolute top-3 right-12 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
                      -{p.giamGia}%
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeItem(p.id); }}
                    title="Bỏ yêu thích"
                    className="absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="bg-gray-50 flex items-center justify-center h-48 overflow-hidden">
                    <img
                      src={p.thumbnail || "https://placehold.co/400x300?text=No+Image"}
                      alt={p.ten}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-1 gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-red-500">{p.thuongHieu}</p>
                    <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 flex-1">{p.ten}</h3>
                    <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 mt-auto">
                      <div>
                        <p className="font-bold text-gray-900 text-[15px]">{fmt(p.giaSale ?? p.gia)}</p>
                        {p.giamGia > 0 && (
                          <p className="text-xs text-gray-400 line-through">{fmt(p.gia)}</p>
                        )}
                      </div>
                      {p.danhGia > 0 && (
                        <div className="flex items-center gap-1 bg-amber-50 rounded-full px-2 py-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold text-amber-700">{p.danhGia.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
              <button
                onClick={() => removeItem(p.id)}
                className="flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium rounded-b-2xl border border-t-0 bg-white text-gray-500 border-gray-100 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <Heart className="w-3 h-3" />
                Bỏ yêu thích
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
