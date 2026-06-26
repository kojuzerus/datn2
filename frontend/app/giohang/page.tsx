'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart, ArrowLeft, Trash2, Plus, Minus,
  Package, ShieldCheck, RotateCcw, BadgeCheck, Zap,
} from 'lucide-react';

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
  const [items, setItems]         = useState<CartItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState<string | null>(null);
  const [selected, setSelected]   = useState<Set<string>>(new Set());

  const token = typeof window !== 'undefined' ? localStorage.getItem('smarthub_token') : null;

  const fetchCart = async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res  = await fetch(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.cart.items);
        // Mặc định chọn tất cả
        setSelected(new Set(data.cart.items.map((i: CartItem) => i._id)));
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, []);

  // ── Checkbox logic ──────────────────────────────────────────────────────
  const allChecked  = items.length > 0 && selected.size === items.length;
  const someChecked = selected.size > 0 && selected.size < items.length;

  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(items.map(i => i._id)));
  };

  const toggleItem = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Cart actions ────────────────────────────────────────────────────────
  const updateQty = async (itemId: string, soLuong: number) => {
    if (soLuong < 1) return;
    setUpdating(itemId);
    try {
      const res  = await fetch(`${API_URL}/api/cart/item/${itemId}`, {
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
      const res  = await fetch(`${API_URL}/api/cart/item/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.cart.items);
        setSelected(prev => { const n = new Set(prev); n.delete(itemId); return n; });
      }
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
      setSelected(new Set());
    } catch {}
  };

  // ── Tính tiền theo sản phẩm được chọn ──────────────────────────────────
  const selectedItems = items.filter(i => selected.has(i._id));
  const tongTien      = selectedItems.reduce((s, i) => s + i.gia * i.soLuong, 0);
  const tongSP        = selectedItems.reduce((s, i) => s + i.soLuong, 0);
  const phiGH         = tongTien > 0 && tongTien >= 500000 ? 0 : tongTien > 0 ? 30000 : 0;
  const tongThanhToan = tongTien + phiGH;

  const handleCheckout = () => {
    if (selected.size === 0) return alert('Vui lòng chọn ít nhất một sản phẩm');
    // Lưu danh sách ID được chọn để trang thanh toán đọc
    localStorage.setItem('smarthub_checkout_ids', JSON.stringify([...selected]));
    router.push('/thanhtoan');
  };

  if (!token && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <ShoppingCart className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Vui lòng đăng nhập</h2>
          <p className="text-gray-500 text-sm mb-6">Đăng nhập để xem giỏ hàng của bạn</p>
          <Link href="/login" className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-sm font-semibold transition">
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
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-red-500" />
            Giỏ hàng
            {items.length > 0 && <span className="text-red-500">({items.reduce((s, i) => s + i.soLuong, 0)})</span>}
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-3">Giỏ hàng trống</h2>
            <p className="text-gray-400 mb-8">Hãy thêm sản phẩm vào giỏ hàng nhé!</p>
            <Link
              href="/sanpham"
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-sm font-semibold transition"
            >
              Mua sắm ngay
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Danh sách sản phẩm ── */}
            <div className="lg:col-span-2 space-y-3">

              {/* Thanh "chọn tất cả" */}
              <div className="bg-white border border-gray-100 px-4 py-3 flex items-center justify-between rounded-sm">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked; }}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-red-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Chọn tất cả ({items.length} sản phẩm)
                  </span>
                </label>
                <button
                  onClick={clearCart}
                  className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa tất cả
                </button>
              </div>

              {/* Items */}
              {items.map(item => {
                const isSelected = selected.has(item._id);
                return (
                  <div
                    key={item._id}
                    className={`bg-white border rounded-sm flex gap-4 p-4 transition ${
                      updating === item._id ? 'opacity-60' : ''
                    } ${isSelected ? 'border-red-300' : 'border-gray-100'}`}
                  >
                    {/* Checkbox */}
                    <div className="flex items-center pt-1 shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item._id)}
                        className="w-4 h-4 accent-red-500 cursor-pointer"
                      />
                    </div>

                    {/* Ảnh */}
                    <div className="w-20 h-20 rounded-sm overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                      {item.hinhAnh
                        ? <img src={item.hinhAnh} alt={item.tenSanPham} className="w-full h-full object-cover" />
                        : <Package className="w-8 h-8 text-gray-300" />
                      }
                    </div>

                    {/* Thông tin */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">
                        {item.tenSanPham}
                      </h3>
                      {item.variant && (
                        <p className="text-xs text-gray-400 mb-2">Phân loại: {item.variant}</p>
                      )}
                      <p className="text-red-500 font-bold text-base">{formatPrice(item.gia)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end justify-between shrink-0">
                      {/* Xóa */}
                      <button
                        onClick={() => removeItem(item._id)}
                        disabled={updating === item._id}
                        className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-md transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Số lượng */}
                      <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                        <button
                          onClick={() => updateQty(item._id, item.soLuong - 1)}
                          disabled={updating === item._id || item.soLuong <= 1}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-50 disabled:opacity-30 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-9 text-center text-sm font-semibold text-gray-800 border-x border-gray-200">
                          {item.soLuong}
                        </span>
                        <button
                          onClick={() => updateQty(item._id, item.soLuong + 1)}
                          disabled={updating === item._id}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-50 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Tổng tiền item */}
                      <p className="text-sm font-semibold text-gray-700">
                        {formatPrice(item.gia * item.soLuong)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Tóm tắt ── */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-100 rounded-sm p-6 sticky top-24">
                <h2 className="font-bold text-gray-800 text-lg mb-5">Tóm tắt đơn hàng</h2>

                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Đã chọn ({selected.size}/{items.length} sản phẩm)</span>
                    <span>{formatPrice(tongTien)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Phí giao hàng</span>
                    <span className={phiGH === 0 && tongTien > 0 ? 'text-green-500 font-medium' : ''}>
                      {tongTien === 0 ? '—' : phiGH === 0 ? 'Miễn phí' : formatPrice(phiGH)}
                    </span>
                  </div>
                  {phiGH > 0 && tongTien > 0 && (
                    <p className="text-xs text-gray-400">
                      Mua thêm{' '}
                      <span className="text-red-500 font-medium">{formatPrice(500000 - tongTien)}</span>{' '}
                      để được miễn phí giao hàng
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                {phiGH > 0 && tongTien > 0 && (
                  <div className="mb-5">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full transition-all"
                        style={{ width: `${Math.min((tongTien / 500000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4 mb-5">
                  <div className="flex justify-between font-bold text-gray-800 text-lg">
                    <span>Tổng cộng</span>
                    <span className="text-red-500">{formatPrice(tongThanhToan)}</span>
                  </div>
                  {tongSP > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{tongSP} sản phẩm được chọn</p>
                  )}
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={selected.size === 0}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-sm transition text-base"
                >
                  Thanh toán ({selected.size})
                </button>

                <Link
                  href="/sanpham"
                  className="block text-center text-sm text-gray-400 hover:text-red-500 mt-4 transition"
                >
                  Tiếp tục mua sắm
                </Link>

                {/* Badges */}
                <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 gap-3">
                  {[
                    { Icon: ShieldCheck, text: 'Thanh toán bảo mật', color: 'text-green-500' },
                    { Icon: RotateCcw,   text: 'Đổi trả 30 ngày',    color: 'text-blue-500'  },
                    { Icon: BadgeCheck,  text: 'Hàng chính hãng',     color: 'text-purple-500'},
                    { Icon: Zap,         text: 'Giao hàng nhanh',     color: 'text-yellow-500'},
                  ].map(({ Icon, text, color }, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                      <span>{text}</span>
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
