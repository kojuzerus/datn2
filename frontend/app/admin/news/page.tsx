"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, RefreshCw, Plus, X, CheckCircle, XCircle, AlertTriangle,
  Newspaper, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, ImageIcon, ExternalLink,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Types ────────────────────────────────────────────────────────────────────
interface NewsRow {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string;
  summary: string;
  author: string;
  views: number;
  status: "published" | "draft";
  createdAt: string;
}

interface NewsForm {
  title: string;
  thumbnail: string;
  summary: string;
  content: string;
  author: string;
  status: "published" | "draft";
}

interface Pagination { total: number; page: number; limit: number; totalPages: number; }
interface Toast { id: number; type: "success" | "error"; message: string; }

const EMPTY_FORM: NewsForm = {
  title: "", thumbnail: "", summary: "", content: "", author: "SmartHub", status: "published",
};

const inputCls = "w-full border border-gray-200 rounded-sm px-3 py-2.5 text-[13.5px] text-gray-900 bg-white outline-none focus:border-[#D32F2F] focus:ring-[2px] focus:ring-[rgba(211,47,47,0.1)] transition-all placeholder-gray-400 font-sans";

function fmtDate(s: string) {
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
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
export default function AdminNewsPage() {
  const [news, setNews]             = useState<NewsRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading]       = useState(false);
  const [toasts, setToasts]         = useState<Toast[]>([]);

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]                 = useState(1);

  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<NewsRow | null>(null);
  const [form, setForm]             = useState<NewsForm>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deleting, setDeleting]     = useState<NewsRow | null>(null);

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

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res  = await fetch(`${API_BASE}/api/news/admin/all?${params}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setNews(json.data);
        setPagination(json.pagination);
      }
    } catch {
      showToast("error", "Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, authHeaders, showToast]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = async (row: NewsRow) => {
    setEditing(row);
    setLoadingEdit(true);
    setModalOpen(true);
    try {
      const res  = await fetch(`${API_BASE}/api/news/admin/${row._id}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setForm({
          title: d.title, thumbnail: d.thumbnail, summary: d.summary,
          content: d.content, author: d.author, status: d.status,
        });
      } else {
        showToast("error", json.message || "Không tải được bài viết!");
        setModalOpen(false);
      }
    } catch {
      showToast("error", "Không thể kết nối đến máy chủ!");
      setModalOpen(false);
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim())   return showToast("error", "Vui lòng nhập tiêu đề!");
    if (!form.content.trim()) return showToast("error", "Vui lòng nhập nội dung!");

    setSaving(true);
    try {
      const url    = editing ? `${API_BASE}/api/news/${editing._id}` : `${API_BASE}/api/news`;
      const method = editing ? "PUT" : "POST";
      const res  = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        setModalOpen(false);
        fetchNews();
      } else {
        showToast("error", json.message || "Có lỗi xảy ra!");
      }
    } catch {
      showToast("error", "Không thể kết nối đến máy chủ!");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const res  = await fetch(`${API_BASE}/api/news/${deleting._id}`, { method: "DELETE", headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        fetchNews();
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
          title="Xóa bài viết"
          message={`Bạn có chắc muốn xóa bài "${deleting.title}"? Hành động này không thể hoàn tác.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[19px] font-bold text-gray-900 tracking-tight">Tin tức</h1>
          <p className="text-[12.5px] text-gray-400 mt-0.5">{pagination.total} bài viết trong hệ thống</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer active:scale-[0.98]"
        >
          <Plus size={15} strokeWidth={2.5} /> Viết bài mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-sm p-4 mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 rounded-sm px-3 py-2 border border-gray-200 flex-1 min-w-[220px] max-w-[340px] focus-within:border-[#D32F2F] focus-within:bg-white transition-all">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            placeholder="Tìm theo tiêu đề hoặc mô tả..."
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
          <option value="published">Đã đăng</option>
          <option value="draft">Bản nháp</option>
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
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF5F5] flex items-center justify-center mb-3">
              <Newspaper size={20} className="text-[#D32F2F]" />
            </div>
            <p className="text-[13.5px] font-medium text-gray-700 mb-1">Chưa có bài viết nào</p>
            <p className="text-[12.5px] text-gray-400">Bấm &quot;Viết bài mới&quot; để đăng bài viết đầu tiên.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Bài viết", "Tác giả", "Lượt xem", "Ngày tạo", "Trạng thái", ""].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-[1px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {news.map((n) => (
                  <tr key={n._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
                          {n.thumbnail
                            ? <img src={n.thumbnail} alt="" className="w-full h-full object-cover" />
                            : <ImageIcon size={15} className="text-gray-300" />}
                        </div>
                        <div className="min-w-0 max-w-[340px]">
                          <div className="text-[13px] font-semibold text-gray-900 truncate">{n.title}</div>
                          {n.summary && <div className="text-[11.5px] text-gray-400 truncate">{n.summary}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-gray-600 whitespace-nowrap">{n.author}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-600 tabular-nums">
                        <Eye size={13} className="text-gray-400" /> {n.views}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] text-gray-600 whitespace-nowrap tabular-nums">{fmtDate(n.createdAt)}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11.5px] font-medium border ${
                        n.status === "published"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                        {n.status === "published" ? "Đã đăng" : "Bản nháp"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 justify-end">
                        {n.status === "published" && (
                          <a
                            href={`/tintuc/${n.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Xem bài viết"
                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-[#D32F2F] hover:border-[#D32F2F] transition-colors"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                        <button
                          onClick={() => openEdit(n)}
                          title="Sửa"
                          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-[#D32F2F] hover:border-[#D32F2F] transition-colors cursor-pointer"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleting(n)}
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
              Trang {pagination.page} / {pagination.totalPages} ({pagination.total} bài viết)
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
          <div className="bg-white rounded-2xl w-full max-w-[720px] shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-[15px] font-bold text-gray-900">
                {editing ? "Sửa bài viết" : "Viết bài mới"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
                <X size={17} />
              </button>
            </div>

            {loadingEdit ? (
              <div className="py-20 text-center text-[13px] text-gray-400">Đang tải bài viết...</div>
            ) : (
              <>
                <div className="p-6 space-y-4">
                  <label className="flex flex-col gap-1.5">
                    <FormLabel>Tiêu đề *</FormLabel>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="VD: Top 5 điện thoại đáng mua nhất 2026"
                      className={inputCls}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <FormLabel>Tác giả</FormLabel>
                      <input
                        value={form.author}
                        onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                        placeholder="SmartHub"
                        className={inputCls}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <FormLabel>Trạng thái</FormLabel>
                      <select
                        value={form.status}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "published" | "draft" }))}
                        className={inputCls}
                      >
                        <option value="published">Đăng ngay</option>
                        <option value="draft">Lưu nháp</option>
                      </select>
                    </label>
                  </div>

                  <label className="flex flex-col gap-1.5">
                    <FormLabel>Ảnh đại diện (URL)</FormLabel>
                    <input
                      value={form.thumbnail}
                      onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))}
                      placeholder="https://..."
                      className={inputCls}
                    />
                    {form.thumbnail && (
                      <img src={form.thumbnail} alt="" className="mt-1 h-28 rounded-lg object-cover border border-gray-100" />
                    )}
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <FormLabel>Mô tả ngắn</FormLabel>
                    <textarea
                      rows={2}
                      value={form.summary}
                      onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                      placeholder="Tóm tắt 1-2 câu hiển thị ở danh sách tin..."
                      className={`${inputCls} resize-none`}
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <FormLabel>Nội dung * (hỗ trợ HTML)</FormLabel>
                    <textarea
                      rows={12}
                      value={form.content}
                      onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                      placeholder="Nội dung bài viết. Có thể dùng thẻ HTML: <h2>, <p>, <img>, <ul>..."
                      className={`${inputCls} resize-y font-mono text-[12.5px] leading-relaxed`}
                    />
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
                    {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Đăng bài"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
