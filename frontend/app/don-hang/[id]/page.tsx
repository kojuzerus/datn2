'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, XCircle, Check, Star } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface OrderItem {
  _id: string;
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

const statusSteps: Array<{ key: string; label: string; description: string }> = [
  { key: 'cho_xac_nhan', label: 'Đã Đặt', description: 'Đơn hàng được tạo' },
  { key: 'da_xac_nhan', label: 'Đã Thanh Toán', description: 'Thanh toán thành công' },
  { key: 'dang_giao', label: 'Đã Giao ĐVVC', description: 'Gửi đơn vị vận chuyển' },
  { key: 'da_giao', label: 'Chờ Giao Hàng', description: 'Đang trên đường' },
];

const statusLabels: Record<string, string> = {
  cho_xac_nhan: 'Chờ xác nhận',
  da_xac_nhan: 'Đã xác nhận',
  dang_giao: 'Đang giao',
  da_giao: 'Đã giao',
  da_huy: 'Đã hủy',
};

const formatCurrency = (value: number) =>
  value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const getToken = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('smarthub_token') || '';
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const orderId = params?.id;
        if (!orderId) {
          setError('Không tìm thấy mã đơn hàng');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message || 'Không thể tải chi tiết đơn hàng');
          return;
        }
        setOrder(data.order);
      } catch (err) {
        setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id, router]);

  const activeIndex = order ? statusSteps.findIndex((s) => s.key === order.trangThai) : -1;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <Link href="/don-hang" className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Link>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-red-500">Đơn hàng</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Mã: {params.id}</h1>
          </div>
        </div>

        {loading && (
          <div className="rounded-sm border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
            Đang tải chi tiết đơn hàng...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-sm border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          </div>
        )}

        {!loading && order && (
          <div className="space-y-6">
            {/* Timeline */}
            <div className="rounded-sm border border-gray-200 bg-white p-8 shadow-sm">
              <div className="space-y-8">
                {/* Timeline line */}
                <div className="relative">
                  {/* Horizontal line */}
                  <div className="absolute top-6 left-8 right-8 h-1 bg-gray-200">
                    <div
                      className="h-full bg-red-600 transition-all duration-500"
                      style={{
                        width: activeIndex < 0 ? '0%' : `${(activeIndex / statusSteps.length) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="flex justify-between gap-4 relative z-10">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index < activeIndex;
                      const isActive = index === activeIndex;

                      return (
                        <div key={step.key} className="flex flex-col items-center flex-1">
                          {/* Circle */}
                          <div
                            className={`h-12 w-12 rounded-full border-4 flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                              isCompleted
                                ? 'border-red-600 bg-red-600 text-white'
                                : isActive
                                ? 'border-red-600 bg-white text-red-600'
                                : 'border-gray-200 bg-gray-50 text-gray-400'
                            }`}
                          >
                            {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                          </div>

                          {/* Label */}
                          <p className={`mt-3 text-xs font-semibold uppercase text-center ${
                            isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.label}
                          </p>

                          {/* Description */}
                          <p className={`mt-1 text-xs text-center max-w-[90px] ${
                            isActive ? 'text-red-600 font-medium' : isCompleted ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {step.description}
                          </p>
                        </div>
                      );
                    })}

                    {/* Rating step */}
                    <div className="flex flex-col items-center flex-1">
                      <div className="h-12 w-12 rounded-full border-4 border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <Star className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="mt-3 text-xs font-semibold uppercase text-center text-gray-500">Đánh Giá</p>
                    </div>
                  </div>
                </div>

                {/* Expected delivery date */}
                {order.trangThai !== 'da_huy' && order.trangThai !== 'da_giao' && (
                  <div className="flex items-center justify-between border-t border-gray-100 pt-6 flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span>Ngày nhận hàng dự kiến: <strong className="text-gray-900">22-02-2024</strong></span>
                    </div>
                    <button className="px-6 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition">
                      Ghi Nhận Hàng
                    </button>
                  </div>
                )}

                {order.trangThai === 'da_huy' && (
                  <div className="border-t border-gray-100 pt-6">
                    <div className="rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <p className="font-semibold">Đơn hàng đã bị hủy</p>
                      <p className="mt-1">Nếu cần hỗ trợ, vui lòng liên hệ bộ phận chăm sóc khách hàng.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info and Summary */}
            <div className="rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Left: Info */}
                <div className="space-y-6">
                  {/* Order info */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Ngày đặt</p>
                      <p className="mt-2 text-sm font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Trạng thái</p>
                      <p className="mt-2 text-sm font-semibold text-gray-900">{statusLabels[order.trangThai] || 'Không xác định'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Thanh toán</p>
                      <p className="mt-2 text-sm font-semibold text-gray-900">{order.paymentMethod.toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Delivery info */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-500" />
                      Địa chỉ giao hàng
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-gray-900 font-semibold">{order.receiverName}</p>
                        <p className="text-gray-600">{order.phone}</p>
                      </div>
                      <p className="text-gray-600">
                        {order.detailAddress}, {order.ward}, {order.district}, {order.province}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Summary */}
                <div className="border-t border-gray-200 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-6">Tóm tắt đơn hàng</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <span className="text-gray-600">Tổng tiền hàng</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(order.tongTien)}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <span className="text-gray-600">Phí giao hàng</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(order.phiGiaoHang)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3">
                      <span className="font-semibold text-gray-900">Thanh toán</span>
                      <span className="text-lg font-bold text-red-600">{formatCurrency(order.tongThanhToan)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Danh sách sản phẩm ({order.items.length})</h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item._id} className="flex gap-4 rounded-sm border border-gray-100 bg-gray-50 p-4">
                    <img src={item.hinhAnh} alt={item.tenSanPham} className="h-20 w-20 rounded-md object-cover flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{item.tenSanPham}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.variant || 'Không có biến thể'}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                        <span>SL: {item.soLuong}</span>
                        <span className="text-gray-300">•</span>
                        <span>{formatCurrency(item.gia)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(item.gia * item.soLuong)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
