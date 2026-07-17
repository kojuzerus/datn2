"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, RefreshCw, Plus, X, CheckCircle, XCircle,
  Tag, Pencil, Eye, EyeOff, Percent, BadgeDollarSign, ChevronLeft, ChevronRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Types ────────────────────────────────────────────────────────────────────
interface PromotionRow {
  _id: string;
  code: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_discount: number | null;
  min_order_value: number;
  usage_limit: number | null;
  used_count: number;
  start_date: string;
  end_date: string;
  status: "active" | "inactive";
}

interface PromotionForm {
  code: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  max_discount: string;
  min_order_value: string;
  usage_limit: string;
  start_date: string;
  end_date: string;
  status: "active" | "inactive";
}

interface Pagination { total: number; page: number; limit: number; totalPages: number; }
interface Toast { id: number; type: "success" | "error"; message: string; }

const EMPTY_FORM: PromotionForm = {
  code: "", description: "",
  discount_type: "percent", discount_value: "",
  max_discount: "", min_order_value: "", usage_limit: "",
  start_date: "", end_date: "",
  status: "active",
};

const inputCls = "w-full border border-gray-200 rounded-sm px-3 py-2.5 text-[13.5px] text-gray-900 bg-white outline-none focus:border-[#D32F2F] focus:ring-[2px] focus:ring-[rgba(211,47,47,0.1)] transition-all placeholder-gray-400 font-sans";

function fmtMoney(n: number) { return n.toLocaleString("vi-VN") + "đ"; }
function fmtDate(s: string) {
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function toInputDate(s: string) {
  const d = new Date(s);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Trạng thái hiệu lực thực tế của mã (kết hợp status + thời gian + lượt dùng)
function promoState(p: PromotionRow): { label: string; cls: string } {
  if (p.status === "inactive")
    return { label: "Vô hiệu hóa", cls: "bg-gray-100 text-gray-500 border-gray-200" };
  const now = new Date();
  if (now < new Date(p.start_date))
    return { label: "Sắp diễn ra", cls: "bg-sky-50 text-sky-600 border-sky-200" };
  if (now > new Date(p.end_date))
    return { label: "Hết hạn", cls: "bg-orange-50 text-orange-600 border-orange-200" };
  if (p.usage_limit != null && p.used_count >= p.usage_limit)
    return { label: "Hết lượt", cls: "bg-orange-50 text-orange-600 border-orange-200" };
  return { label: "Đang hoạt động", cls: "bg-emerald-50 text-emerald-600 border-emerald-200" };
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11.5px] font-semibold text-gray-500 uppercase tracking-[0.5px]">{children}</span>;
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading]       = useState(false);
  const [toasts, setToasts]         = useState<Toast[]>([]);

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]                 = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<PromotionRow | null>(null);
  const [form, setForm]           = useState<PromotionForm>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("smarthub_token");
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  }, []);

  const showToast = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  const removeToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res  = await fetch(`${API_BASE}/api/promotions?${params}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setPromotions(json.data);
        setPagination(json.pagination);
      }
    } catch {
      showToast("error", "Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, authHeaders, showToast]);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  const openCreate = () => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      start_date: toInputDate(today.toISOString()),
      end_date:   toInputDate(nextMonth.toISOString()),
    });
    setModalOpen(true);
  };

  const openEdit = (p: PromotionRow) => {
    setEditing(p);
    setForm({
      code: p.code,
      description: p.description,
      discount_type: p.discount_type,
      discount_value: String(p.discount_value),
      max_discount: p.max_discount != null ? String(p.max_discount) : "",
      min_order_value: p.min_order_value ? String(p.min_order_value) : "",
      usage_limit: p.usage_limit != null ? String(p.usage_limit) : "",
      start_date: toInputDate(p.start_date),
      end_date: toInputDate(p.end_date),
      status: p.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim())            return showToast("error", "Vui lòng nhập mã giảm giá!");
    if (!form.discount_value)         return showToast("error", "Vui lòng nhập giá trị giảm!");
    if (!form.start_date || !form.end_date) return showToast("error", "Vui lòng chọn thời gian áp dụng!");

    setSaving(true);
    try {
      const url    = editing ? `${API_BASE}/api/promotions/${editing._id}` : `${API_BASE}/api/promotions`;
      const method = editing ? "PUT" : "POST";
      const res  = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          code:            form.code.trim().toUpperCase(),
          description:     form.description.trim(),
          discount_type:   form.discount_type,
          discount_value:  Number(form.discount_value),
          max_discount:    form.max_discount ? Number(form.max_discount) : null,
          min_order_value: form.min_order_value ? Number(form.min_order_value) : 0,
          usage_limit:     form.usage_limit ? Number(form.usage_limit) : null,
          start_date:      form.start_date,
          end_date:        form.end_date,
          status:          form.status,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        setModalOpen(false);
        fetchPromotions();
      } else {
        showToast("error", json.message || "Có lỗi xảy ra!");
      }
    } catch {
      showToast("error", "Không thể kết nối đến máy chủ!");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (p: PromotionRow) => {
    const nextStatus = p.status === "active" ? "inactive" : "active";
    try {
      const res  = await fetch(`${API_BASE}/api/promotions/${p._id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          code:            p.code,
          description:     p.description,
          discount_type:   p.discount_type,
          discount_value:  p.discount_value,
          max_discount:    p.max_discount,
          min_order_value: p.min_order_value,
          usage_limit:     p.usage_limit,
          start_date:      p.start_date,
          end_date:        p.end_date,
          status:          nextStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", nextStatus === "active" ? "Đã bật mã giảm giá" : "Đã ẩn mã giảm giá");
        setPromotions((prev) => prev.map((x) => (x._id === p._id ? { ...x, status: nextStatus } : x)));
      } else {
        showToast("error", json.message || "Có lỗi xảy ra!");
      }
    } catch {
      showToast("error", "Không thể kết nối đến máy chủ!");
    }
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[19px] font-bold text-gray-900 tracking-tight">Mã giảm giá</h1>
          <p className="text-[12.5px] text-gray-400 mt-0.5">{pagination.total} mã giảm giá trong hệ thống</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer active:scale-[0.98]"
        >
          <Plus size={15} strokeWidth={2.5} /> Tạo mã mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-sm p-4 mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 rounded-sm px-3 py-2 border border-gray-200 flex-1 min-w-[220px] max-w-[340px] focus-within:border-[#D32F2F] focus-within:bg-white transition-all">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            placeholder="Tìm theo mã hoặc mô tả..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="border-none bg-transparent outline-none text-[13px] text-gray-900 w-full placeholder-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-sm px-3 py-2 text-[13px] text-gray-700 bg-white outline-none focus:border-[#D32F2F] cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang bật</option>
          <option value="inactive">Vô hiệu hóa</option>
        </select>
        <button
          onClick={() => { setSearch(""); setStatusFilter(""); setPage(1); }}
          className="flex items-center gap-1.5 text-[12.5px] text-gray-500 hover:text-[#D32F2F] border border-gray-200 hover:border-[#D32F2F] rounded-sm px-3 py-2 transition-colors cursor-pointer"
        >
          <RefreshCw size={13} /> Đặt lại
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400">Đang tải dữ liệu...</div>
        ) : promotions.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF5F5] flex items-center justify-center mb-3">
              <Tag size={20} className="text-[#D32F2F]" />
            </div>
            <p className="text-[13.5px] font-medium text-gray-700 mb-1">Chưa có mã giảm giá nào</p>
            <p className="text-[12.5px] text-gray-400">Bấm &quot;Tạo mã mới&quot; để thêm mã giảm giá đầu tiên.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Mã", "Giảm", "Đơn tối thiểu", "Lượt dùng", "Thời gian", "Trạng thái", ""].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-[1px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {promotions.map((p) => {
                  const st = promoState(p);
                  return (
                    <tr key={p._id} className={`hover:bg-gray-50/50 transition-colors ${p.status === "inactive" ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.discount_type === "percent" ? "bg-violet-50" : "bg-emerald-50"}`}>
                            {p.discount_type === "percent"
                              ? <Percent size={14} className="text-violet-500" />
                              : <BadgeDollarSign size={14} className="text-emerald-500" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-bold text-gray-900 font-mono tracking-wide">{p.code}</div>
                            {p.description && <div className="text-[11.5px] text-gray-400 truncate max-w-[220px]">{p.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-[13px] font-semibold text-gray-900">
                          {p.discount_type === "percent" ? `${p.discount_value}%` : fmtMoney(p.discount_value)}
                        </div>
                        {p.discount_type === "percent" && p.max_discount != null && (
                          <div className="text-[11px] text-gray-400">tối đa {fmtMoney(p.max_discount)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-gray-600 whitespace-nowrap">
                        {p.min_order_value > 0 ? fmtMoney(p.min_order_value) : "Không"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[13px] text-gray-900 font-medium tabular-nums">{p.used_count}</span>
                        <span className="text-[12px] text-gray-400 tabular-nums"> / {p.usage_limit != null ? p.usage_limit : "∞"}</span>
                      </td>
                      <td className="px-4 py-3.5 text-[12.5px] text-gray-600 whitespace-nowrap tabular-nums">
                        {fmtDate(p.start_date)} - {fmtDate(p.end_date)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11.5px] font-medium border ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => openEdit(p)}
                            title="Sửa"
                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-[#D32F2F] hover:border-[#D32F2F] transition-colors cursor-pointer"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(p)}
                            title={p.status === "active" ? "Ẩn mã" : "Hiện mã"}
                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-[#D32F2F] hover:border-[#D32F2F] transition-colors cursor-pointer"
                          >
                            {p.status === "active" ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <div className="text-[12px] text-gray-400">
              Trang {pagination.page} / {pagination.totalPages} ({pagination.total} mã)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#D32F2F] hover:text-[#D32F2F] transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#D32F2F] hover:text-[#D32F2F] transition-colors cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal thêm/sửa */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[560px] shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-[15px] font-bold text-gray-900">
                {editing ? `Sửa mã ${editing.code}` : "Tạo mã giảm giá mới"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
                <X size={17} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <FormLabel>Mã giảm giá *</FormLabel>
                  <input
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="VD: SALE10"
                    maxLength={20}
                    className={`${inputCls} font-mono tracking-wide uppercase`}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <FormLabel>Trạng thái</FormLabel>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))}
                    className={inputCls}
                  >
                    <option value="active">Đang bật</option>
                    <option value="inactive">Vô hiệu hóa</option>
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <FormLabel>Mô tả</FormLabel>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="VD: Giảm 10% cho đơn từ 500.000đ"
                  className={inputCls}
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <FormLabel>Loại giảm giá *</FormLabel>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as "percent" | "fixed" }))}
                    className={inputCls}
                  >
                    <option value="percent">Giảm theo % đơn hàng</option>
                    <option value="fixed">Giảm số tiền cố định</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <FormLabel>{form.discount_type === "percent" ? "Phần trăm giảm (%) *" : "Số tiền giảm (đ) *"}</FormLabel>
                  <input
                    type="number"
                    min={0}
                    max={form.discount_type === "percent" ? 100 : undefined}
                    value={form.discount_value}
                    onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                    placeholder={form.discount_type === "percent" ? "VD: 10" : "VD: 50000"}
                    className={inputCls}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {form.discount_type === "percent" && (
                  <label className="flex flex-col gap-1.5">
                    <FormLabel>Giảm tối đa (đ)</FormLabel>
                    <input
                      type="number"
                      min={0}
                      value={form.max_discount}
                      onChange={(e) => setForm((f) => ({ ...f, max_discount: e.target.value }))}
                      placeholder="Bỏ trống = không giới hạn"
                      className={inputCls}
                    />
                  </label>
                )}
                <label className="flex flex-col gap-1.5">
                  <FormLabel>Đơn hàng tối thiểu (đ)</FormLabel>
                  <input
                    type="number"
                    min={0}
                    value={form.min_order_value}
                    onChange={(e) => setForm((f) => ({ ...f, min_order_value: e.target.value }))}
                    placeholder="Bỏ trống = không yêu cầu"
                    className={inputCls}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <FormLabel>Tổng lượt sử dụng</FormLabel>
                  <input
                    type="number"
                    min={1}
                    value={form.usage_limit}
                    onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                    placeholder="Bỏ trống = không giới hạn"
                    className={inputCls}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <FormLabel>Ngày bắt đầu *</FormLabel>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className={inputCls}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <FormLabel>Ngày kết thúc *</FormLabel>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    className={inputCls}
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#D32F2F] text-white text-[13.5px] font-semibold hover:bg-[#B71C1C] transition-colors cursor-pointer disabled:opacity-60 active:scale-[0.98]"
              >
                {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mã"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
