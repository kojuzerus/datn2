"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search, RefreshCw, Plus, X, CheckCircle, XCircle, AlertTriangle,
  Zap, Pencil, Eye, EyeOff, Trash2, ChevronLeft, ChevronRight, ImageOff,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Types ────────────────────────────────────────────────────────────────────
interface FlashSaleRow {
  _id: string;
  name: string;
  variant_id: string;
  sale_price: number;
  quantity: number;
  remaining_quantity: number;
  sold_quantity: number;
  start_time: string;
  end_time: string;
  status: "active" | "inactive";
  variant: { _id: string; color: string; price: number; sku: string; stock_quantity: number } | null;
  product: { product_id: number; product_name: string; thumbnail: string; slug: string } | null;
}

interface VariantOption {
  _id: string;
  product_name: string;
  thumbnail: string;
  color: string;
  price: number;
  sku: string;
  stock_quantity: number;
}

interface FlashSaleForm {
  name: string;
  variant_id: string;
  sale_price: string;
  quantity: string;
  start_time: string;
  end_time: string;
  status: "active" | "inactive";
}

interface Pagination { total: number; page: number; limit: number; totalPages: number; }
interface Toast { id: number; type: "success" | "error"; message: string; }

const EMPTY_FORM: FlashSaleForm = {
  name: "", variant_id: "",
  sale_price: "", quantity: "",
  start_time: "", end_time: "",
  status: "active",
};

const inputCls = "w-full border border-gray-200 rounded-sm px-3 py-2.5 text-[13.5px] text-gray-900 bg-white outline-none focus:border-[#D32F2F] focus:ring-[2px] focus:ring-[rgba(211,47,47,0.1)] transition-all placeholder-gray-400 font-sans";

function fmtMoney(n: number) { return n.toLocaleString("vi-VN") + "đ"; }
function fmtDateTime(s: string) {
  const d = new Date(s);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function toInputDateTime(s: string) {
  const d = new Date(s);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Trạng thái hiệu lực thực tế (kết hợp status + thời gian + số lượng còn lại)
function saleState(f: FlashSaleRow): { label: string; cls: string } {
  if (f.status === "inactive")
    return { label: "Vô hiệu hóa", cls: "bg-gray-100 text-gray-500 border-gray-200" };
  const now = new Date();
  if (now < new Date(f.start_time))
    return { label: "Sắp diễn ra", cls: "bg-sky-50 text-sky-600 border-sky-200" };
  if (now > new Date(f.end_time))
    return { label: "Đã kết thúc", cls: "bg-orange-50 text-orange-600 border-orange-200" };
  if (f.remaining_quantity <= 0)
    return { label: "Hết hàng", cls: "bg-orange-50 text-orange-600 border-orange-200" };
  return { label: "Đang diễn ra", cls: "bg-emerald-50 text-emerald-600 border-emerald-200" };
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

function ConfirmDialog({
  title, message, onConfirm, onCancel,
}: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-[380px] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-red-600" />
          </div>
          <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">{title}</h3>
          <p className="text-[13px] text-gray-500 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
            Hủy
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-[13.5px] font-semibold hover:bg-red-700 transition-colors cursor-pointer">
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AdminFlashSalePage() {
  const [flashSales, setFlashSales] = useState<FlashSaleRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading]       = useState(false);
  const [toasts, setToasts]         = useState<Toast[]>([]);

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]                 = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<FlashSaleRow | null>(null);
  const [form, setForm]           = useState<FlashSaleForm>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(null);
  const [variantQuery, setVariantQuery]       = useState("");
  const [variantOptions, setVariantOptions]   = useState<VariantOption[]>([]);
  const [variantDropdownOpen, setVariantDropdownOpen] = useState(false);
  const [variantLoading, setVariantLoading]   = useState(false);
  const variantDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({
    open: false, title: "", message: "", onConfirm: () => {},
  });

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

  const fetchFlashSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res  = await fetch(`${API_BASE}/api/flash-sales?${params}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setFlashSales(json.data);
        setPagination(json.pagination);
      }
    } catch {
      showToast("error", "Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, authHeaders, showToast]);

  useEffect(() => { fetchFlashSales(); }, [fetchFlashSales]);

  // Tìm biến thể sản phẩm cho picker trong modal
  useEffect(() => {
    if (variantDebounceRef.current) clearTimeout(variantDebounceRef.current);
    if (!modalOpen) return;
    variantDebounceRef.current = setTimeout(async () => {
      setVariantLoading(true);
      try {
        const res  = await fetch(`${API_BASE}/api/flash-sales/variant-options?q=${encodeURIComponent(variantQuery)}`, { headers: authHeaders() });
        const json = await res.json();
        if (json.success) setVariantOptions(json.data);
      } finally {
        setVariantLoading(false);
      }
    }, 300);
    return () => { if (variantDebounceRef.current) clearTimeout(variantDebounceRef.current); };
  }, [variantQuery, modalOpen, authHeaders]);

  const openCreate = () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      start_time: toInputDateTime(now.toISOString()),
      end_time:   toInputDateTime(tomorrow.toISOString()),
    });
    setSelectedVariant(null);
    setVariantQuery("");
    setModalOpen(true);
  };

  const openEdit = (f: FlashSaleRow) => {
    setEditing(f);
    setForm({
      name: f.name,
      variant_id: f.variant_id,
      sale_price: String(f.sale_price),
      quantity: String(f.quantity),
      start_time: toInputDateTime(f.start_time),
      end_time: toInputDateTime(f.end_time),
      status: f.status,
    });
    setSelectedVariant(
      f.variant && f.product
        ? {
            _id: f.variant._id,
            product_name: f.product.product_name,
            thumbnail: f.product.thumbnail,
            color: f.variant.color,
            price: f.variant.price,
            sku: f.variant.sku,
            stock_quantity: f.variant.stock_quantity,
          }
        : null,
    );
    setVariantQuery("");
    setModalOpen(true);
  };

  const pickVariant = (v: VariantOption) => {
    setSelectedVariant(v);
    setForm((f) => ({ ...f, variant_id: v._id }));
    setVariantDropdownOpen(false);
  };

  const handleSave = async () => {
    if (!form.name.trim())              return showToast("error", "Vui lòng nhập tên đợt flash sale!");
    if (!form.variant_id)               return showToast("error", "Vui lòng chọn sản phẩm/biến thể!");
    if (!form.sale_price)               return showToast("error", "Vui lòng nhập giá flash sale!");
    if (!form.quantity)                 return showToast("error", "Vui lòng nhập số lượng!");
    if (!form.start_time || !form.end_time) return showToast("error", "Vui lòng chọn thời gian diễn ra!");
    if (selectedVariant && Number(form.sale_price) >= selectedVariant.price)
      return showToast("error", "Giá flash sale phải thấp hơn giá gốc!");

    setSaving(true);
    try {
      const url    = editing ? `${API_BASE}/api/flash-sales/${editing._id}` : `${API_BASE}/api/flash-sales`;
      const method = editing ? "PUT" : "POST";
      const res  = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          name:        form.name.trim(),
          variant_id:  form.variant_id,
          sale_price:  Number(form.sale_price),
          quantity:    Number(form.quantity),
          start_time:  form.start_time,
          end_time:    form.end_time,
          status:      form.status,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        setModalOpen(false);
        fetchFlashSales();
      } else {
        showToast("error", json.message || "Có lỗi xảy ra!");
      }
    } catch {
      showToast("error", "Không thể kết nối đến máy chủ!");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (f: FlashSaleRow) => {
    const nextStatus = f.status === "active" ? "inactive" : "active";
    try {
      const res  = await fetch(`${API_BASE}/api/flash-sales/${f._id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          name: f.name, variant_id: f.variant_id, sale_price: f.sale_price,
          quantity: f.quantity, start_time: f.start_time, end_time: f.end_time,
          status: nextStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", nextStatus === "active" ? "Đã bật đợt flash sale" : "Đã ẩn đợt flash sale");
        setFlashSales((prev) => prev.map((x) => (x._id === f._id ? { ...x, status: nextStatus } : x)));
      } else {
        showToast("error", json.message || "Có lỗi xảy ra!");
      }
    } catch {
      showToast("error", "Không thể kết nối đến máy chủ!");
    }
  };

  const handleDelete = (f: FlashSaleRow) => {
    setConfirmState({
      open: true,
      title: "Xoá đợt flash sale",
      message: `Bạn có chắc muốn xoá "${f.name}"? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        try {
          const res  = await fetch(`${API_BASE}/api/flash-sales/${f._id}`, { method: "DELETE", headers: authHeaders() });
          const json = await res.json();
          if (json.success) { showToast("success", "Đã xoá đợt flash sale"); fetchFlashSales(); }
          else showToast("error", json.message || "Có lỗi xảy ra!");
        } catch {
          showToast("error", "Không thể kết nối đến máy chủ!");
        }
      },
    });
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {confirmState.open && (
        <ConfirmDialog
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[19px] font-bold text-gray-900 tracking-tight">Flash Sale</h1>
          <p className="text-[12.5px] text-gray-400 mt-0.5">{pagination.total} đợt flash sale trong hệ thống</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer active:scale-[0.98]"
        >
          <Plus size={15} strokeWidth={2.5} /> Tạo đợt mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-sm p-4 mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 rounded-sm px-3 py-2 border border-gray-200 flex-1 min-w-[220px] max-w-[340px] focus-within:border-[#D32F2F] focus-within:bg-white transition-all">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            placeholder="Tìm theo tên đợt flash sale..."
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
        ) : flashSales.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF5F5] flex items-center justify-center mb-3">
              <Zap size={20} className="text-[#D32F2F]" />
            </div>
            <p className="text-[13.5px] font-medium text-gray-700 mb-1">Chưa có đợt flash sale nào</p>
            <p className="text-[12.5px] text-gray-400">Bấm &quot;Tạo đợt mới&quot; để thêm đợt flash sale đầu tiên.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Sản phẩm", "Giá", "Đã bán", "Thời gian", "Trạng thái", ""].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-[1px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {flashSales.map((f) => {
                  const st = saleState(f);
                  const originalPrice = f.variant?.price ?? null;
                  const discountPct = originalPrice ? Math.round((1 - f.sale_price / originalPrice) * 100) : null;
                  const sold = f.sold_quantity || 0;
                  const soldPct = f.quantity > 0 ? Math.min(100, Math.round((sold / f.quantity) * 100)) : 0;
                  return (
                    <tr key={f._id} className={`hover:bg-gray-50/50 transition-colors ${f.status === "inactive" ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {f.product?.thumbnail ? (
                            <img src={f.product.thumbnail} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                              <ImageOff size={14} className="text-gray-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-gray-900 truncate max-w-[220px]">{f.name}</div>
                            <div className="text-[11.5px] text-gray-400 truncate max-w-[220px]">
                              {f.product?.product_name || "Sản phẩm đã bị xoá"}{f.variant?.color ? ` · ${f.variant.color}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-[13px] font-bold text-[#D32F2F]">{fmtMoney(f.sale_price)}</div>
                        {originalPrice != null && (
                          <div className="text-[11px] text-gray-400">
                            <span className="line-through">{fmtMoney(originalPrice)}</span>
                            {discountPct != null && discountPct > 0 && <span className="ml-1 text-emerald-600 font-medium">-{discountPct}%</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap min-w-[130px]">
                        <div className="text-[12px] text-gray-600 mb-1">
                          <span className="font-medium text-gray-900 tabular-nums">{sold}</span> / {f.quantity}
                        </div>
                        <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full bg-[#D32F2F] rounded-full" style={{ width: `${soldPct}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[12.5px] text-gray-600 whitespace-nowrap tabular-nums">
                        {fmtDateTime(f.start_time)} - {fmtDateTime(f.end_time)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11.5px] font-medium border ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => openEdit(f)}
                            title="Sửa"
                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-[#D32F2F] hover:border-[#D32F2F] transition-colors cursor-pointer"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(f)}
                            title={f.status === "active" ? "Ẩn đợt" : "Hiện đợt"}
                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-[#D32F2F] hover:border-[#D32F2F] transition-colors cursor-pointer"
                          >
                            {f.status === "active" ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            onClick={() => handleDelete(f)}
                            title="Xoá"
                            className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
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
              Trang {pagination.page} / {pagination.totalPages} ({pagination.total} đợt)
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
                {editing ? `Sửa đợt "${editing.name}"` : "Tạo đợt flash sale mới"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
                <X size={17} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="flex flex-col gap-1.5">
                <FormLabel>Tên đợt flash sale *</FormLabel>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Flash Sale iPhone 16 Pro"
                  className={inputCls}
                />
              </label>

              {/* Variant picker */}
              <div className="flex flex-col gap-1.5 relative">
                <FormLabel>Sản phẩm / biến thể *</FormLabel>
                {selectedVariant ? (
                  <div className="flex items-center gap-2.5 border border-gray-200 rounded-sm px-3 py-2">
                    {selectedVariant.thumbnail ? (
                      <img src={selectedVariant.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-100" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-50 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-gray-900 truncate">{selectedVariant.product_name}</div>
                      <div className="text-[11.5px] text-gray-400">
                        {selectedVariant.color ? `${selectedVariant.color} · ` : ""}{fmtMoney(selectedVariant.price)}
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedVariant(null); setForm((f) => ({ ...f, variant_id: "" })); }}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-sm px-3 py-2 border border-gray-200 focus-within:border-[#D32F2F] focus-within:bg-white transition-all">
                      <Search size={14} className="text-gray-400 shrink-0" />
                      <input
                        placeholder="Tìm theo tên sản phẩm..."
                        value={variantQuery}
                        onChange={(e) => { setVariantQuery(e.target.value); setVariantDropdownOpen(true); }}
                        onFocus={() => setVariantDropdownOpen(true)}
                        className="border-none bg-transparent outline-none text-[13px] text-gray-900 w-full placeholder-gray-400"
                      />
                    </div>
                    {variantDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-sm shadow-lg z-20 max-h-[240px] overflow-y-auto">
                        {variantLoading ? (
                          <div className="px-3 py-3 text-[12.5px] text-gray-400">Đang tìm...</div>
                        ) : variantOptions.length === 0 ? (
                          <div className="px-3 py-3 text-[12.5px] text-gray-400">Không tìm thấy sản phẩm/biến thể nào</div>
                        ) : (
                          variantOptions.map((v) => (
                            <button
                              key={v._id}
                              onClick={() => pickVariant(v)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                            >
                              {v.thumbnail ? (
                                <img src={v.thumbnail} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 border border-gray-100" />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-gray-50 shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-[12.5px] text-gray-900 truncate">{v.product_name}</div>
                                <div className="text-[11px] text-gray-400">{v.color ? `${v.color} · ` : ""}{fmtMoney(v.price)} · Kho: {v.stock_quantity}</div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <FormLabel>Giá flash sale (đ) *</FormLabel>
                  <input
                    type="number"
                    min={0}
                    value={form.sale_price}
                    onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))}
                    placeholder="VD: 18990000"
                    className={inputCls}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <FormLabel>Số lượng *</FormLabel>
                  <input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    placeholder="VD: 10"
                    className={inputCls}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <FormLabel>Bắt đầu *</FormLabel>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                    className={inputCls}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <FormLabel>Kết thúc *</FormLabel>
                  <input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                    className={inputCls}
                  />
                </label>
              </div>

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
                {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo đợt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
