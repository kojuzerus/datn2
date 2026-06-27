'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ChevronRight, Clock3, MapPin, CreditCard, Truck, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface OrderItem {
  _id: string;
  productId: string;
  tenSanPham: string;
  hinhAnh: string;
  gia: number;
  soLuong: number;
  variant: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  receiverName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  paymentMethod: string;
  tongTien: number;
  phiGiaoHang: number;
  tongThanhToan: number;
  ghiChu: string;
  trangThai: string;
  createdAt: string;
}

const statusLabels: Record<string, { text: string; color: string }> = {
  cho_xac_nhan: { text: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700' },
  da_xac_nhan: { text: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  dang_giao: { text: 'Đang giao', color: 'bg-cyan-100 text-cyan-700' },
  da_giao: { text: 'Đã giao', color: 'bg-emerald-100 text-emerald-700' },
  da_huy: { text: 'Đã hủy', color: 'bg-red-100 text-red-700' },
};

const getToken = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('smarthub_token') || '';
};

const formatCurrency = (value: number) =>
  value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function DonHangPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message || 'Không thể tải đơn hàng');
          return;
        }
        setOrders(data.orders || []);
      } catch (err) {
        setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-red-500">Tài khoản của tôi</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Theo dõi đơn hàng</h1>
            <p className="mt-2 text-sm text-gray-500">Xem trạng thái và chi tiết đơn hàng của bạn.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Package className="h-4 w-4" /> Mua sắm tiếp
            </Link>
            <Link href="/dat-hang-thanh-cong" className="inline-flex items-center gap-2 rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
              <ChevronRight className="h-4 w-4" /> Đơn hàng mới
            </Link>
          </div>
        </div>

        <div className="grid gap-6">
          {loading && (
            <div className="rounded-sm border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
              Đang tải đơn hàng...
            </div>
          )}

          {error && !loading && (
            <div className="rounded-sm border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5" />
                <div>{error}</div>
              </div>
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="rounded-sm border border-gray-200 bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-semibold text-gray-900">Chưa có đơn hàng nào</p>
              <p className="mt-2 text-sm text-gray-500">Bạn vẫn chưa có đơn hàng nào. Hãy mua sắm để bắt đầu.</p>
            </div>
          )}

          {!loading && orders.map((order) => {
            const status = statusLabels[order.trangThai] || { text: 'Không xác định', color: 'bg-gray-100 text-gray-700' };
            return (
              <div key={order._id} className="overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1">
                        <Clock3 className="h-4 w-4" /> {formatDate(order.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1">
                        <CreditCard className="h-4 w-4" /> {order.paymentMethod.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Mã đơn hàng: <span className="font-semibold text-gray-900">{order._id}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${status.color}`}>
                      {status.text}
                    </span>
                    <Link href={`/don-hang/${order._id}`} className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                      Xem chi tiết
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="grid gap-6 px-6 py-6 sm:grid-cols-[2fr_1fr]">
                  <div className="space-y-4">
                    <div className="rounded-sm border border-gray-100 bg-gray-50 p-4">
                      <h2 className="text-sm font-semibold text-gray-700">Địa chỉ giao hàng</h2>
                      <p className="mt-3 text-sm text-gray-600">{order.receiverName} • {order.phone}</p>
                      <p className="mt-2 text-sm text-gray-600">
                        {order.detailAddress}, {order.ward}, {order.district}, {order.province}
                      </p>
                    </div>

                    <div className="rounded-sm border border-gray-100 bg-gray-50 p-4">
                      <h2 className="text-sm font-semibold text-gray-700">Ghi chú</h2>
                      <p className="mt-3 text-sm text-gray-600">{order.ghiChu || 'Không có ghi chú'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-sm border border-gray-100 bg-gray-50 p-4">
                      <h2 className="text-sm font-semibold text-gray-700">Tổng đơn hàng</h2>
                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Tổng tiền hàng</span>
                          <strong>{formatCurrency(order.tongTien)}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Phí giao hàng</span>
                          <strong>{formatCurrency(order.phiGiaoHang)}</strong>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-200 pt-3 font-semibold text-gray-900">
                          <span>Thanh toán</span>
                          <span>{formatCurrency(order.tongThanhToan)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-sm border border-gray-100 bg-white p-4">
                      <h2 className="text-sm font-semibold text-gray-700">Sản phẩm trong đơn</h2>
                      <div className="mt-4 space-y-3">
                        {order.items.map((item) => (
                          <div key={item._id} className="flex items-start gap-3 rounded-sm border border-gray-100 bg-gray-50 p-3">
                            <img src={item.hinhAnh} alt={item.tenSanPham} className="h-16 w-16 rounded-md object-cover" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-900">{item.tenSanPham}</p>
                              <p className="mt-1 text-xs text-gray-500">{item.variant || 'Không có biến thể'}</p>
                              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                                <span>{item.soLuong} x {formatCurrency(item.gia)}</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(item.gia * item.soLuong)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
