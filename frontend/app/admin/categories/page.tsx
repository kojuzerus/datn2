"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, X, CheckCircle, XCircle, Edit2, Trash2, AlertTriangle,
  FolderOpen, Tag, RefreshCw,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const authHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("smarthub_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Types ────────────────────────────────────────────────────────────────────
interface CategoryRow {
  category_id: number;
  category_name: string;
  slug: string;
  description: string;
  image_url: string;
  status: "active" | "inactive";
  brandCount: number;
}

interface BrandRow {
  brand_id: number;
  brand_name: string;
  logo: string;
  description: string;
  category_ids: number[];
  status: "active" | "inactive";
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

interface CategoryForm {
  category_name: string;
  description: string;
  image_url: string;
  status: "active" | "inactive";
}

interface BrandForm {
  brand_name: string;
  logo: string;
  description: string;
  category_ids: number[];
  status: "active" | "inactive";
}

const EMPTY_CATEGORY: CategoryForm = { category_name: "", description: "", image_url: "", status: "active" };
const EMPTY_BRAND: BrandForm = { brand_name: "", logo: "", description: "", category_ids: [], status: "active" };

const inputCls = "w-full border border-gray-200 rounded-sm px-3 py-2.5 text-[13.5px] text-gray-900 bg-white outline-none focus:border-[#D32F2F] focus:ring-[2px] focus:ring-[rgba(211,47,47,0.1)] transition-all placeholder-gray-400 font-sans";

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

export default function AdminCategoriesPage() {
  const [tab, setTab] = useState<"categories" | "brands">("categories");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catEditId, setCatEditId] = useState<number | null>(null);
  const [catForm, setCatForm] = useState<CategoryForm>(EMPTY_CATEGORY);
  const [catSaving, setCatSaving] = useState(false);

  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [brandEditId, setBrandEditId] = useState<number | null>(null);
  const [brandForm, setBrandForm] = useState<BrandForm>(EMPTY_BRAND);
  const [brandSaving, setBrandSaving] = useState(false);

  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({
    open: false, title: "", message: "", onConfirm: () => {},
  });

  const showToast = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  const removeToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch(`${API_BASE}/api/categories?status=all&withBrandCount=true`),
        fetch(`${API_BASE}/api/brands?status=all`),
      ]);
      const catJson = await catRes.json();
      const brandJson = await brandRes.json();
      if (catJson.success) setCategories(catJson.data);
      if (brandJson.success) setBrands(brandJson.data);
    } catch {
      showToast("error", "Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Category handlers ──────────────────────────────────────────────────
  const openAddCategory = () => { setCatEditId(null); setCatForm(EMPTY_CATEGORY); setCatModalOpen(true); };
  const openEditCategory = (c: CategoryRow) => {
    setCatEditId(c.category_id);
    setCatForm({ category_name: c.category_name, description: c.description, image_url: c.image_url, status: c.status });
    setCatModalOpen(true);
  };

  const saveCategory = async () => {
    if (!catForm.category_name.trim()) { showToast("error", "Vui lòng nhập tên danh mục!"); return; }
    setCatSaving(true);
    try {
      const url = catEditId ? `${API_BASE}/api/categories/${catEditId}` : `${API_BASE}/api/categories`;
      const method = catEditId ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(catForm),
      });
      const json = await res.json();
      if (json.success) {
        setCatModalOpen(false);
        fetchAll();
        showToast("success", catEditId ? "Cập nhật danh mục thành công!" : "Thêm danh mục thành công!");
      } else {
        showToast("error", "Lỗi: " + json.message);
      }
    } catch {
      showToast("error", "Lỗi kết nối máy chủ!");
    } finally {
      setCatSaving(false);
    }
  };

  const deleteCategory = (id: number, name: string) => {
    setConfirmState({
      open: true,
      title: "Xoá danh mục",
      message: `Bạn có chắc muốn xoá "${name}"? Các thương hiệu thuộc danh mục này sẽ bị gỡ liên kết.`,
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        try {
          const res = await fetch(`${API_BASE}/api/categories/${id}`, { method: "DELETE", headers: authHeaders() });
          const json = await res.json();
          if (json.success) { fetchAll(); showToast("success", "Đã xoá danh mục thành công!"); }
          else showToast("error", "Lỗi: " + json.message);
        } catch {
          showToast("error", "Lỗi kết nối máy chủ!");
        }
      },
    });
  };

  // ── Brand handlers ─────────────────────────────────────────────────────
  const openAddBrand = () => { setBrandEditId(null); setBrandForm(EMPTY_BRAND); setBrandModalOpen(true); };
  const openEditBrand = (b: BrandRow) => {
    setBrandEditId(b.brand_id);
    setBrandForm({ brand_name: b.brand_name, logo: b.logo, description: b.description, category_ids: b.category_ids || [], status: b.status });
    setBrandModalOpen(true);
  };

  const toggleBrandCategory = (id: number) =>
    setBrandForm((f) => ({
      ...f,
      category_ids: f.category_ids.includes(id) ? f.category_ids.filter((c) => c !== id) : [...f.category_ids, id],
    }));

  const saveBrand = async () => {
    if (!brandForm.brand_name.trim()) { showToast("error", "Vui lòng nhập tên thương hiệu!"); return; }
    setBrandSaving(true);
    try {
      const url = brandEditId ? `${API_BASE}/api/brands/${brandEditId}` : `${API_BASE}/api/brands`;
      const method = brandEditId ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(brandForm),
      });
      const json = await res.json();
      if (json.success) {
        setBrandModalOpen(false);
        fetchAll();
        showToast("success", brandEditId ? "Cập nhật thương hiệu thành công!" : "Thêm thương hiệu thành công!");
      } else {
        showToast("error", "Lỗi: " + json.message);
      }
    } catch {
      showToast("error", "Lỗi kết nối máy chủ!");
    } finally {
      setBrandSaving(false);
    }
  };

  const deleteBrand = (id: number, name: string) => {
    setConfirmState({
      open: true,
      title: "Xoá thương hiệu",
      message: `Bạn có chắc muốn xoá "${name}"? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        try {
          const res = await fetch(`${API_BASE}/api/brands/${id}`, { method: "DELETE", headers: authHeaders() });
          const json = await res.json();
          if (json.success) { fetchAll(); showToast("success", "Đã xoá thương hiệu thành công!"); }
          else showToast("error", "Lỗi: " + json.message);
        } catch {
          showToast("error", "Lỗi kết nối máy chủ!");
        }
      },
    });
  };

  const categoryNameById = (id: number) => categories.find((c) => c.category_id === id)?.category_name || `#${id}`;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {confirmState.open && (
        <ConfirmDialog
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
        />
      )}

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 m-0 tracking-tight">Danh mục</h1>
          <p className="text-[12.5px] text-gray-400 mt-1 mb-0">
            Trang chủ / <span className="text-gray-700 font-medium">Danh mục</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="flex items-center gap-2 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] bg-white text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
            <RefreshCw size={14} /> Làm mới
          </button>
          <button
            onClick={tab === "categories" ? openAddCategory : openAddBrand}
            className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white border-none px-4 py-2.5 rounded-xl text-[13.5px] font-semibold cursor-pointer transition-colors"
          >
            <Plus size={15} /> {tab === "categories" ? "Thêm danh mục" : "Thêm thương hiệu"}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4 w-fit">
        <button
          onClick={() => setTab("categories")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-colors ${tab === "categories" ? "bg-white text-[#D32F2F] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <FolderOpen size={14} /> Danh mục ({categories.length})
        </button>
        <button
          onClick={() => setTab("brands")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-colors ${tab === "brands" ? "bg-white text-[#D32F2F] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Tag size={14} /> Thương hiệu ({brands.length})
        </button>
      </div>

      {/* ── Categories table ── */}
      {tab === "categories" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
              <thead className="bg-gray-50 border-b-2 border-gray-100">
                <tr>
                  {["Ảnh", "Tên danh mục", "Slug", "Số thương hiệu", "Trạng thái"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-[11.5px] text-gray-500 uppercase tracking-[0.5px] whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold text-[11.5px] text-gray-500 uppercase tracking-[0.5px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: "70%" }} /></td>
                      ))}
                    </tr>
                  ))
                ) : categories.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                    <FolderOpen size={36} className="mx-auto mb-3 text-gray-300" />
                    <div className="text-[14px] font-medium text-gray-500">Chưa có danh mục nào</div>
                  </td></tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.category_id} className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="w-11 h-11 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                          {c.image_url ? <img src={c.image_url} alt={c.category_name} className="w-full h-full object-cover" /> : <FolderOpen size={18} className="text-gray-300" />}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-[13px] font-medium text-gray-900">{c.category_name}</div>
                        {c.description && <div className="text-[11.5px] text-gray-400 mt-0.5 max-w-[260px] truncate">{c.description}</div>}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">{c.slug}</td>
                      <td className="px-4 py-3.5 text-gray-600 tabular-nums">{c.brandCount}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[12px] font-medium border ${c.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === "active" ? "bg-emerald-600" : "bg-gray-400"}`} />
                          {c.status === "active" ? "Hoạt động" : "Ngừng hiển thị"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openEditCategory(c)} title="Chỉnh sửa" className="w-8 h-8 border border-emerald-200 rounded-sm bg-emerald-50 hover:bg-emerald-100 cursor-pointer inline-flex items-center justify-center transition-colors">
                            <Edit2 size={14} className="text-emerald-700" />
                          </button>
                          <button onClick={() => deleteCategory(c.category_id, c.category_name)} title="Xoá" className="w-8 h-8 border border-red-200 rounded-sm bg-red-50 hover:bg-red-100 cursor-pointer inline-flex items-center justify-center transition-colors">
                            <Trash2 size={14} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Brands table ── */}
      {tab === "brands" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
              <thead className="bg-gray-50 border-b-2 border-gray-100">
                <tr>
                  {["Logo", "Tên thương hiệu", "Thuộc danh mục", "Trạng thái"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-[11.5px] text-gray-500 uppercase tracking-[0.5px] whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold text-[11.5px] text-gray-500 uppercase tracking-[0.5px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: "70%" }} /></td>
                      ))}
                    </tr>
                  ))
                ) : brands.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-16 text-gray-400">
                    <Tag size={36} className="mx-auto mb-3 text-gray-300" />
                    <div className="text-[14px] font-medium text-gray-500">Chưa có thương hiệu nào</div>
                  </td></tr>
                ) : (
                  brands.map((b) => (
                    <tr key={b.brand_id} className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="w-11 h-11 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                          {b.logo ? <img src={b.logo} alt={b.brand_name} className="w-full h-full object-contain p-1.5" /> : <Tag size={18} className="text-gray-300" />}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-[13px] font-medium text-gray-900">{b.brand_name}</div>
                        {b.description && <div className="text-[11.5px] text-gray-400 mt-0.5 max-w-[260px] truncate">{b.description}</div>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {(b.category_ids || []).length === 0
                            ? <span className="text-gray-400 text-[12px]">—</span>
                            : b.category_ids.map((cid) => (
                                <span key={cid} className="text-[11px] px-2 py-0.5 rounded-sm bg-gray-100 text-gray-600 border border-gray-200">
                                  {categoryNameById(cid)}
                                </span>
                              ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[12px] font-medium border ${b.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${b.status === "active" ? "bg-emerald-600" : "bg-gray-400"}`} />
                          {b.status === "active" ? "Hoạt động" : "Ngừng hiển thị"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openEditBrand(b)} title="Chỉnh sửa" className="w-8 h-8 border border-emerald-200 rounded-sm bg-emerald-50 hover:bg-emerald-100 cursor-pointer inline-flex items-center justify-center transition-colors">
                            <Edit2 size={14} className="text-emerald-700" />
                          </button>
                          <button onClick={() => deleteBrand(b.brand_id, b.brand_name)} title="Xoá" className="w-8 h-8 border border-red-200 rounded-sm bg-red-50 hover:bg-red-100 cursor-pointer inline-flex items-center justify-center transition-colors">
                            <Trash2 size={14} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Category modal ── */}
      {catModalOpen && (
        <div className="fixed inset-0 bg-black/45 z-[100] flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl w-[520px] max-h-[92vh] flex flex-col border border-gray-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF5F5] flex items-center justify-center">
                  <FolderOpen size={16} className="text-[#D32F2F]" />
                </div>
                <span className="text-[15px] font-bold text-gray-900">{catEditId ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</span>
              </div>
              <button onClick={() => setCatModalOpen(false)} className="w-8 h-8 border border-gray-200 rounded-xl bg-white hover:bg-gray-100 cursor-pointer flex items-center justify-center transition-colors">
                <X size={15} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <FormLabel>Tên danh mục *</FormLabel>
                <input value={catForm.category_name} onChange={(e) => setCatForm((f) => ({ ...f, category_name: e.target.value }))} placeholder="VD: Điện thoại" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <FormLabel>Mô tả</FormLabel>
                <textarea value={catForm.description} onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về danh mục..." rows={3} className={`${inputCls} resize-none`} />
              </div>
              <div className="flex flex-col gap-1.5">
                <FormLabel>URL ảnh đại diện</FormLabel>
                <input value={catForm.image_url} onChange={(e) => setCatForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="https://..." className={inputCls} />
                {catForm.image_url && (
                  <div className="mt-1.5 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-[100px] flex items-center justify-center">
                    <img src={catForm.image_url} alt="Preview" className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <FormLabel>Trạng thái</FormLabel>
                <select value={catForm.status} onChange={(e) => setCatForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))} className={inputCls}>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngừng hiển thị</option>
                </select>
              </div>
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-2.5 bg-gray-50/60 shrink-0">
              <button onClick={() => setCatModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-[13.5px] text-gray-600 hover:bg-gray-50 cursor-pointer font-medium transition-colors">Huỷ</button>
              <button onClick={saveCategory} disabled={catSaving} className="px-5 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] disabled:bg-red-300 text-white border-none text-[13.5px] font-semibold cursor-pointer disabled:cursor-default transition-colors">
                {catSaving ? "Đang lưu..." : "Lưu danh mục"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Brand modal ── */}
      {brandModalOpen && (
        <div className="fixed inset-0 bg-black/45 z-[100] flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl w-[520px] max-h-[92vh] flex flex-col border border-gray-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF5F5] flex items-center justify-center">
                  <Tag size={16} className="text-[#D32F2F]" />
                </div>
                <span className="text-[15px] font-bold text-gray-900">{brandEditId ? "Chỉnh sửa thương hiệu" : "Thêm thương hiệu mới"}</span>
              </div>
              <button onClick={() => setBrandModalOpen(false)} className="w-8 h-8 border border-gray-200 rounded-xl bg-white hover:bg-gray-100 cursor-pointer flex items-center justify-center transition-colors">
                <X size={15} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <FormLabel>Tên thương hiệu *</FormLabel>
                <input value={brandForm.brand_name} onChange={(e) => setBrandForm((f) => ({ ...f, brand_name: e.target.value }))} placeholder="VD: Apple" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <FormLabel>URL logo</FormLabel>
                <input value={brandForm.logo} onChange={(e) => setBrandForm((f) => ({ ...f, logo: e.target.value }))} placeholder="https://..." className={inputCls} />
                {brandForm.logo && (
                  <div className="mt-1.5 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-[80px] flex items-center justify-center">
                    <img src={brandForm.logo} alt="Preview" className="max-h-full max-w-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <FormLabel>Mô tả</FormLabel>
                <textarea value={brandForm.description} onChange={(e) => setBrandForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về thương hiệu..." rows={2} className={`${inputCls} resize-none`} />
              </div>
              <div className="flex flex-col gap-1.5">
                <FormLabel>Thuộc danh mục (chọn 1 hoặc nhiều)</FormLabel>
                <div className="flex flex-wrap gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
                  {categories.length === 0 ? (
                    <span className="text-gray-400 text-[12.5px]">Chưa có danh mục nào - hãy tạo danh mục trước</span>
                  ) : (
                    categories.map((c) => {
                      const checked = brandForm.category_ids.includes(c.category_id);
                      return (
                        <button
                          key={c.category_id}
                          type="button"
                          onClick={() => toggleBrandCategory(c.category_id)}
                          className={`px-3 py-1.5 rounded-sm text-[12.5px] font-medium border cursor-pointer transition-colors ${checked ? "bg-[#D32F2F] text-white border-[#D32F2F]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                        >
                          {c.category_name}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <FormLabel>Trạng thái</FormLabel>
                <select value={brandForm.status} onChange={(e) => setBrandForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))} className={inputCls}>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngừng hiển thị</option>
                </select>
              </div>
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-2.5 bg-gray-50/60 shrink-0">
              <button onClick={() => setBrandModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-[13.5px] text-gray-600 hover:bg-gray-50 cursor-pointer font-medium transition-colors">Huỷ</button>
              <button onClick={saveBrand} disabled={brandSaving} className="px-5 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] disabled:bg-red-300 text-white border-none text-[13.5px] font-semibold cursor-pointer disabled:cursor-default transition-colors">
                {brandSaving ? "Đang lưu..." : "Lưu thương hiệu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
