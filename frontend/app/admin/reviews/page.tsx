"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, RefreshCw, X, CheckCircle, XCircle, AlertTriangle,
  Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, ImageIcon, MessageSquare,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Types ────────────────────────────────────────────────────────────────────
interface ReviewRow {
  _id: string;
  product_id: number;
  userName: string;
  rating: number;
  content: string;
  status: "visible" | "hidden";
  createdAt: string;
  product: { product_name: string; thumbnail: string; slug: string } | null;
}

interface Pagination { total: number; page: number; limit: number; totalPages: number; }
interface Toast { id: number; type: "success" | "error"; message: string; }

function fmtDate(s: string) {
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

const RATING_TIERS = [
  { min: 4,   bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  { min: 3,   bar: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  { min: 0,   bar: "bg-rose-500",    text: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200" },
];

function ratingTier(rating: number) {
  return RATING_TIERS.find((t) => rating >= t.min) ?? RATING_TIERS[RATING_TIERS.length - 1];
}

function RatingMeter({ rating }: { rating: number }) {
  const tier = ratingTier(rating);
  const pct  = Math.max(0, Math.min(5, rating)) / 5 * 100;
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[12px] font-bold tabular-nums px-1.5 py-0.5 rounded-md border ${tier.bg} ${tier.text} ${tier.border}`}>
        {rating.toFixed(1)}
      </span>
      <div className="w-14 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${tier.bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(-2).map((w) => w[0]).join("").toUpperCase();
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[11px] font-semibold text-gray-500 shrink-0">
      {initials(name)}
    </div>
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
export default function AdminReviewsPage() {
  const [reviews, setReviews]       = useState<ReviewRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading]       = useState(false);
  const [toasts, setToasts]         = useState<Toast[]>([]);

  const [search, setSearch]             = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]                 = useState(1);
  const [deleting, setDeleting]         = useState<ReviewRow | null>(null);

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

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(search && { search }),
        ...(ratingFilter && { rating: ratingFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res  = await fetch(`${API_BASE}/api/reviews/admin/all?${params}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setReviews(json.data);
        setPagination(json.pagination);
      }
    } catch {
      showToast("error", "Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  }, [page, search, ratingFilter, statusFilter, authHeaders, showToast]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleToggleVisibility = async (r: ReviewRow) => {
    try {
      const res  = await fetch(`${API_BASE}/api/reviews/${r._id}/visibility`, { method: "PUT", headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        setReviews((prev) => prev.map((x) => (x._id === r._id ? { ...x, status: json.data.status } : x)));
      } else {
        showToast("error", json.message || "Có lỗi xảy ra!");
      }
    } catch {
      showToast("error", "Không thể kết nối đến máy chủ!");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const res  = await fetch(`${API_BASE}/api/reviews/${deleting._id}`, { method: "DELETE", headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        fetchReviews();
      } else {
        showToast("error", json.message || "Không thể xóa!");
      }
    } catch {
      showToast("error", "Không thể kết nối đến máy chủ!");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {deleting && (
        <ConfirmDialog
          title="Xóa đánh giá"
          message={`Xóa đánh giá của "${deleting.userName}"? Điểm trung bình sản phẩm sẽ được tính lại.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[19px] font-bold text-gray-900 tracking-tight">Quản lý đánh giá</h1>
          <p className="text-[12.5px] text-gray-400 mt-0.5">{pagination.total} đánh giá từ khách hàng đã mua</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-sm p-4 mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 rounded-sm px-3 py-2 border border-gray-200 flex-1 min-w-[220px] max-w-[340px] focus-within:border-[#D32F2F] focus-within:bg-white transition-all">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            placeholder="Tìm theo tên khách hoặc nội dung..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="border-none bg-transparent outline-none text-[13px] text-gray-900 w-full placeholder-gray-400"
          />
        </div>
        <select
          value={ratingFilter}
          onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-sm px-3 py-2 text-[13px] text-gray-700 bg-white outline-none focus:border-[#D32F2F] cursor-pointer"
        >
          <option value="">Tất cả số sao</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} sao</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-sm px-3 py-2 text-[13px] text-gray-700 bg-white outline-none focus:border-[#D32F2F] cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="visible">Đang hiện</option>
          <option value="hidden">Đã ẩn</option>
        </select>
        <button
          onClick={() => { setSearch(""); setRatingFilter(""); setStatusFilter(""); setPage(1); }}
          className="flex items-center gap-1.5 text-[12.5px] text-gray-500 hover:text-[#D32F2F] border border-gray-200 hover:border-[#D32F2F] rounded-sm px-3 py-2 transition-colors cursor-pointer"
        >
          <RefreshCw size={13} /> Đặt lại
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400">Đang tải dữ liệu...</div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF5F5] flex items-center justify-center mb-3">
              <MessageSquare size={20} className="text-[#D32F2F]" />
            </div>
            <p className="text-[13.5px] font-medium text-gray-700 mb-1">Chưa có đánh giá nào</p>
            <p className="text-[12.5px] text-gray-400">Đánh giá của khách hàng sẽ xuất hiện ở đây.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Sản phẩm", "Khách hàng", "Đánh giá", "Nội dung", "Ngày", "Trạng thái", ""].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-[1px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reviews.map((r) => (
                  <tr key={r._id} className={`hover:bg-gray-50/50 transition-colors ${r.status === "hidden" ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
                          {r.product?.thumbnail
                            ? <img src={r.product.thumbnail} alt="" className="w-full h-full object-contain p-0.5" />
                            : <ImageIcon size={14} className="text-gray-300" />}
                        </div>
                        <span className="text-[13px] font-medium text-gray-900 truncate max-w-[180px]">
                          {r.product?.product_name || `SP #${r.product_id}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.userName} />
                        <span className="text-[13px] font-medium text-gray-800">{r.userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><RatingMeter rating={r.rating} /></td>
                    <td className="px-4 py-3.5">
                      <p className="text-[12.5px] text-gray-500 line-clamp-2 max-w-[240px]">
                        {r.content || <span className="text-gray-300 italic">Không có nội dung</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] text-gray-600 whitespace-nowrap tabular-nums">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11.5px] font-medium border ${
                        r.status === "visible"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                        {r.status === "visible" ? "Đang hiện" : "Đã ẩn"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleToggleVisibility(r)}
                          title={r.status === "visible" ? "Ẩn đánh giá" : "Hiện đánh giá"}
                          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-[#D32F2F] hover:border-[#D32F2F] transition-colors cursor-pointer"
                        >
                          {r.status === "visible" ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          onClick={() => setDeleting(r)}
                          title="Xóa"
                          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <div className="text-[12px] text-gray-400">
              Trang {pagination.page} / {pagination.totalPages} ({pagination.total} đánh giá)
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
    </div>
  );
}
