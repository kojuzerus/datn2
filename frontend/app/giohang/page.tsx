'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface CartItem {
  _id: string;
  productId: string;
  tenSanPham: string;
  hinhAnh: string;
  gia: number;
  soLuong: number;
  variant: string;
}

function formatPrice(n: number) {
  return n.toLocaleString('vi-VN') + '₫';
}

export default function GioHangPage() {
  const router = useRouter();
  const [items, setItems]     = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('smarthub_token') : null;

  const fetchCart = async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setItems(data.cart.items);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (itemId: string, soLuong: number) => {
    if (soLuong < 1) return;
    setUpdating(itemId);
    try {
      const res = await fetch(`${API_URL}/api/cart/item/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ soLuong }),
      });
      const data = await res.json();
      if (data.success) setItems(data.cart.items);
    } catch {}
    setUpdating(null);
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      const res = await fetch(`${API_URL}/api/cart/item/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setItems(data.cart.items);
    } catch {}
    setUpdating(null);
  };

  const clearCart = async () => {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) return;
    try {
      await fetch(`${API_URL}/api/cart/clear`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems([]);
    } catch {}
  };

  const tongTien  = items.reduce((s, i) => s + i.gia * i.soLuong, 0);
  const tongSP    = items.reduce((s, i) => s + i.soLuong, 0);
  const phiGH     = tongTien >= 500000 ? 0 : 30000;
  const tongThanhToan = tongTien + phiGH;

  // Chưa đăng nhập
  if (!token && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Vui lòng đăng nhập</h2>
          <p className="text-gray-500 text-sm mb-6">Đăng nhập để xem giỏ hàng của bạn</p>
          <Link href="/dang-nhap"
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-red-500 transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-800">
            Giỏ hàng {items.length > 0 && <span className="text-red-500">({tongSP})</span>}
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : items.length === 0 ? (
          /* Giỏ hàng trống */
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🛒</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-3">Giỏ hàng trống</h2>
            <p className="text-gray-400 mb-8">Hãy thêm sản phẩm vào giỏ hàng nhé!</p>
            <Link href="/sanpham"
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-semibold transition">
              Mua sắm ngay
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Danh sách sản phẩm */}
            <div className="lg:col-span-2 space-y-3">
              {/* Header actions */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">{items.length} sản phẩm trong giỏ</p>
                <button onClick={clearCart}
                  className="text-sm text-red-400 hover:text-red-600 hover:underline transition">
                  Xóa tất cả
                </button>
              </div>

              {items.map(item => (
                <div key={item._id}
                  className={`bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-gray-100 transition ${updating === item._id ? 'opacity-60' : ''}`}>
                  {/* Ảnh */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {item.hinhAnh ? (
                      <img src={item.hinhAnh} alt={item.tenSanPham}
                        className="w-full h-full object-cover"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                    )}
                  </div>

                  {/* Thông tin */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">
                      {item.tenSanPham}
                    </h3>
                    {item.variant && (
                      <p className="text-xs text-gray-400 mb-2">Phân loại: {item.variant}</p>
                    )}
                    <p className="text-red-500 font-bold text-base">
                      {formatPrice(item.gia)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end justify-between shrink-0">
                    {/* Nút xóa */}
                    <button
                      onClick={() => removeItem(item._id)}
                      disabled={updating === item._id}
                      className="text-gray-300 hover:text-red-400 transition"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                    </button>

                    {/* Tăng giảm số lượng */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200">
                      <button
                        onClick={() => updateQty(item._id, item.soLuong - 1)}
                        disabled={updating === item._id || item.soLuong <= 1}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 disabled:opacity-30 transition font-bold text-lg"
                      >−</button>
                      <span className="w-8 text-center text-sm font-semibold text-gray-800">
                        {item.soLuong}
                      </span>
                      <button
                        onClick={() => updateQty(item._id, item.soLuong + 1)}
                        disabled={updating === item._id}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 transition font-bold text-lg"
                      >+</button>
                    </div>

                    {/* Tổng tiền item */}
                    <p className="text-xs font-medium text-gray-500">
                      {formatPrice(item.gia * item.soLuong)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tóm tắt đơn hàng */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                <h2 className="font-bold text-gray-800 text-lg mb-5">Tóm tắt đơn hàng</h2>

                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tạm tính ({tongSP} sản phẩm)</span>
                    <span>{formatPrice(tongTien)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Phí giao hàng</span>
                    <span className={phiGH === 0 ? 'text-green-500 font-medium' : ''}>
                      {phiGH === 0 ? 'Miễn phí' : formatPrice(phiGH)}
                    </span>
                  </div>
                  {phiGH > 0 && (
                    <p className="text-xs text-gray-400">
                      Mua thêm <span className="text-red-500 font-medium">{formatPrice(500000 - tongTien)}</span> để được miễn phí giao hàng
                    </p>
                  )}
                </div>

                {/* Progress bar miễn phí ship */}
                {phiGH > 0 && (
                  <div className="mb-5">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full transition-all"
                        style={{ width: `${Math.min((tongTien / 500000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex justify-between font-bold text-gray-800 text-lg">
                    <span>Tổng cộng</span>
                    <span className="text-red-500">{formatPrice(tongThanhToan)}</span>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/thanhtoan')}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition text-base"
                >
                  Tiến hành thanh toán →
                </button>

                <Link href="/sanpham"
                  className="block text-center text-sm text-gray-400 hover:text-red-500 mt-4 transition">
                  Tiếp tục mua sắm
                </Link>

                {/* Badges */}
                <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 gap-3">
                  {[
                    { icon: '🔒', text: 'Thanh toán bảo mật' },
                    { icon: '↩️', text: 'Đổi trả 30 ngày' },
                    { icon: '✅', text: 'Hàng chính hãng' },
                    { icon: '🚀', text: 'Giao hàng 2h' },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span>{b.icon}</span>
                      <span>{b.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
