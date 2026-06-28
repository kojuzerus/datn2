"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, RefreshCw, X, CheckCircle, XCircle, Eye, Trash2,
  Users, ShieldCheck, Ban, Package, Mail, Phone, Calendar, AlertTriangle,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Types ────────────────────────────────────────────────────────────────────
interface CustomerRow {
  id: string;
  hoTen: string;
  email: string;
  soDienThoai: string;
  role: "user" | "admin";
  status: "active" | "banned";
  authType: "local" | "google" | "zalo";
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

interface OrderItem {
  tenSanPham: string;
  soLuong: number;
  gia: number;
}

interface OrderSummary {
  _id: string;
  items: OrderItem[];
  tongThanhToan: number;
  trangThai: string;
  createdAt: string;
}

interface CustomerDetail extends CustomerRow {
  ngaySinh?: string | null;
  orders: OrderSummary[];
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

interface PendingAction {
  type: "status" | "role" | "delete";
  userId: string;
  value?: string;
  label: string;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; dot: string; label: string }> = {
  active: { bg: "#F0FDF4", color: "#166534", border: "#BBF7D0", dot: "#15803D", label: "Hoạt động" },
  banned: { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA", dot: "#DC2626", label: "Đã khóa" },
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  cho_xac_nhan: "Chờ xác nhận", da_xac_nhan: "Đã xác nhận",
  dang_giao: "Đang giao", da_giao: "Đã giao", da_huy: "Đã hủy",
};

const vnd = (n?: number) => (n ?? 0).toLocaleString("vi-VN") + "đ";
const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString("vi-VN") : "—");

const inputCls = "w-full border border-gray-200 rounded-sm px-3 py-2.5 text-[13.5px] text-gray-900 bg-white outline-none focus:border-[#D32F2F] focus:ring-[2px] focus:ring-[rgba(211,47,47,0.1)] transition-all placeholder-gray-400 font-sans";

function FormLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11.5px] font-semibold text-gray-500 uppercase tracking-[0.5px]">{children}</span>;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] || "?").toUpperCase();
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

function ConfirmDialog({
  title, message, danger, onConfirm, onCancel,
}: {
  title: string; message: string; danger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-[380px] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? "bg-red-50" : "bg-amber-50"}`}>
            <AlertTriangle size={22} className={danger ? "text-red-600" : "text-amber-600"} />
          </div>
          <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">{title}</h3>
          <p className="text-[13px] text-gray-500 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white text-[13.5px] font-semibold transition-colors cursor-pointer ${danger ? "bg-red-600 hover:bg-red-700" : "bg-[#D32F2F] hover:bg-[#B71C1C]"}`}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers]     = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState("");
  const [roleFilter, setRoleFilter]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detail, setDetail]   = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toasts, setToasts]   = useState<Toast[]>([]);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const showToast = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  const removeToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "100",
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res  = await fetch(`${API_BASE}/api/admin/users?${params}`);
      const json = await res.json();
      if (json.success) setUsers(json.data);
      else showToast("error", json.message || "Không thể tải danh sách khách hàng");
    } catch {
      showToast("error", "Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/admin/users/${id}`);
      const json = await res.json();
      if (json.success) setDetail(json.data);
      else showToast("error", json.message || "Không thể tải chi tiết khách hàng");
    } catch {
      showToast("error", "Lỗi kết nối máy chủ!");
    } finally {
      setDetailLoading(false);
    }
  };

  const runAction = async (action: PendingAction) => {
    try {
      let res: Response;
      if (action.type === "delete") {
        res = await fetch(`${API_BASE}/api/admin/users/${action.userId}`, { method: "DELETE" });
      } else if (action.type === "status") {
        res = await fetch(`${API_BASE}/api/admin/users/${action.userId}/status`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action.value }),
        });
      } else {
        res = await fetch(`${API_BASE}/api/admin/users/${action.userId}/role`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: action.value }),
        });
      }
      const json = await res.json();
      if (!json.success) {
        showToast("error", json.message || "Thao tác thất bại");
        return;
      }
      showToast("success", "Đã cập nhật thành công!");
      if (action.type === "delete") {
        setUsers((prev) => prev.filter((u) => u.id !== action.userId));
        setDetail(null);
      } else {
        setUsers((prev) => prev.map((u) => (u.id === action.userId ? { ...u, [action.type]: action.value } : u)));
        setDetail((prev) => (prev && prev.id === action.userId ? { ...prev, [action.type]: action.value } as CustomerDetail : prev));
      }
    } catch {
      showToast("error", "Lỗi kết nối máy chủ!");
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {pending && (
        <ConfirmDialog
          title="Xác nhận thao tác"
          message={pending.label}
          danger={pending.type === "delete" || pending.value === "banned"}
          onConfirm={() => { runAction(pending); setPending(null); }}
          onCancel={() => setPending(null)}
        />
      )}

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 m-0 tracking-tight">Quản lý khách hàng</h1>
          <p className="text-[12.5px] text-gray-400 mt-1 mb-0">
            Trang chủ / <span className="text-gray-700 font-medium">Quản lý khách hàng</span>
          </p>
        </div>
        <button
          onClick={fetchUsers}
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
                placeholder="Tên, email, SĐT..."
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <FormLabel>Vai trò</FormLabel>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={inputCls}>
              <option value="">Tất cả vai trò</option>
              <option value="user">Khách hàng</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <FormLabel>Trạng thái</FormLabel>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="banned">Đã khóa</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setSearch(""); setRoleFilter(""); setStatusFilter(""); }}
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
                {["Khách hàng", "Liên hệ", "Vai trò", "Trạng thái", "Đơn hàng", "Chi tiêu", "Tham gia"].map((h) => (
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
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: "70%" }} /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <Users size={36} className="mx-auto mb-3 text-gray-300" />
                    <div className="text-[14px] font-medium text-gray-500">Không tìm thấy khách hàng phù hợp</div>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const s = STATUS_STYLE[u.status] || STATUS_STYLE.active;
                  return (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/70 cursor-pointer transition-colors" onClick={() => openDetail(u.id)}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-full text-white text-[12px] font-bold flex items-center justify-center shrink-0"
                            style={{ background: "linear-gradient(135deg,#D32F2F,#B71C1C)" }}
                          >
                            {initials(u.hoTen)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-gray-900 truncate">{u.hoTen}</div>
                            <div className="text-[11px] text-gray-400">{u.authType === "local" ? "Tài khoản thường" : u.authType === "google" ? "Google" : "Zalo"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-[12.5px] text-gray-600">{u.soDienThoai || "—"}</div>
                        <div className="text-[11.5px] text-gray-400 truncate max-w-[160px]">{u.email || "—"}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11.5px] font-medium ${u.role === "admin" ? "bg-violet-50 text-violet-700 border border-violet-200" : "bg-gray-50 text-gray-600 border border-gray-200"}`}>
                          {u.role === "admin" && <ShieldCheck size={11} />}
                          {u.role === "admin" ? "Quản trị viên" : "Khách hàng"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[12px] font-medium" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 tabular-nums">{u.orderCount}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-900 tabular-nums">{vnd(u.totalSpent)}</td>
                      <td className="px-4 py-3.5 text-gray-400 text-[12px] whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openDetail(u.id)}
                            title="Xem chi tiết"
                            className="w-8 h-8 border border-gray-200 rounded-sm bg-white hover:bg-gray-50 hover:border-gray-300 cursor-pointer inline-flex items-center justify-center transition-colors"
                          >
                            <Eye size={14} className="text-gray-500" />
                          </button>
                          <button
                            onClick={() => setPending({
                              type: "status", userId: u.id, value: u.status === "active" ? "banned" : "active",
                              label: u.status === "active"
                                ? `Khóa tài khoản của "${u.hoTen}"? Người này sẽ không thể đăng nhập.`
                                : `Mở khóa tài khoản của "${u.hoTen}"?`,
                            })}
                            title={u.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                            className={`w-8 h-8 border rounded-sm cursor-pointer inline-flex items-center justify-center transition-colors ${u.status === "active" ? "border-amber-200 bg-amber-50 hover:bg-amber-100" : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"}`}
                          >
                            {u.status === "active" ? <Ban size={14} className="text-amber-700" /> : <CheckCircle size={14} className="text-emerald-700" />}
                          </button>
                          <button
                            onClick={() => setPending({
                              type: "delete", userId: u.id,
                              label: `Xóa vĩnh viễn khách hàng "${u.hoTen}"? Hành động này không thể hoàn tác.`,
                            })}
                            title="Xóa khách hàng"
                            className="w-8 h-8 border border-red-200 rounded-sm bg-red-50 hover:bg-red-100 cursor-pointer inline-flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={14} className="text-red-600" />
                          </button>
                        </div>
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
      {(detail || detailLoading) && (
        <div className="fixed inset-0 bg-black/45 z-[100] flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl w-[600px] max-h-[92vh] flex flex-col border border-gray-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF5F5] flex items-center justify-center">
                  <Users size={16} className="text-[#D32F2F]" />
                </div>
                <span className="text-[15px] font-bold text-gray-900">Thông tin khách hàng</span>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="w-8 h-8 border border-gray-200 rounded-xl bg-white hover:bg-gray-100 cursor-pointer flex items-center justify-center transition-colors"
              >
                <X size={15} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {detailLoading || !detail ? (
                <div className="text-center text-gray-400 py-10 text-[13px]">Đang tải...</div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-full text-white text-[18px] font-bold flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg,#D32F2F,#B71C1C)" }}
                    >
                      {initials(detail.hoTen)}
                    </div>
                    <div>
                      <div className="text-[16px] font-bold text-gray-900">{detail.hoTen}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium ${detail.role === "admin" ? "bg-violet-50 text-violet-700 border border-violet-200" : "bg-gray-50 text-gray-600 border border-gray-200"}`}>
                          {detail.role === "admin" ? "Quản trị viên" : "Khách hàng"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-medium" style={{ background: (STATUS_STYLE[detail.status] || STATUS_STYLE.active).bg, color: (STATUS_STYLE[detail.status] || STATUS_STYLE.active).color, border: `1px solid ${(STATUS_STYLE[detail.status] || STATUS_STYLE.active).border}` }}>
                          {(STATUS_STYLE[detail.status] || STATUS_STYLE.active).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
                      <Phone size={14} className="text-gray-400" />
                      <span className="text-[13px] text-gray-700">{detail.soDienThoai || "—"}</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
                      <Mail size={14} className="text-gray-400" />
                      <span className="text-[13px] text-gray-700 truncate">{detail.email || "—"}</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-[13px] text-gray-700">Tham gia {fmtDate(detail.createdAt)}</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
                      <Package size={14} className="text-gray-400" />
                      <span className="text-[13px] text-gray-700">{detail.orders?.length || 0} đơn hàng</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPending({
                        type: "role", userId: detail.id, value: detail.role === "admin" ? "user" : "admin",
                        label: detail.role === "admin"
                          ? `Bỏ quyền quản trị của "${detail.hoTen}"?`
                          : `Cấp quyền quản trị viên cho "${detail.hoTen}"?`,
                      })}
                      className="flex-1 py-2.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-[13px] font-semibold hover:bg-violet-100 cursor-pointer transition-colors"
                    >
                      {detail.role === "admin" ? "Bỏ quyền Admin" : "Đặt làm Admin"}
                    </button>
                    <button
                      onClick={() => setPending({
                        type: "status", userId: detail.id, value: detail.status === "active" ? "banned" : "active",
                        label: detail.status === "active"
                          ? `Khóa tài khoản của "${detail.hoTen}"?`
                          : `Mở khóa tài khoản của "${detail.hoTen}"?`,
                      })}
                      className={`flex-1 py-2.5 rounded-xl border text-[13px] font-semibold cursor-pointer transition-colors ${detail.status === "active" ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                    >
                      {detail.status === "active" ? "Khóa tài khoản" : "Mở khóa"}
                    </button>
                  </div>

                  <div>
                    <div className="text-[11.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-2">
                      Lịch sử đơn hàng
                    </div>
                    {!detail.orders?.length ? (
                      <div className="text-center text-gray-400 py-6 text-[13px] border border-gray-200 rounded-xl bg-gray-50">
                        Chưa có đơn hàng nào
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                        {detail.orders.map((o) => (
                          <div key={o._id} className="flex items-center justify-between px-4 py-3">
                            <div>
                              <div className="text-[12.5px] font-bold text-[#D32F2F]">#{o._id.slice(-6).toUpperCase()}</div>
                              <div className="text-[11.5px] text-gray-400 mt-0.5">
                                {o.items?.length || 0} sản phẩm · {fmtDate(o.createdAt)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[13px] font-bold text-gray-900">{vnd(o.tongThanhToan)}</div>
                              <div className="text-[11px] text-gray-400 mt-0.5">{ORDER_STATUS_LABEL[o.trangThai] || o.trangThai}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
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
