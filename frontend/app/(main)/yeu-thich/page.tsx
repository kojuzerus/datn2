'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Heart, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useFavorites } from '../../components/favoritesContext';
import { useCart } from '../../hooks/useCart';
import { flyToCart } from '../../utils/flyToCart';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

function FavoriteCard({ p, onRemove }: { p: ReturnType<typeof useFavorites>['items'][0]; onRemove: (id: number) => void }) {
  const { addToCart, adding } = useCart();
  const imgRef = useRef<HTMLImageElement>(null);

  const handleAddToCart = async () => {
    if (imgRef.current && p.thumbnail) {
      flyToCart(p.thumbnail, imgRef.current.getBoundingClientRect());
    }
    await addToCart({
      productId: String(p.id),
      tenSanPham: p.ten,
      hinhAnh: p.thumbnail,
      gia: p.giaSale ?? p.gia,
      soLuong: 1,
      variant: '',
    });
  };

  const displayPrice = p.giaSale ?? p.gia;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <Link href={`/sanpham/${p.slug}`} className="block relative">
        <img
          ref={imgRef}
          src={p.thumbnail || 'https://placehold.co/300x300?text=No+Image'}
          alt={p.ten}
          className="w-full aspect-square object-contain p-3 hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {p.giamGia > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{p.giamGia}%
          </span>
        )}
      </Link>
      <div className="px-3 pb-3 flex flex-col flex-1 gap-2">
        <Link href={`/sanpham/${p.slug}`}>
          <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug hover:text-red-500 transition-colors">{p.ten}</p>
        </Link>
        <div>
          <p className="text-red-600 font-bold text-[15px]">{fmt(displayPrice)}</p>
          {p.giamGia > 0 && <p className="text-gray-400 text-xs line-through">{fmt(p.gia)}</p>}
        </div>
        <div className="flex gap-2 mt-auto">
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[11px] font-semibold transition-colors disabled:opacity-60"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Thêm vào giỏ
          </button>
          <button
            onClick={() => onRemove(p.id)}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  const { items, removeItem } = useFavorites();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Trang chủ
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              Sản phẩm yêu thích
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{items.length} sản phẩm</p>
          </div>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">Chưa có sản phẩm yêu thích</p>
            <p className="text-gray-400 text-sm mt-1">Bấm vào biểu tượng ❤️ trên sản phẩm để lưu vào đây</p>
            <Link
              href="/sanpham"
              className="inline-block mt-6 px-6 py-2.5 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        )}

        {/* Product grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((p) => (
              <FavoriteCard key={p.id} p={p} onRemove={removeItem} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
