"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, RefreshCw, X, CheckCircle, XCircle, Eye,
  Package, MapPin, CreditCard, Truck, Clock, FileText,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Types ────────────────────────────────────────────────────────────────────
interface OrderItem {
  _id?: string;
  productId: string;
  tenSanPham: string;
  hinhAnh: string;
  gia: number;
  soLuong: number;
  variant: string;
}

interface Order {
  _id: string;
  userId?: { hoTen?: string; soDienThoai?: string; email?: string } | string;
  items: OrderItem[];
  receiverName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  paymentMethod: "cod" | "banking" | "vnpay";
  tongTien: number;
  phiGiaoHang: number;
  tongThanhToan: number;
  ghiChu: string;
  trangThai: string;
  createdAt: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

const STATUS_FLOW = ["cho_xac_nhan", "da_xac_nhan", "dang_giao", "da_giao", "da_huy"] as const;

// Thứ tự tiến của đơn hàng - không cho phép lùi về trạng thái đã qua
const FORWARD_FLOW = ["cho_xac_nhan", "da_xac_nhan", "dang_giao", "da_giao"] as const;

function getAvailableStatuses(current: string): string[] {
  if (current === "da_huy" || current === "da_giao") return [current];
  const idx = FORWARD_FLOW.indexOf(current as typeof FORWARD_FLOW[number]);
  if (idx === -1) return [...STATUS_FLOW];
  return [...FORWARD_FLOW.slice(idx), "da_huy"];
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; dot: string; label: string }> = {
  cho_xac_nhan: { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A", dot: "#D97706", label: "Chờ xác nhận" },
  da_xac_nhan:  { bg: "#EFF6FF", color: "#1E40AF", border: "#BFDBFE", dot: "#2563EB", label: "Đã xác nhận" },
  dang_giao:    { bg: "#ECFEFF", color: "#0E7490", border: "#A5F3FC", dot: "#0891B2", label: "Đang giao" },
  da_giao:      { bg: "#F0FDF4", color: "#166534", border: "#BBF7D0", dot: "#15803D", label: "Đã giao" },
  da_huy:       { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA", dot: "#DC2626", label: "Đã hủy" },
};

const PAYMENT_LABEL: Record<string, string> = {
  cod: "Tiền mặt (COD)",
  banking: "Chuyển khoản",
  vnpay: "VNPay",
};

const vnd = (n?: number) => (n ?? 0).toLocaleString("vi-VN") + "đ";
const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const inputCls = "w-full border border-gray-200 rounded-sm px-3 py-2.5 text-[13.5px] text-gray-900 bg-white outline-none focus:border-[#D32F2F] focus:ring-[2px] focus:ring-[rgba(211,47,47,0.1)] transition-all placeholder-gray-400 font-sans";

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11.5px] font-semibold text-gray-500 uppercase tracking-[0.5px]">
      {children}
    </span>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[500] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-sm shadow-lg border min-w-[280px] max-w-[360px] pointer-events-auto
            ${t.type === "success" ? "bg-white border-emerald-200 text-emerald-800" : "bg-white border-red-200 text-red-800"}`}
        >
          {t.type === "success"
            ? <CheckCircle size={16} className="text-emerald-600 shrink-0" />
            : <XCircle size={16} className="text-red-600 shrink-0" />}
          <span className="flex-1 text-[13px] font-medium">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [detail, setDetail]   = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [toasts, setToasts]   = useState<Toast[]>([]);

  const showToast = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  const removeToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/orders/admin/all`);
      const json = await res.json();
      if (json.success) setOrders(json.orders);
      else showToast("error", json.message || "Không thể tải đơn hàng");
    } catch {
      showToast("error", "Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId: string, trangThai: string) => {
    setUpdating(true);
    try {
      const res  = await fetch(`${API_BASE}/api/orders/admin/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trangThai }),
      });
      const json = await res.json();
      if (json.success) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, trangThai } : o)));
        setDetail((prev) => (prev && prev._id === orderId ? { ...prev, trangThai } : prev));
        showToast("success", "Đã cập nhật trạng thái đơn hàng!");
      } else {
        showToast("error", json.message || "Cập nhật thất bại");
      }
    } catch {
      showToast("error", "Lỗi kết nối máy chủ!");
    } finally {
      setUpdating(false);
    }
  };

  const displayed = orders.filter((o) => {
    if (statusFilter && o.trangThai !== statusFilter) return false;
    if (paymentFilter && o.paymentMethod !== paymentFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${o._id} ${o.receiverName} ${o.phone}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 m-0 tracking-tight">Quản lý đơn hàng</h1>
          <p className="text-[12.5px] text-gray-400 mt-1 mb-0">
            Trang chủ / <span className="text-gray-700 font-medium">Quản lý đơn hàng</span>
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] bg-white text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* ── Filter box ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}>
          <div className="flex flex-col gap-1.5">
            <FormLabel>Tìm kiếm</FormLabel>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Mã đơn, tên khách, SĐT..."
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <FormLabel>Trạng thái</FormLabel>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
              <option value="">Tất cả trạng thái</option>
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s}>{STATUS_STYLE[s].label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <FormLabel>Thanh toán</FormLabel>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className={inputCls}>
              <option value="">Tất cả phương thức</option>
              <option value="cod">Tiền mặt (COD)</option>
              <option value="banking">Chuyển khoản</option>
              <option value="vnpay">VNPay</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setSearch(""); setStatusFilter(""); setPaymentFilter(""); }}
              className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 h-10 text-[13px] bg-white text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors whitespace-nowrap"
            >
              <RefreshCw size={13} /> Xóa lọc
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
            <thead className="bg-gray-50 border-b-2 border-gray-100">
              <tr>
                {["Mã đơn", "Khách hàng", "Sản phẩm", "Tổng tiền", "Thanh toán", "Trạng thái", "Ngày đặt"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-[11.5px] text-gray-500 uppercase tracking-[0.5px] whitespace-nowrap">
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-semibold text-[11.5px] text-gray-500 uppercase tracking-[0.5px]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: "70%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <Package size={36} className="mx-auto mb-3 text-gray-300" />
                    <div className="text-[14px] font-medium text-gray-500">Không tìm thấy đơn hàng phù hợp</div>
                  </td>
                </tr>
              ) : (
                displayed.map((o) => {
                  const s = STATUS_STYLE[o.trangThai] || STATUS_STYLE.cho_xac_nhan;
                  const firstItem = o.items?.[0];
                  const itemsLabel = o.items?.length > 1
                    ? `${firstItem?.tenSanPham || ""} +${o.items.length - 1} sản phẩm`
                    : (firstItem?.tenSanPham || "—");
                  return (
                    <tr
                      key={o._id}
                      className="border-b border-gray-100 hover:bg-gray-50/70 cursor-pointer transition-colors"
                      onClick={() => setDetail(o)}
                    >
                      <td className="px-4 py-3.5 text-[#D32F2F] font-bold text-[12px]">
                        #{o._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-[13px] font-medium text-gray-900">{o.receiverName}</div>
                        <div className="text-[11.5px] text-gray-400 mt-0.5">{o.phone}</div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 max-w-[220px] truncate">{itemsLabel}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-900">{vnd(o.tongThanhToan)}</td>
                      <td className="px-4 py-3.5 text-gray-500">{PAYMENT_LABEL[o.paymentMethod] || o.paymentMethod}</td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={o.trangThai}
                          disabled={updating || getAvailableStatuses(o.trangThai).length === 1}
                          onChange={(e) => updateStatus(o._id, e.target.value)}
                          className="text-[11.5px] font-medium px-2.5 py-1.5 rounded-sm border outline-none cursor-pointer disabled:cursor-default"
                          style={{ background: s.bg, color: s.color, borderColor: s.border }}
                        >
                          {getAvailableStatuses(o.trangThai).map((st) => (
                            <option key={st} value={st}>{STATUS_STYLE[st].label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 text-[12px] whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setDetail(o)}
                          title="Xem chi tiết"
                          className="w-8 h-8 border border-gray-200 rounded-sm bg-white hover:bg-gray-50 hover:border-gray-300 cursor-pointer inline-flex items-center justify-center transition-colors"
                        >
                          <Eye size={14} className="text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail modal ── */}
      {detail && (
        <div className="fixed inset-0 bg-black/45 z-[100] flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl w-[640px] max-h-[92vh] flex flex-col border border-gray-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF5F5] flex items-center justify-center">
                  <Package size={16} className="text-[#D32F2F]" />
                </div>
                <span className="text-[15px] font-bold text-gray-900">
                  Đơn hàng #{detail._id.slice(-6).toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="w-8 h-8 border border-gray-200 rounded-xl bg-white hover:bg-gray-100 cursor-pointer flex items-center justify-center transition-colors"
              >
                <X size={15} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {/* Trạng thái */}
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-[13px] text-gray-500">
                  <Clock size={14} /> Trạng thái đơn hàng
                </div>
                <select
                  value={detail.trangThai}
                  disabled={updating || getAvailableStatuses(detail.trangThai).length === 1}
                  onChange={(e) => updateStatus(detail._id, e.target.value)}
                  className="text-[12.5px] font-semibold px-3 py-1.5 rounded-sm border outline-none cursor-pointer disabled:cursor-default"
                  style={{
                    background: (STATUS_STYLE[detail.trangThai] || STATUS_STYLE.cho_xac_nhan).bg,
                    color: (STATUS_STYLE[detail.trangThai] || STATUS_STYLE.cho_xac_nhan).color,
                    borderColor: (STATUS_STYLE[detail.trangThai] || STATUS_STYLE.cho_xac_nhan).border,
                  }}
                >
                  {getAvailableStatuses(detail.trangThai).map((st) => (
                    <option key={st} value={st}>{STATUS_STYLE[st].label}</option>
                  ))}
                </select>
              </div>

              {/* Địa chỉ giao hàng */}
              <div>
                <div className="text-[11.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-2 flex items-center gap-2">
                  <MapPin size={13} /> Địa chỉ giao hàng
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-700">
                  <div className="font-medium text-gray-900">{detail.receiverName} · {detail.phone}</div>
                  <div className="text-gray-500 mt-1">
                    {detail.detailAddress}, {detail.ward}, {detail.district}, {detail.province}
                  </div>
                  {detail.ghiChu && (
                    <div className="text-gray-500 mt-2 flex items-start gap-1.5">
                      <FileText size={13} className="mt-0.5 shrink-0" /> {detail.ghiChu}
                    </div>
                  )}
                </div>
              </div>

              {/* Sản phẩm */}
              <div>
                <div className="text-[11.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-2 flex items-center gap-2">
                  <Package size={13} /> Sản phẩm ({detail.items?.length || 0})
                </div>
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                  {detail.items?.map((it, idx) => (
                    <div key={it._id || idx} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-12 h-12 rounded-sm border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                        {it.hinhAnh
                          ? <img src={it.hinhAnh} alt={it.tenSanPham} className="w-full h-full object-cover" />
                          : <Package size={18} className="text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-gray-900 truncate">{it.tenSanPham}</div>
                        <div className="text-[11.5px] text-gray-400 mt-0.5">
                          {it.variant ? `${it.variant} · ` : ""}SL: {it.soLuong}
                        </div>
                      </div>
                      <div className="text-[13px] font-bold text-gray-900 shrink-0">{vnd((it.gia || 0) * (it.soLuong || 0))}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thanh toán */}
              <div>
                <div className="text-[11.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-2 flex items-center gap-2">
                  <CreditCard size={13} /> Thanh toán
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] flex flex-col gap-1.5">
                  <div className="flex justify-between text-gray-500">
                    <span>Phương thức</span>
                    <span className="text-gray-900 font-medium">{PAYMENT_LABEL[detail.paymentMethod] || detail.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Tạm tính</span>
                    <span className="text-gray-900">{vnd(detail.tongTien)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span className="flex items-center gap-1.5"><Truck size={12} /> Phí giao hàng</span>
                    <span className="text-gray-900">{detail.phiGiaoHang > 0 ? vnd(detail.phiGiaoHang) : "Miễn phí"}</span>
                  </div>
                  <div className="flex justify-between text-[14px] font-bold text-gray-900 pt-1.5 border-t border-gray-200 mt-1">
                    <span>Tổng thanh toán</span>
                    <span className="text-[#D32F2F]">{vnd(detail.tongThanhToan)}</span>
                  </div>
                </div>
              </div>

              <div className="text-[11.5px] text-gray-400 text-right">Đặt lúc {fmtDate(detail.createdAt)}</div>
            </div>

            <div className="border-t border-gray-100 px-6 py-4 flex justify-end bg-gray-50/60 shrink-0">
              <button
                onClick={() => setDetail(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-[13.5px] text-gray-600 hover:bg-gray-50 cursor-pointer font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
