'use client';

import { useEffect, useState } from 'react';
import { useComparison } from '../../components/comparisonContext';
import Link from 'next/link';
import {
  Star, ShoppingCart, Repeat, Plus, Home, ChevronRight, X,
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

interface Variant {
  variant_id: number;
  color: string;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
}

interface ProductDetail {
  id: number;
  ten: string;
  slug: string;
  thuongHieu: string;
  thumbnail: string;
  gia: number;
  giaSale: number | null;
  giamGia: number;
  danhGia: number;
  luotDanhGia: number;
  luotBan: number;
  categoryName: string;
  warranty: string;
  variants: Variant[];
}

const COMPARE_ROWS: { label: string; getValue: (p: ProductDetail) => string }[] = [
  { label: 'Thương hiệu',  getValue: p => p.thuongHieu },
  { label: 'Danh mục',     getValue: p => p.categoryName },
  { label: 'Bảo hành',     getValue: p => p.warranty || 'Theo chính hãng' },
  { label: 'Đã bán',       getValue: p => `${p.luotBan.toLocaleString('vi-VN')} sản phẩm` },
  { label: 'Phiên bản',    getValue: p => p.variants?.length ? p.variants.map(v => v.color).join(', ') : 'Một phiên bản' },
  { label: 'Lượt đánh giá', getValue: p => `${p.luotDanhGia || 0} đánh giá` },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function ComparisonPage() {
  const { items, removeItem, clearItems } = useComparison();
  const [products, setProducts] = useState<(ProductDetail | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, adding } = useCart();

  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      items.map(item =>
        fetch(`${API_BASE}/api/products/${item.slug}`)
          .then(r => r.json())
          .then(j => (j.success ? j.data as ProductDetail : null))
          .catch(() => null)
      )
    ).then(results => {
      setProducts(results);
      setLoading(false);
    });
  }, [items]);

  const colCount = items.length + (items.length < 3 ? 1 : 0);

  return (
    <div className="max-w-screen-xl mx-auto pb-24">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
        <Link href="/" className="hover:text-red-600 transition-colors">
          <Home className="w-3.5 h-3.5" />
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-800 font-medium">So sánh sản phẩm</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Repeat className="w-5 h-5 text-red-600" />
          So sánh sản phẩm
        </h1>
        {items.length > 0 && (
          <button
            onClick={clearItems}
            className="text-sm text-gray-400 hover:text-red-600 transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Repeat className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-semibold mb-2">Chưa có sản phẩm nào để so sánh</p>
          <p className="text-gray-400 text-sm mb-6">
            Nhấn nút &ldquo;So sánh&rdquo; trên trang danh sách hoặc chi tiết sản phẩm để thêm
          </p>
          <Link
            href="/sanpham"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Xem sản phẩm
          </Link>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="animate-pulse flex gap-6">
            {Array.from({ length: items.length }).map((_, i) => (
              <div key={i} className="flex-1 space-y-3">
                <div className="h-36 bg-gray-100 rounded-xl" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: `${colCount * 200 + 160}px` }}>
              {/* ── Product headers ── */}
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-40 p-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Thông số
                  </th>
                  {products.map((product, i) => (
                    <th key={i} className="p-5 text-center min-w-[220px]">
                      {product ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative group/img">
                            <div className="w-32 h-32 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100">
                              <img
                                src={product.thumbnail}
                                alt={product.ten}
                                className="w-full h-full object-contain p-2"
                              />
                            </div>
                            <button
                              onClick={() => removeItem(product.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-500 rounded-full flex items-center justify-center text-gray-400 transition-all shadow-sm"
                              title="Xóa"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <Link
                            href={`/sanpham/${product.slug}`}
                            className="text-sm font-semibold text-gray-800 hover:text-red-600 transition-colors text-center leading-snug"
                          >
                            {product.ten}
                          </Link>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-red-500">
                            {product.thuongHieu}
                          </p>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm py-8">Không tải được</div>
                      )}
                    </th>
                  ))}
                  {/* Add slot */}
                  {items.length < 3 && (
                    <th className="p-5 min-w-[200px]">
                      <Link
                        href="/sanpham"
                        className="flex flex-col items-center gap-3 text-gray-400 hover:text-red-600 transition-colors group/add"
                      >
                        <div className="w-32 h-32 border-2 border-dashed border-gray-200 group-hover/add:border-red-300 rounded-2xl flex items-center justify-center transition-colors">
                          <Plus className="w-8 h-8" />
                        </div>
                        <span className="text-xs font-medium">Thêm sản phẩm</span>
                      </Link>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {/* ── Giá bán ── */}
                <tr className="bg-red-50/60 border-b border-gray-100">
                  <td className="p-5 text-sm font-semibold text-gray-700">Giá bán</td>
                  {products.map((product, i) => (
                    <td key={i} className="p-5 text-center">
                      {product ? (
                        <div className="flex flex-col items-center gap-1">
                          <p className="text-xl font-bold text-red-600">
                            {fmt(product.giaSale ?? product.gia)}
                          </p>
                          {product.giamGia > 0 && (
                            <>
                              <p className="text-xs text-gray-400 line-through">{fmt(product.gia)}</p>
                              <span className="inline-block bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                -{product.giamGia}%
                              </span>
                            </>
                          )}
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                  ))}
                  {items.length < 3 && <td />}
                </tr>

                {/* ── Đánh giá ── */}
                <tr className="border-b border-gray-100">
                  <td className="p-5 text-sm font-semibold text-gray-700">Đánh giá</td>
                  {products.map((product, i) => (
                    <td key={i} className="p-5 text-center">
                      {product ? (
                        <div className="flex flex-col items-center gap-1">
                          <Stars rating={product.danhGia} />
                          <span className="text-xs text-gray-500 font-medium">
                            {product.danhGia.toFixed(1)} / 5
                          </span>
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                  ))}
                  {items.length < 3 && <td />}
                </tr>

                {/* ── Other rows ── */}
                {COMPARE_ROWS.map((row, ri) => (
                  <tr key={ri} className={`border-b border-gray-100 ${ri % 2 === 0 ? 'bg-gray-50/40' : ''}`}>
                    <td className="p-5 text-sm font-semibold text-gray-700">{row.label}</td>
                    {products.map((product, i) => (
                      <td key={i} className="p-5 text-center text-sm text-gray-700">
                        {product ? row.getValue(product) : <span className="text-gray-400">—</span>}
                      </td>
                    ))}
                    {items.length < 3 && <td />}
                  </tr>
                ))}

                {/* ── Action row ── */}
                <tr>
                  <td className="p-5 text-sm font-semibold text-gray-700">Hành động</td>
                  {products.map((product, i) => (
                    <td key={i} className="p-5 text-center">
                      {product && (
                        <div className="flex flex-col gap-2">
                          <button
                            disabled={adding}
                            onClick={() => {
                              const v = product.variants?.[0];
                              addToCart({
                                productId: String(product.id),
                                tenSanPham: product.ten,
                                hinhAnh: product.thumbnail,
                                gia: v?.sale_price ?? v?.price ?? product.giaSale ?? product.gia,
                                soLuong: 1,
                                variant: v?.color ?? '',
                              });
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Thêm vào giỏ
                          </button>
                          <Link
                            href={`/sanpham/${product.slug}`}
                            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors"
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      )}
                    </td>
                  ))}
                  {items.length < 3 && <td />}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {items.length > 0 && items.length < 2 && (
        <p className="text-center text-sm text-gray-400 mt-4">
          Thêm ít nhất 2 sản phẩm để bắt đầu so sánh
        </p>
      )}
    </div>
  );
}
