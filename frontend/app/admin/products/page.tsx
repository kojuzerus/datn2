"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, RefreshCw, Plus, Download, Upload,
  Eye, Edit2, Trash2, CheckCircle, XCircle, X, AlertTriangle, Package,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Variant {
  variant_id: number;
  color: string;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  sku: string;
  image?: string;
}

interface Product {
  id: number;
  ten: string;
  slug: string;
  thuongHieu: string;
  thumbnail: string;
  moTa: string;
  gia: number;
  giaSale: number | null;
  giamGia: number;
  danhGia: number;
  luotDanhGia: number;
  luotBan: number;
  badge: string;
  categoryName: string;
  warranty: string;
  variants: Variant[];
  sku?: string;
  status?: "active" | "inactive";
  category_id?: number;
  brand_id?: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProductForm {
  product_name: string;
  sku: string;
  category_id: string;
  brand_id: string;
  warranty: string;
  badge: string;
  short_description: string;
  thumbnail: string;
  status: "active" | "inactive";
  variants: { color: string; price: string; sale_price: string; stock_quantity: string; image: string }[];
  specification: { label: string; value: string }[];
}

interface CategoryOption { category_id: number; category_name: string; }
interface BrandOption    { brand_id: number;    brand_name: string;    }

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

const EMPTY_FORM: ProductForm = {
  product_name: "", sku: "", category_id: "", brand_id: "",
  warranty: "", badge: "", short_description: "", thumbnail: "",
  status: "active",
  variants: [{ color: "", price: "", sale_price: "", stock_quantity: "", image: "" }],
  specification: [],
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const authHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("smarthub_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const vnd = (n: number | null) =>
  n != null ? n.toLocaleString("vi-VN") + " đ" : "—";

const totalStock = (variants: Variant[]) =>
  variants.reduce((s, v) => s + (v.stock_quantity ?? 0), 0);

function stockBadge(qty: number) {
  if (qty === 0)   return { label: `${qty}`,   cls: "text-red-700 bg-red-50 border-red-200"   };
  if (qty < 10)    return { label: `${qty}`,   cls: "text-amber-700 bg-amber-50 border-amber-200" };
  return             { label: `${qty}`,   cls: "text-emerald-700 bg-emerald-50 border-emerald-200" };
}

function statusInfo(p: Product) {
  if (p.status === "inactive")
    return { label: "Ngừng bán", dot: "#D97706", bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" };
  if (totalStock(p.variants ?? []) === 0)
    return { label: "Hết hàng",  dot: "#DC2626", bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" };
  return   { label: "Hoạt động", dot: "#15803D", bg: "#F0FDF4", color: "#166534", border: "#BBF7D0" };
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[500] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[280px] max-w-[360px] pointer-events-auto
            ${t.type === "success"
              ? "bg-white border-emerald-200 text-emerald-800"
              : "bg-white border-red-200 text-red-800"}
          `}
        >
          {t.type === "success"
            ? <CheckCircle size={16} className="text-emerald-600 shrink-0" />
            : <XCircle    size={16} className="text-red-600 shrink-0" />}
          <span className="flex-1 text-[13px] font-medium">{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
  title, message, onConfirm, onCancel,
}: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-sm w-[380px] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-red-600" />
          </div>
          <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">{title}</h3>
          <p className="text-[13px] text-gray-500 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-[13.5px] font-semibold hover:bg-red-700 transition-colors cursor-pointer"
          >
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Label component ───────────────────────────────────────────────────────────
function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11.5px] font-semibold text-gray-500 uppercase tracking-[0.5px]">
      {children}
    </span>
  );
}

const inputCls = "w-full border border-gray-200 rounded-sm px-3 py-2.5 text-[13.5px] text-gray-900 bg-white outline-none focus:border-[#D32F2F] focus:ring-[2px] focus:ring-[rgba(211,47,47,0.1)] transition-all placeholder-gray-400 font-sans";

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading]       = useState(false);

  // Filters
  const [search, setSearch]             = useState("");
  const [catFilter, setCatFilter]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stockFilter, setStockFilter]   = useState("");
  const [page, setPage]                 = useState(1);
  const [limit, setLimit]               = useState(10);

  // Categories & Brands
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands]         = useState<BrandOption[]>([]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId]       = useState<number | null>(null);
  const [form, setForm]           = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Confirm
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false, title: "", message: "", onConfirm: () => {},
  });

  // ── AI generate ───────────────────────────────────────────────────────────
  const generateWithAI = async () => {
    if (!form.product_name.trim()) {
      showToast("error", "Nhập tên sản phẩm trước khi dùng AI");
      return;
    }
    setAiLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/ai/generate-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name: form.product_name, category: form.category_id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      const d = json.data;

      // Auto-thêm biến thể (tính trước để tái dùng cho fetch ảnh biến thể)
      const variantsFromAI = Array.isArray(d.variants) && d.variants.length
        ? d.variants.map((v: any) => {
            const price = Number(v.price) || 0;
            const sp    = Number(v.sale_price);
            const validSale = sp > 0 && sp < price;
            return {
              color:          String(v.color || ""),
              price:          String(price),
              sale_price:     validSale ? String(sp) : "",
              stock_quantity: String(Number(v.stock_quantity) || 0),
              image:          "",
            };
          })
        : null;

      setForm((prev) => {
        const next = { ...prev };

        // Điền các field text
        if (d.short_description) next.short_description = d.short_description;
        if (d.badge)             next.badge             = d.badge;
        if (d.warranty)          next.warranty          = d.warranty;
        if (d.sku)               next.sku               = d.sku;

        // Auto-chọn danh mục
        if (d.category_name && categories.length) {
          const name = d.category_name.toLowerCase();
          const found = categories.find(c =>
            c.category_name.toLowerCase().includes(name) ||
            name.includes(c.category_name.toLowerCase())
          );
          if (found) next.category_id = String(found.category_id);
        }

        // Auto-chọn thương hiệu
        if (d.brand_name && brands.length) {
          const name = d.brand_name.toLowerCase();
          const found = brands.find(b =>
            b.brand_name.toLowerCase().includes(name) ||
            name.includes(b.brand_name.toLowerCase())
          );
          if (found) next.brand_id = String(found.brand_id);
        }

        // Auto-thêm biến thể
        if (variantsFromAI) next.variants = variantsFromAI;

        // Auto-điền thông số kỹ thuật
        if (Array.isArray(d.specification) && d.specification.length) {
          next.specification = d.specification.map((s: any) => ({
            label: String(s.label || ""),
            value: String(s.value || ""),
          }));
        }

        return next;
      });

      showToast("success", "AI đã điền thông tin, đang tìm ảnh và giá thị trường...");

      const fetchImage = async (query: string) => {
        try {
          const r = await fetch(`${API_BASE}/api/ai/search-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ name: query }),
          });
          const j = await r.json();
          return j.success ? j.imageUrl : null;
        } catch {
          return null;
        }
      };

      const fetchMarketPrice = async () => {
        try {
          const r = await fetch(`${API_BASE}/api/ai/market-price`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ name: form.product_name }),
          });
          const j = await r.json();
          return j.success ? { price: j.price, sale_price: j.sale_price } : null;
        } catch {
          return null;
        }
      };

      // Tự động tìm ảnh sản phẩm chính + ảnh riêng cho từng biến thể + giá thị trường CellphoneS (song song)
      const [mainImage, marketPrice, ...variantImages] = await Promise.all([
        fetchImage(form.product_name),
        fetchMarketPrice(),
        ...(variantsFromAI ?? []).map((v: { color: string }) =>
          v.color ? fetchImage(`${form.product_name} màu ${v.color}`) : Promise.resolve(null)
        ),
      ]);

      setForm((prev) => {
        // Hiệu chỉnh giá AI theo tỷ lệ giá thị trường thực tế (CellphoneS), giữ nguyên chênh lệch giữa các biến thể
        let variants = prev.variants.map((v, i) => ({ ...v, image: variantImages[i] || v.image }));
        if (marketPrice?.price) {
          const basePrice = Math.min(...variants.map((v) => Number(v.price) || Infinity));
          const scale     = basePrice > 0 && basePrice !== Infinity ? marketPrice.price / basePrice : 1;
          const baseIdx   = variants.findIndex((v) => Number(v.price) === basePrice);
          variants = variants.map((v, i) => {
            if (i === baseIdx) {
              return { ...v, price: String(marketPrice.price), sale_price: marketPrice.sale_price ? String(marketPrice.sale_price) : "" };
            }
            const scaledPrice = Math.round((Number(v.price) * scale) / 1000) * 1000;
            const scaledSale  = v.sale_price ? Math.round((Number(v.sale_price) * scale) / 1000) * 1000 : null;
            return { ...v, price: String(scaledPrice), sale_price: scaledSale ? String(scaledSale) : "" };
          });
        }
        return { ...prev, thumbnail: mainImage || prev.thumbnail, variants };
      });

      const parts = [
        mainImage ? "ảnh sản phẩm" : null,
        marketPrice?.price ? "giá thị trường" : null,
      ].filter(Boolean);
      showToast(
        parts.length ? "success" : "error",
        parts.length ? `Đã cập nhật ${parts.join(", ")}!` : "Không tìm được ảnh/giá tham khảo"
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      showToast("error", "AI lỗi: " + msg);
    } finally {
      setAiLoading(false);
    }
  };

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const showToast = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Confirm helper ────────────────────────────────────────────────────────
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ open: true, title, message, onConfirm });
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: statusFilter || "all",
        ...(search    && { search }),
        ...(catFilter && { category_name: catFilter }),
      });
      const res  = await fetch(`${API_BASE}/api/products?${params}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
        setPagination(json.pagination);
      }
    } catch (err) {
      console.error("[fetchProducts]", err);
      showToast("error", "Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, catFilter, statusFilter, showToast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/categories`).then(r => r.json()),
      fetch(`${API_BASE}/api/brands`).then(r => r.json()),
    ]).then(([catJson, brandJson]) => {
      if (catJson.success)   setCategories(catJson.data);
      if (brandJson.success) setBrands(brandJson.data);
    }).catch(() => {});
  }, []);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      product_name:      p.ten,
      sku:               p.sku ?? "",
      category_id:       String(p.category_id ?? ""),
      brand_id:          String(p.brand_id ?? ""),
      warranty:          p.warranty ?? "",
      badge:             p.badge ?? "",
      short_description: p.moTa ?? "",
      thumbnail:         p.thumbnail ?? "",
      status:            p.status ?? "active",
      variants: p.variants?.length
        ? p.variants.map((v) => ({
            color:          v.color,
            price:          String(v.price),
            sale_price:     v.sale_price != null ? String(v.sale_price) : "",
            stock_quantity: String(v.stock_quantity),
            image:          v.image ?? "",
          }))
        : [{ color: "", price: "", sale_price: "", stock_quantity: "", image: "" }],
      specification: (p as any).specification?.length
        ? (p as any).specification.map((s: any) => ({ label: s.label || "", value: s.value || "" }))
        : [],
    });
    setModalOpen(true);
  };

  const setField = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addVariant = () =>
    setForm((f) => ({
      ...f,
      variants: [...f.variants, { color: "", price: "", sale_price: "", stock_quantity: "", image: "" }],
    }));

  const removeVariant = (i: number) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));

  const updateVariant = (i: number, k: string, v: string) =>
    setForm((f) => {
      const variants = [...f.variants];
      variants[i] = { ...variants[i], [k]: v };
      return { ...f, variants };
    });

  const addSpec = () =>
    setForm((f) => ({ ...f, specification: [...f.specification, { label: "", value: "" }] }));

  const removeSpec = (i: number) =>
    setForm((f) => ({ ...f, specification: f.specification.filter((_, idx) => idx !== i) }));

  const updateSpec = (i: number, k: "label" | "value", v: string) =>
    setForm((f) => {
      const specification = [...f.specification];
      specification[i] = { ...specification[i], [k]: v };
      return { ...f, specification };
    });

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveProduct = async () => {
    if (!form.product_name.trim()) {
      showToast("error", "Vui lòng nhập tên sản phẩm!");
      return;
    }
    setSaving(true);
    try {
      const body = {
        product_name:      form.product_name,
        sku:               form.sku,
        category_id:       form.category_id ? parseInt(form.category_id) : null,
        brand_id:          form.brand_id    ? parseInt(form.brand_id)    : null,
        warranty:          form.warranty,
        badge:             form.badge,
        short_description: form.short_description,
        thumbnail:         form.thumbnail,
        status:            form.status,
        variants: form.variants.map((v) => ({
          color:          v.color,
          price:          parseFloat(v.price)          || 0,
          sale_price:     v.sale_price ? parseFloat(v.sale_price) : null,
          stock_quantity: parseInt(v.stock_quantity)   || 0,
          image:          v.image || "",
        })),
        specification: form.specification.filter(s => s.label.trim() || s.value.trim()),
      };
      const url    = editId ? `${API_BASE}/api/products/${editId}` : `${API_BASE}/api/products`;
      const method = editId ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        fetchProducts();
        showToast("success", editId ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm thành công!");
      } else {
        showToast("error", "Lỗi: " + json.message);
      }
    } catch {
      showToast("error", "Lỗi kết nối máy chủ!");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteProduct = (id: number, name: string) => {
    showConfirm(
      "Xoá sản phẩm",
      `Bạn có chắc muốn xoá "${name}"? Hành động này không thể hoàn tác.`,
      async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        try {
          const res  = await fetch(`${API_BASE}/api/products/${id}`, { method: "DELETE", headers: authHeaders() });
          const json = await res.json();
          if (json.success) {
            fetchProducts();
            showToast("success", "Đã xoá sản phẩm thành công!");
          } else {
            showToast("error", "Lỗi: " + json.message);
          }
        } catch {
          showToast("error", "Lỗi kết nối máy chủ!");
        }
      },
    );
  };

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(products.map((p) => p.id)) : new Set());

  const toggleRow = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Client-side stock filter
  const displayed = stockFilter
    ? products.filter((p) => {
        const qty = totalStock(p.variants ?? []);
        if (stockFilter === "in")  return qty > 0;
        if (stockFilter === "low") return qty > 0 && qty < 10;
        if (stockFilter === "out") return qty === 0;
        return true;
      })
    : products;

  // ── Render ────────────────────────────────────────────────────────────────
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
          <h1 className="text-[22px] font-bold text-gray-900 m-0 tracking-tight">Quản lý sản phẩm</h1>
          <p className="text-[12.5px] text-gray-400 mt-1 mb-0">
            Trang chủ / <span className="text-gray-700 font-medium">Quản lý sản phẩm</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] bg-white text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
            <Upload size={14} /> Nhập Excel
          </button>
          <button className="flex items-center gap-2 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] bg-white text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
            <Download size={14} /> Xuất Excel
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white border-none px-4 py-2.5 rounded-xl text-[13.5px] font-semibold cursor-pointer transition-colors"
          >
            <Plus size={15} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* ── Filter box ── */}
      <div className="bg-white border border-gray-200 rounded-sm p-5 mb-4">
        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr auto" }}>

          <div className="flex flex-col gap-1.5">
            <FormLabel>Tên sản phẩm</FormLabel>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
                placeholder="Tìm theo tên..."
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FormLabel>Danh mục</FormLabel>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className={inputCls}>
              <option value="">Tất cả danh mục</option>
              <option value="Điện thoại">Điện thoại</option>
              <option value="Laptop">Laptop</option>
              <option value="Phụ kiện">Phụ kiện</option>
              <option value="Tivi">Tivi</option>
              <option value="Máy tính bảng">Máy tính bảng</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <FormLabel>Trạng thái</FormLabel>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng bán</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <FormLabel>Kho hàng</FormLabel>
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className={inputCls}>
              <option value="">Tất cả kho</option>
              <option value="in">Còn hàng</option>
              <option value="low">Sắp hết (&lt;10)</option>
              <option value="out">Hết hàng</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => { setPage(1); fetchProducts(); }}
              className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white border-none px-4 h-10 rounded-xl text-[13.5px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
            >
              <Search size={14} /> Tìm
            </button>
            <button
              onClick={() => { setSearch(""); setCatFilter(""); setStatusFilter(""); setStockFilter(""); setPage(1); }}
              className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 h-10 text-[13px] bg-white text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors"
              title="Làm mới bộ lọc"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#FFF5F5] border border-[#FECACA] rounded-xl mb-3 text-[13.5px] text-[#D32F2F] font-medium">
          <CheckCircle size={15} className="shrink-0" />
          Đã chọn {selected.size} sản phẩm
          <button className="ml-2 px-3 py-1 border border-[#FECACA] rounded-sm bg-white text-[#D32F2F] text-[12.5px] hover:bg-[#FFF5F5] cursor-pointer transition-colors">
            Ẩn đã chọn
          </button>
          <button className="px-3 py-1 border border-[#FECACA] rounded-sm bg-[#D32F2F] text-white text-[12.5px] hover:bg-[#B71C1C] cursor-pointer transition-colors">
            Xoá đã chọn
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
            <colgroup>
              <col style={{ width: 44 }} />
              <col style={{ width: 44 }} />
              <col style={{ width: 68 }} />
              <col />
              <col style={{ width: 120 }} />
              <col style={{ width: 148 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 118 }} />
              <col style={{ width: 118 }} />
            </colgroup>
            <thead className="bg-gray-50 border-b-2 border-gray-100">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.size === products.length && products.length > 0}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="w-[15px] h-[15px] cursor-pointer accent-[#D32F2F]"
                  />
                </th>
                {["#", "Ảnh", "Tên sản phẩm", "Danh mục", "Giá bán", "Tồn kho", "Trạng thái"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-[11.5px] text-gray-500 uppercase tracking-[0.5px] whitespace-nowrap">
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-semibold text-[11.5px] text-gray-500 uppercase tracking-[0.5px]">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                // Skeleton rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 3 ? "80%" : "60%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">
                    <div className="text-[40px] mb-3">📦</div>
                    <div className="text-[14px] font-medium text-gray-500">Không tìm thấy sản phẩm phù hợp</div>
                    <div className="text-[12.5px] text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</div>
                  </td>
                </tr>
              ) : (
                displayed.map((p, i) => {
                  const si    = statusInfo(p);
                  const qty   = totalStock(p.variants ?? []);
                  const sb    = stockBadge(qty);
                  const isSel = selected.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${isSel ? "bg-[#FFF5F5]" : "hover:bg-gray-50/70"}`}
                      onClick={() => openEdit(p)}
                    >
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleRow(p.id)}
                          className="w-[15px] h-[15px] cursor-pointer accent-[#D32F2F]"
                        />
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 text-[12.5px]">
                        {(pagination.page - 1) * pagination.limit + i + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="w-12 h-12 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                          {p.thumbnail
                            ? <img src={p.thumbnail} alt={p.ten} className="w-full h-full object-cover" />
                            : <span className="text-[22px]">📱</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="text-[13.5px] font-medium text-gray-900 max-w-[210px] truncate">
                            {p.ten}
                          </div>
                          {p.badge && (
                            <span className="shrink-0 bg-amber-50 text-amber-700 border border-amber-200 text-[10.5px] px-2 py-0.5 rounded-md font-medium">
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11.5px] text-gray-400 mt-0.5">SKU: {p.sku || "—"}</div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-[13px]">{p.categoryName || "—"}</td>
                      <td className="px-4 py-3.5">
                        {p.giaSale != null ? (
                          <>
                            <div className="text-[#D32F2F] font-semibold">{vnd(p.giaSale)}</div>
                            <div className="text-[11.5px] text-gray-400 line-through">{vnd(p.gia)}</div>
                          </>
                        ) : (
                          <div className="text-[#D32F2F] font-semibold">{vnd(p.gia)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[12.5px] font-bold border ${sb.cls}`}>
                          {sb.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[12px] font-medium border"
                          style={{ background: si.bg, color: si.color, borderColor: si.border }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: si.dot }} />
                          {si.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="Xem trang sản phẩm"
                            onClick={() => window.open(`/products/${p.slug}`, "_blank")}
                            className="w-8 h-8 border border-gray-200 rounded-sm bg-white hover:bg-gray-50 hover:border-gray-300 cursor-pointer flex items-center justify-center transition-colors"
                          >
                            <Eye size={14} className="text-gray-500" />
                          </button>
                          <button
                            title="Chỉnh sửa"
                            onClick={() => openEdit(p)}
                            className="w-8 h-8 border border-emerald-200 rounded-sm bg-emerald-50 hover:bg-emerald-100 cursor-pointer flex items-center justify-center transition-colors"
                          >
                            <Edit2 size={14} className="text-emerald-700" />
                          </button>
                          <button
                            title="Xoá"
                            onClick={() => deleteProduct(p.id, p.ten)}
                            className="w-8 h-8 border border-red-200 rounded-sm bg-red-50 hover:bg-red-100 cursor-pointer flex items-center justify-center transition-colors"
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

        {/* Pagination */}
        <div className="flex items-center px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 gap-3">
          <div className="flex items-center gap-2 text-[13px] text-gray-500">
            Hiển thị
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="border border-gray-200 rounded-sm px-2 py-1 text-[13px] outline-none cursor-pointer bg-white"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            / trang
          </div>

          <div className="text-[12.5px] text-gray-400 ml-auto">
            {pagination.total > 0
              ? `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} trong ${pagination.total} sản phẩm`
              : "0 sản phẩm"}
          </div>

          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 rounded-sm border border-gray-200 bg-white text-[13px] flex items-center justify-center cursor-pointer hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition-colors"
            >‹</button>

            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-sm border text-[13px] flex items-center justify-center cursor-pointer transition-colors ${
                  page === n
                    ? "bg-[#D32F2F] text-white border-[#D32F2F] font-semibold"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >{n}</button>
            ))}

            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded-sm border border-gray-200 bg-white text-[13px] flex items-center justify-center cursor-pointer hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition-colors"
            >›</button>
          </div>
        </div>
      </div>

      {/* ── Modal thêm / sửa ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/45 z-[100] flex items-center justify-center p-5">
          <div className="bg-white rounded-sm w-[720px] max-h-[92vh] flex flex-col border border-gray-100 shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF5F5] flex items-center justify-center">
                  <Package size={16} className="text-[#D32F2F]" />
                </div>
                <span className="text-[15px] font-bold text-gray-900">
                  {editId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={generateWithAI}
                  disabled={aiLoading}
                  title="Dùng AI để tự điền thông tin (cần nhập tên sản phẩm trước)"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-violet-50 border border-violet-200 text-violet-700 text-[12.5px] font-semibold hover:bg-violet-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {aiLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-[14px]">✨</span>
                  )}
                  {aiLoading ? "Đang tạo..." : "AI gợi ý"}
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 border border-gray-200 rounded-xl bg-white hover:bg-gray-100 cursor-pointer flex items-center justify-center transition-colors"
                >
                  <X size={15} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 flex flex-col gap-5">

              {/* Section: Thông tin cơ bản */}
              <div>
                <div className="text-[11.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-gray-300" /> Thông tin cơ bản <span className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <FormLabel>Tên sản phẩm *</FormLabel>
                    <input
                      value={form.product_name}
                      onChange={(e) => setField("product_name", e.target.value)}
                      placeholder="VD: iPhone 16 Pro Max"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel>SKU</FormLabel>
                    <input
                      value={form.sku}
                      onChange={(e) => setField("sku", e.target.value)}
                      placeholder="VD: APL-IP16PM"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Phân loại */}
              <div>
                <div className="text-[11.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-gray-300" /> Phân loại <span className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <FormLabel>Danh mục</FormLabel>
                    <select value={form.category_id} onChange={(e) => setField("category_id", e.target.value)} className={inputCls}>
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(c => (
                        <option key={c.category_id} value={String(c.category_id)}>{c.category_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel>Thương hiệu</FormLabel>
                    <select value={form.brand_id} onChange={(e) => setField("brand_id", e.target.value)} className={inputCls}>
                      <option value="">-- Chọn thương hiệu --</option>
                      {brands.map(b => (
                        <option key={b.brand_id} value={String(b.brand_id)}>{b.brand_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Chi tiết */}
              <div>
                <div className="text-[11.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-gray-300" /> Chi tiết sản phẩm <span className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <FormLabel>Bảo hành</FormLabel>
                    <input
                      value={form.warranty}
                      onChange={(e) => setField("warranty", e.target.value)}
                      placeholder="VD: 12 tháng chính hãng"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel>Badge</FormLabel>
                    <input
                      value={form.badge}
                      onChange={(e) => setField("badge", e.target.value)}
                      placeholder="VD: Hot, Mới, Sale..."
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <FormLabel>Mô tả ngắn</FormLabel>
                  <textarea
                    value={form.short_description}
                    onChange={(e) => setField("short_description", e.target.value)}
                    placeholder="Mô tả ngắn về sản phẩm..."
                    rows={3}
                    className={`${inputCls} resize-none`}
                    style={{ height: "auto" }}
                  />
                </div>
              </div>

              {/* Section: Hình ảnh & Trạng thái */}
              <div>
                <div className="text-[11.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-gray-300" /> Hình ảnh &amp; Trạng thái <span className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <FormLabel>URL ảnh thumbnail</FormLabel>
                    <input
                      value={form.thumbnail}
                      onChange={(e) => setField("thumbnail", e.target.value)}
                      placeholder="https://..."
                      className={inputCls}
                    />
                    {form.thumbnail && (
                      <div className="mt-1.5 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-[110px] flex items-center justify-center">
                        <img
                          src={form.thumbnail}
                          alt="Preview"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel>Trạng thái</FormLabel>
                    <select
                      value={form.status}
                      onChange={(e) => setField("status", e.target.value as "active" | "inactive")}
                      className={inputCls}
                    >
                      <option value="active">Đang hoạt động</option>
                      <option value="inactive">Ngừng bán</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Thông số kỹ thuật */}
              <div>
                <div className="text-[11.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-gray-300" /> Thông số kỹ thuật <span className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  {form.specification.length > 0 && (
                    <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: "1fr 1fr 32px" }}>
                      {["Tên thông số", "Giá trị", ""].map((h) => (
                        <span key={h} className="text-[10.5px] text-gray-400 font-bold uppercase tracking-[0.5px]">{h}</span>
                      ))}
                    </div>
                  )}
                  {form.specification.map((s, idx) => (
                    <div key={idx} className="grid gap-2 mb-2 items-center" style={{ gridTemplateColumns: "1fr 1fr 32px" }}>
                      <input
                        value={s.label}
                        onChange={(e) => updateSpec(idx, "label", e.target.value)}
                        placeholder="VD: CPU, RAM, Pin..."
                        className="min-w-0 border border-gray-200 rounded-sm px-2.5 py-2 text-[13px] outline-none focus:border-[#D32F2F] bg-white font-sans"
                      />
                      <input
                        value={s.value}
                        onChange={(e) => updateSpec(idx, "value", e.target.value)}
                        placeholder="VD: Apple A17 Pro, 8GB..."
                        className="min-w-0 border border-gray-200 rounded-sm px-2.5 py-2 text-[13px] outline-none focus:border-[#D32F2F] bg-white font-sans"
                      />
                      <button
                        onClick={() => removeSpec(idx)}
                        className="w-7 h-7 border border-red-200 rounded-sm bg-red-50 hover:bg-red-100 cursor-pointer flex items-center justify-center transition-colors"
                      >
                        <X size={12} className="text-red-600" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addSpec}
                    className="w-full py-2 border-2 border-dashed border-gray-300 hover:border-[#D32F2F] rounded-xl text-[13px] text-gray-500 hover:text-[#D32F2F] cursor-pointer bg-transparent transition-colors flex items-center justify-center gap-2 mt-1"
                  >
                    <Plus size={14} /> Thêm thông số
                  </button>
                </div>
              </div>

              {/* Section: Biến thể */}
              <div>
                <div className="text-[11.5px] font-bold text-gray-400 uppercase tracking-[1px] mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-gray-300" /> Biến thể sản phẩm <span className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 32px" }}>
                    {["Màu", "Giá gốc (đ)", "Giá sale (đ)", "Tồn kho", ""].map((h) => (
                      <span key={h} className="text-[10.5px] text-gray-400 font-bold uppercase tracking-[0.5px]">{h}</span>
                    ))}
                  </div>
                  {form.variants.map((v, idx) => (
                    <div key={idx} className="mb-2 pb-2 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                      <div className="grid gap-2 items-center" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 32px" }}>
                        <input
                          value={v.color}
                          onChange={(e) => updateVariant(idx, "color", e.target.value)}
                          placeholder="Đen"
                          className="min-w-0 border border-gray-200 rounded-sm px-2.5 py-2 text-[13px] outline-none focus:border-[#D32F2F] bg-white font-sans"
                        />
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => updateVariant(idx, "price", e.target.value)}
                          placeholder="0"
                          className="min-w-0 border border-gray-200 rounded-sm px-2.5 py-2 text-[13px] outline-none focus:border-[#D32F2F] bg-white font-sans"
                        />
                        <input
                          type="number"
                          value={v.sale_price}
                          onChange={(e) => updateVariant(idx, "sale_price", e.target.value)}
                          placeholder=""
                          className="min-w-0 border border-gray-200 rounded-sm px-2.5 py-2 text-[13px] outline-none focus:border-[#D32F2F] bg-white font-sans"
                        />
                        <input
                          type="number"
                          value={v.stock_quantity}
                          onChange={(e) => updateVariant(idx, "stock_quantity", e.target.value)}
                          placeholder="0"
                          className="min-w-0 border border-gray-200 rounded-sm px-2.5 py-2 text-[13px] outline-none focus:border-[#D32F2F] bg-white font-sans"
                        />
                        <button
                          onClick={() => removeVariant(idx)}
                          className="w-7 h-7 border border-red-200 rounded-sm bg-red-50 hover:bg-red-100 cursor-pointer flex items-center justify-center transition-colors"
                        >
                          <X size={12} className="text-red-600" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {v.image && (
                          <img
                            src={v.image}
                            alt={v.color || "variant"}
                            className="w-9 h-9 rounded-sm border border-gray-200 object-cover shrink-0 bg-white"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        <input
                          value={v.image}
                          onChange={(e) => updateVariant(idx, "image", e.target.value)}
                          placeholder="URL ảnh riêng cho biến thể này (tuỳ chọn)"
                          className="min-w-0 flex-1 border border-gray-200 rounded-sm px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[#D32F2F] bg-white font-sans"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addVariant}
                    className="w-full py-2 border-2 border-dashed border-gray-300 hover:border-[#D32F2F] rounded-xl text-[13px] text-gray-500 hover:text-[#D32F2F] cursor-pointer bg-transparent transition-colors flex items-center justify-center gap-2 mt-1"
                  >
                    <Plus size={14} /> Thêm biến thể
                  </button>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-2.5 bg-gray-50/60 shrink-0">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-[13.5px] text-gray-600 hover:bg-gray-50 cursor-pointer font-medium transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={saveProduct}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] disabled:bg-red-300 text-white border-none text-[13.5px] font-semibold cursor-pointer disabled:cursor-default flex items-center gap-2 transition-colors"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>💾 Lưu sản phẩm</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
