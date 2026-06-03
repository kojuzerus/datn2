"use client";

import { useEffect, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Variant {
  variant_id: number;
  color: string;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  sku: string;
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
  variants: {
    color: string;
    price: string;
    sale_price: string;
    stock_quantity: string;
  }[];
}

const EMPTY_FORM: ProductForm = {
  product_name: "", sku: "", category_id: "", brand_id: "",
  warranty: "", badge: "", short_description: "", thumbnail: "",
  status: "active",
  variants: [{ color: "", price: "", sale_price: "", stock_quantity: "" }],
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Helpers ───────────────────────────────────────────────────────────────────
const vnd = (n: number | null) =>
  n != null ? n.toLocaleString("vi-VN") + " đ" : "—";

const totalStock = (variants: Variant[]) =>
  variants.reduce((s, v) => s + (v.stock_quantity ?? 0), 0);

const stockColor = (qty: number) =>
  qty === 0 ? "#B91C1C" : qty < 10 ? "#D97706" : "#15803D";

function statusInfo(p: Product) {
  if (p.status === "inactive")
    return { label: "Ngừng bán", dot: "#D97706", bg: "#FEF9C3", color: "#92400E", border: "#FDE68A" };
  if (totalStock(p.variants ?? []) === 0)
    return { label: "Hết hàng",  dot: "#B91C1C", bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" };
  return   { label: "Hoạt động", dot: "#15803D", bg: "#F0FDF4", color: "#166534", border: "#BBF7D0" };
}

// ── Component ─────────────────────────────────────────────────────────────────
// Chỉ render NỘI DUNG trang — Sidebar và Topbar đã có trong admin/layout.tsx
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

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId]       = useState<number | null>(null);
  const [form, setForm]           = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search       && { search }),
        ...(catFilter    && { category_name: catFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res  = await fetch(`${API_BASE}/api/products?${params}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
        setPagination(json.pagination);
      }
    } catch (err) {
      console.error("[fetchProducts]", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, catFilter, statusFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

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
          }))
        : [{ color: "", price: "", sale_price: "", stock_quantity: "" }],
    });
    setModalOpen(true);
  };

  const setField = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addVariant = () =>
    setForm((f) => ({
      ...f,
      variants: [...f.variants, { color: "", price: "", sale_price: "", stock_quantity: "" }],
    }));

  const removeVariant = (i: number) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));

  const updateVariant = (i: number, k: string, v: string) =>
    setForm((f) => {
      const variants = [...f.variants];
      variants[i] = { ...variants[i], [k]: v };
      return { ...f, variants };
    });

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveProduct = async () => {
    if (!form.product_name.trim()) { alert("Vui lòng nhập tên sản phẩm!"); return; }
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
        })),
      };
      const url    = editId
        ? `${API_BASE}/api/products/${editId}`
        : `${API_BASE}/api/products`;
      const method = editId ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) { setModalOpen(false); fetchProducts(); }
      else alert("Lỗi: " + json.message);
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối server!");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteProduct = async (id: number, name: string) => {
    if (!confirm(`Xoá sản phẩm:\n"${name}"?\n\nHành động này không thể hoàn tác.`)) return;
    try {
      const res  = await fetch(`${API_BASE}/api/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) fetchProducts();
      else alert("Lỗi: " + json.message);
    } catch (err) {
      console.error(err);
    }
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

  // Shared input style
  const inp: React.CSSProperties = {
    border: "1px solid #E5E7EB", borderRadius: 8,
    padding: "9px 12px", fontSize: 13.5, outline: "none",
    width: "100%", fontFamily: "inherit",
    color: "#111827", background: "#fff", height: 40,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Page header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
            Quản lý sản phẩm
          </h1>
          <p style={{ fontSize: 12.5, color: "#6B7280", margin: "4px 0 0" }}>
            Trang chủ / <span style={{ color: "#111827" }}>Quản lý sản phẩm</span>
          </p>
        </div>
        <div style={{ display:"flex", gap: 8 }}>
          <button style={{ display:"flex", alignItems:"center", gap:6, border:"1px solid #E5E7EB", borderRadius:8, padding:"9px 14px", fontSize:13, background:"#fff", color:"#6B7280", cursor:"pointer" }}>
            📥 Nhập Excel
          </button>
          <button style={{ display:"flex", alignItems:"center", gap:6, border:"1px solid #E5E7EB", borderRadius:8, padding:"9px 14px", fontSize:13, background:"#fff", color:"#6B7280", cursor:"pointer" }}>
            📤 Xuất Excel
          </button>
          <button
            onClick={openAdd}
            style={{ display:"flex", alignItems:"center", gap:7, background:"#D32F2F", color:"#fff", border:"none", padding:"9px 18px", borderRadius:8, fontSize:13.5, fontWeight:600, cursor:"pointer" }}
          >
            + Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* ── Filter box ── */}
      <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:10, padding:"18px 20px", marginBottom:16 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", gap:14, alignItems:"flex-end" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12.5, fontWeight:500, color:"#111827" }}>Tên sản phẩm</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
              placeholder="Nhập tên sản phẩm..."
              style={inp}
            />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12.5, fontWeight:500, color:"#111827" }}>Danh mục</label>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={inp}>
              <option value="">Tất cả danh mục</option>
              <option value="Điện thoại">Điện thoại</option>
              <option value="Laptop">Laptop</option>
              <option value="Phụ kiện">Phụ kiện</option>
              <option value="Tivi">Tivi</option>
              <option value="Máy tính bảng">Máy tính bảng</option>
            </select>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12.5, fontWeight:500, color:"#111827" }}>Trạng thái</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inp}>
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng bán</option>
            </select>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12.5, fontWeight:500, color:"#111827" }}>Kho hàng</label>
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} style={inp}>
              <option value="">Tất cả kho</option>
              <option value="in">Còn hàng</option>
              <option value="low">Sắp hết (&lt;10)</option>
              <option value="out">Hết hàng</option>
            </select>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button
              onClick={() => { setPage(1); fetchProducts(); }}
              style={{ display:"flex", alignItems:"center", gap:6, background:"#D32F2F", color:"#fff", border:"none", padding:"9px 18px", borderRadius:8, fontSize:13.5, fontWeight:600, cursor:"pointer", height:40, whiteSpace:"nowrap", fontFamily:"inherit" }}
            >
              🔍 Tìm kiếm
            </button>
            <button
              onClick={() => { setSearch(""); setCatFilter(""); setStatusFilter(""); setStockFilter(""); setPage(1); }}
              style={{ display:"flex", alignItems:"center", gap:6, border:"1px solid #E5E7EB", borderRadius:8, padding:"9px 14px", fontSize:13, background:"#fff", color:"#6B7280", cursor:"pointer", height:40, whiteSpace:"nowrap", fontFamily:"inherit" }}
            >
              🔄 Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#FFF5F5", border:"1px solid #FECACA", borderRadius:8, marginBottom:12, fontSize:13.5, color:"#D32F2F" }}>
          ✓ Đã chọn {selected.size} sản phẩm
          <button style={{ padding:"4px 12px", border:"1px solid #FECACA", borderRadius:6, background:"#fff", color:"#D32F2F", cursor:"pointer", fontSize:13 }}>Ẩn</button>
          <button style={{ padding:"4px 12px", border:"1px solid #FECACA", borderRadius:6, background:"#D32F2F", color:"#fff", cursor:"pointer", fontSize:13 }}>Xoá</button>
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:10, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13.5 }}>
            <colgroup>
              <col style={{ width:40 }} /><col style={{ width:46 }} /><col style={{ width:70 }} />
              <col /><col style={{ width:120 }} /><col style={{ width:150 }} />
              <col style={{ width:100 }} /><col style={{ width:130 }} /><col style={{ width:120 }} />
            </colgroup>
            <thead style={{ background:"#F9FAFB", borderBottom:"1.5px solid #E5E7EB" }}>
              <tr>
                <th style={{ padding:"11px 14px" }}>
                  <input
                    type="checkbox"
                    checked={selected.size === products.length && products.length > 0}
                    onChange={(e) => toggleAll(e.target.checked)}
                    style={{ accentColor:"#D32F2F", cursor:"pointer", width:15, height:15 }}
                  />
                </th>
                {["#","Ảnh","Tên sản phẩm","Danh mục","Giá bán","Tồn kho","Trạng thái"].map((h) => (
                  <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontWeight:500, color:"#6B7280", fontSize:12.5, whiteSpace:"nowrap" }}>
                    {h}
                  </th>
                ))}
                <th style={{ padding:"11px 14px", textAlign:"center", fontWeight:500, color:"#6B7280", fontSize:12.5 }}>
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign:"center", padding:48, color:"#9CA3AF" }}>
                    Đang tải...
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign:"center", padding:48, color:"#9CA3AF" }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>📦</div>
                    Không tìm thấy sản phẩm phù hợp
                  </td>
                </tr>
              ) : (
                displayed.map((p, i) => {
                  const si    = statusInfo(p);
                  const qty   = totalStock(p.variants ?? []);
                  const isSel = selected.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom:"1px solid #E5E7EB", cursor:"pointer", background: isSel ? "#FFF5F5" : undefined, transition:"background .12s" }}
                      onMouseEnter={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = "#FFFAF9"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isSel ? "#FFF5F5" : ""; }}
                      onClick={() => openEdit(p)}
                    >
                      <td style={{ padding:"13px 14px" }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleRow(p.id)}
                          style={{ accentColor:"#D32F2F", cursor:"pointer", width:15, height:15 }}
                        />
                      </td>
                      <td style={{ padding:"13px 14px", color:"#9CA3AF", fontSize:13 }}>
                        {(pagination.page - 1) * pagination.limit + i + 1}
                      </td>
                      <td style={{ padding:"13px 14px" }}>
                        <div style={{ width:48, height:48, borderRadius:8, border:"1px solid #E5E7EB", background:"#F9FAFB", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                          {p.thumbnail
                            ? <img src={p.thumbnail} alt={p.ten} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                            : <span style={{ fontSize:22 }}>📱</span>}
                        </div>
                      </td>
                      <td style={{ padding:"13px 14px" }}>
                        <div style={{ fontSize:13.5, fontWeight:500, maxWidth:220, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {p.ten}
                          {p.badge && (
                            <span style={{ marginLeft:6, background:"#FEF3C7", color:"#92400E", fontSize:11, padding:"2px 6px", borderRadius:4, fontWeight:500 }}>
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>SKU: {p.sku || "—"}</div>
                      </td>
                      <td style={{ padding:"13px 14px", color:"#6B7280", fontSize:13.5 }}>{p.categoryName || "—"}</td>
                      <td style={{ padding:"13px 14px" }}>
                        {p.giaSale != null ? (
                          <>
                            <div style={{ color:"#D32F2F", fontWeight:500 }}>{vnd(p.giaSale)}</div>
                            <div style={{ fontSize:12, color:"#9CA3AF", textDecoration:"line-through" }}>{vnd(p.gia)}</div>
                          </>
                        ) : (
                          <div style={{ color:"#D32F2F", fontWeight:500 }}>{vnd(p.gia)}</div>
                        )}
                      </td>
                      <td style={{ padding:"13px 14px", fontWeight:500, color: stockColor(qty) }}>{qty}</td>
                      <td style={{ padding:"13px 14px" }}>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:6, fontSize:12.5, fontWeight:500, background:si.bg, color:si.color, border:`1px solid ${si.border}` }}>
                          <span style={{ width:6, height:6, borderRadius:"50%", background:si.dot, flexShrink:0 }} />
                          {si.label}
                        </span>
                      </td>
                      <td style={{ padding:"13px 14px" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                          <button title="Xem" onClick={() => window.open(`/products/${p.slug}`, "_blank")}
                            style={{ width:32, height:32, border:"1px solid #E5E7EB", borderRadius:7, background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>👁️</button>
                          <button title="Sửa" onClick={() => openEdit(p)}
                            style={{ width:32, height:32, border:"1px solid #BBF7D0", borderRadius:7, background:"#F0FDF4", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>✏️</button>
                          <button title="Xoá" onClick={() => deleteProduct(p.id, p.ten)}
                            style={{ width:32, height:32, border:"1px solid #FECACA", borderRadius:7, background:"#FEF2F2", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🗑️</button>
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
        <div style={{ display:"flex", alignItems:"center", padding:"12px 16px", borderTop:"1px solid #E5E7EB", background:"#FAFAFA", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#6B7280" }}>
            Hiển thị
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              style={{ border:"1px solid #E5E7EB", borderRadius:6, padding:"4px 8px", fontSize:13, outline:"none", cursor:"pointer" }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            sản phẩm / trang
          </div>

          <div style={{ fontSize:13, color:"#6B7280", marginLeft:"auto" }}>
            {pagination.total > 0
              ? `${(pagination.page - 1) * pagination.limit + 1} – ${Math.min(pagination.page * pagination.limit, pagination.total)} trong ${pagination.total} sản phẩm`
              : "0 sản phẩm"}
          </div>

          <div style={{ display:"flex", gap:4 }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              style={{ width:34, height:34, borderRadius:7, border:"1px solid #E5E7EB", background:"#fff", cursor: page <= 1 ? "default" : "pointer", opacity: page <= 1 ? 0.35 : 1, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}
            >‹</button>

            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                style={{ width:34, height:34, borderRadius:7, border:"1px solid #E5E7EB", background: page === n ? "#D32F2F" : "#fff", color: page === n ? "#fff" : "#6B7280", cursor:"pointer", fontSize:13, fontWeight: page === n ? 600 : 400, display:"flex", alignItems:"center", justifyContent:"center" }}
              >{n}</button>
            ))}

            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{ width:34, height:34, borderRadius:7, border:"1px solid #E5E7EB", background:"#fff", cursor: page >= pagination.totalPages ? "default" : "pointer", opacity: page >= pagination.totalPages ? 0.35 : 1, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}
            >›</button>
          </div>
        </div>
      </div>

      {/* ── Modal thêm / sửa ── */}
      {modalOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"#fff", borderRadius:12, width:700, maxHeight:"90vh", display:"flex", flexDirection:"column", border:"1px solid #E5E7EB", overflow:"hidden" }}>

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 22px", height:54, borderBottom:"1px solid #E5E7EB", background:"#FAFAFA", flexShrink:0 }}>
              <span style={{ fontSize:15, fontWeight:700, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ color:"#D32F2F" }}>📦</span>
                {editId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </span>
              <button onClick={() => setModalOpen(false)} style={{ width:30, height:30, border:"1px solid #E5E7EB", borderRadius:7, background:"#fff", cursor:"pointer", fontSize:16 }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding:22, overflowY:"auto", flex:1, display:"flex", flexDirection:"column", gap:14 }}>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:".4px" }}>Tên sản phẩm *</label>
                  <input value={form.product_name} onChange={(e) => setField("product_name", e.target.value)} placeholder="VD: iPhone 16 Pro Max" style={{ ...inp, height:"auto", padding:"9px 12px" }} />
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:".4px" }}>SKU</label>
                  <input value={form.sku} onChange={(e) => setField("sku", e.target.value)} placeholder="VD: APL-IP16PM" style={{ ...inp, height:"auto", padding:"9px 12px" }} />
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:".4px" }}>Danh mục</label>
                  <select value={form.category_id} onChange={(e) => setField("category_id", e.target.value)} style={{ ...inp, height:"auto", padding:"9px 12px" }}>
                    <option value="">-- Chọn danh mục --</option>
                    <option value="1">Điện thoại</option>
                    <option value="2">Laptop</option>
                    <option value="3">Phụ kiện</option>
                    <option value="4">Tivi</option>
                    <option value="5">Máy tính bảng</option>
                  </select>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:".4px" }}>Thương hiệu</label>
                  <select value={form.brand_id} onChange={(e) => setField("brand_id", e.target.value)} style={{ ...inp, height:"auto", padding:"9px 12px" }}>
                    <option value="">-- Chọn thương hiệu --</option>
                    <option value="1">Samsung</option>
                    <option value="2">Apple</option>
                    <option value="3">Sony</option>
                    <option value="4">LG</option>
                    <option value="5">Xiaomi</option>
                  </select>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:".4px" }}>Bảo hành</label>
                  <input value={form.warranty} onChange={(e) => setField("warranty", e.target.value)} placeholder="VD: 12 tháng chính hãng" style={{ ...inp, height:"auto", padding:"9px 12px" }} />
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:".4px" }}>Badge</label>
                  <input value={form.badge} onChange={(e) => setField("badge", e.target.value)} placeholder="VD: Hot, Mới, Sale..." style={{ ...inp, height:"auto", padding:"9px 12px" }} />
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                <label style={{ fontSize:12, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:".4px" }}>Mô tả ngắn</label>
                <textarea value={form.short_description} onChange={(e) => setField("short_description", e.target.value)} placeholder="Mô tả ngắn về sản phẩm..."
                  style={{ ...inp, height:"auto", padding:"9px 12px", minHeight:70, resize:"vertical" }} />
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:".4px" }}>URL ảnh thumbnail</label>
                  <input value={form.thumbnail} onChange={(e) => setField("thumbnail", e.target.value)} placeholder="https://..." style={{ ...inp, height:"auto", padding:"9px 12px" }} />
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:".4px" }}>Trạng thái</label>
                  <select value={form.status} onChange={(e) => setField("status", e.target.value as "active" | "inactive")} style={{ ...inp, height:"auto", padding:"9px 12px" }}>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Ngừng bán</option>
                  </select>
                </div>
              </div>

              {/* Variants */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontSize:14, fontWeight:600 }}>Biến thể sản phẩm</span>
                  <span style={{ fontSize:12, color:"#9CA3AF" }}>Màu · Giá gốc · Giá sale · Tồn kho</span>
                </div>
                <div style={{ background:"#F5F6FA", border:"1px solid #E5E7EB", borderRadius:9, padding:14 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 32px", gap:8, marginBottom:8 }}>
                    {["Màu","Giá gốc (đ)","Giá sale (đ)","Tồn kho",""].map((h) => (
                      <span key={h} style={{ fontSize:11, color:"#9CA3AF", fontWeight:600, textTransform:"uppercase", letterSpacing:".3px" }}>{h}</span>
                    ))}
                  </div>
                  {form.variants.map((v, idx) => (
                    <div key={idx} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 32px", gap:8, marginBottom:8, alignItems:"center" }}>
                      <input value={v.color} onChange={(e) => updateVariant(idx, "color", e.target.value)} placeholder="Đen"
                        style={{ border:"1px solid #E5E7EB", borderRadius:7, padding:"7px 10px", fontSize:13, outline:"none", width:"100%", fontFamily:"inherit" }} />
                      <input type="number" value={v.price} onChange={(e) => updateVariant(idx, "price", e.target.value)} placeholder="0"
                        style={{ border:"1px solid #E5E7EB", borderRadius:7, padding:"7px 10px", fontSize:13, outline:"none", width:"100%", fontFamily:"inherit" }} />
                      <input type="number" value={v.sale_price} onChange={(e) => updateVariant(idx, "sale_price", e.target.value)} placeholder="Để trống"
                        style={{ border:"1px solid #E5E7EB", borderRadius:7, padding:"7px 10px", fontSize:13, outline:"none", width:"100%", fontFamily:"inherit" }} />
                      <input type="number" value={v.stock_quantity} onChange={(e) => updateVariant(idx, "stock_quantity", e.target.value)} placeholder="0"
                        style={{ border:"1px solid #E5E7EB", borderRadius:7, padding:"7px 10px", fontSize:13, outline:"none", width:"100%", fontFamily:"inherit" }} />
                      <button onClick={() => removeVariant(idx)}
                        style={{ width:28, height:28, border:"1px solid #FECACA", borderRadius:6, background:"#FEF2F2", cursor:"pointer", color:"#B91C1C", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                    </div>
                  ))}
                  <button onClick={addVariant}
                    style={{ width:"100%", padding:8, border:"1.5px dashed #FECACA", borderRadius:8, background:"transparent", color:"#D32F2F", fontSize:13, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    + Thêm biến thể
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop:"1px solid #E5E7EB", padding:"13px 22px", display:"flex", justifyContent:"flex-end", gap:8, background:"#FAFAFA", flexShrink:0 }}>
              <button onClick={() => setModalOpen(false)}
                style={{ padding:"9px 18px", borderRadius:8, border:"1px solid #E5E7EB", background:"#fff", fontSize:13.5, cursor:"pointer", color:"#6B7280", fontFamily:"inherit" }}>
                Huỷ
              </button>
              <button onClick={saveProduct} disabled={saving}
                style={{ padding:"9px 20px", borderRadius:8, background: saving ? "#EF9A9A" : "#D32F2F", color:"#fff", border:"none", fontSize:13.5, fontWeight:600, cursor: saving ? "default" : "pointer", display:"flex", alignItems:"center", gap:6, fontFamily:"inherit" }}>
                💾 {saving ? "Đang lưu..." : "Lưu sản phẩm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}