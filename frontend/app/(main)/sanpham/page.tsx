"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Star, ChevronRight, X, Package, Home, ChevronDown, Repeat,
} from "lucide-react";
import { useComparison } from "../../components/comparisonContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Product {
  id: number; ten: string; slug: string; thuongHieu: string;
  thumbnail: string; moTa: string; gia: number; giaSale: number | null;
  giamGia: number; danhGia: number; luotBan: number; badge: string;
  categoryName: string;
}
interface Category { category_id: number; category_name: string; slug: string; }
interface Brand    { brand_id: number; brand_name: string; }
interface Pagination { total: number; page: number; limit: number; totalPages: number; }

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

const SORT_OPTIONS = [
  { value: "newest",     label: "Mới nhất"     },
  { value: "sold",       label: "Bán chạy"     },
  { value: "rating",     label: "Đánh giá cao" },
  { value: "price_asc",  label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
];

/* ── Product Card ───────────────────────────────────────────────────────── */
function ProductCard({ p }: { p: Product }) {
  const { addItem, removeItem, isInComparison } = useComparison();
  const inCompare = isInComparison(p.id);

  const handleCompare = () => {
    if (inCompare) {
      removeItem(p.id);
    } else {
      addItem({
        id: p.id, ten: p.ten, slug: p.slug, thumbnail: p.thumbnail,
        gia: p.gia, giaSale: p.giaSale, giamGia: p.giamGia,
        danhGia: p.danhGia, thuongHieu: p.thuongHieu, categoryName: p.categoryName,
      });
    }
  };

  return (
    <div className="group flex flex-col h-full">
      <Link href={`/sanpham/${p.slug}`} className="flex-1 block">
        <div className="bg-white border border-gray-100 rounded-t-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full relative">
          {p.badge && (
            <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              {p.badge}
            </span>
          )}
          {p.giamGia > 0 && (
            <span className="absolute top-3 right-3 z-10 bg-red-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
              -{p.giamGia}%
            </span>
          )}
          <div className="bg-gray-50 flex items-center justify-center h-48 overflow-hidden">
            <img
              src={p.thumbnail || "https://placehold.co/400x300?text=No+Image"}
              alt={p.ten}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
          <div className="p-4 flex flex-col flex-1 gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-red-500">{p.thuongHieu}</p>
            <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 flex-1">{p.ten}</h3>
            <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 mt-auto">
              <div>
                <p className="font-bold text-gray-900 text-[15px]">{fmt(p.giaSale ?? p.gia)}</p>
                {p.giamGia > 0 && (
                  <p className="text-xs text-gray-400 line-through">{fmt(p.gia)}</p>
                )}
              </div>
              {p.danhGia > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-gray-600 font-medium">{p.danhGia.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
      <button
        onClick={handleCompare}
        className={`flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium rounded-b-2xl border border-t-0 transition-all ${
          inCompare
            ? "bg-red-50 text-red-600 border-red-200"
            : "bg-white text-gray-500 border-gray-100 hover:bg-red-50 hover:text-red-600"
        }`}
      >
        <Repeat className="w-3 h-3" />
        {inCompare ? "Đang so sánh" : "So sánh"}
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
      <div className="bg-gray-200 h-48" />
      <div className="p-4 space-y-2.5">
        <div className="h-2.5 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-5 bg-gray-100 rounded w-1/2 mt-2" />
      </div>
    </div>
  );
}

/* ── Main listing content ───────────────────────────────────────────────── */
function ProductsContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const danhMucSlug  = searchParams.get("danh-muc")    || "";
  const thuongHieuId = searchParams.get("thuong-hieu") || "";
  const sort         = searchParams.get("sort")         || "newest";
  const currentPage  = parseInt(searchParams.get("trang") || "1");
  const keyword      = searchParams.get("tu-khoa")      || "";

  const [products,      setProducts]      = useState<Product[]>([]);
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [brands,        setBrands]        = useState<Brand[]>([]);
  const [pagination,    setPagination]    = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading,       setLoading]       = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [sortOpen,      setSortOpen]      = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  /* ── push URL ── */
  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const p = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (!v) p.delete(k); else p.set(k, v);
      });
      if (!("trang" in updates)) p.delete("trang");
      router.push(`/sanpham?${p.toString()}`);
    },
    [searchParams, router],
  );

  /* ── Close sort on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Fetch categories (once) ── */
  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setCategories(j.data); });
  }, []);

  /* ── Fetch brands (per category) ── */
  useEffect(() => {
    setLoadingBrands(true);
    const url = danhMucSlug
      ? `${API_BASE}/api/brands?category_slug=${danhMucSlug}`
      : `${API_BASE}/api/brands`;
    fetch(url)
      .then((r) => r.json())
      .then((j) => { if (j.success) setBrands(j.data); })
      .finally(() => setLoadingBrands(false));
  }, [danhMucSlug]);

  /* ── Fetch products ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage), limit: "20", sort, status: "active",
        ...(danhMucSlug  && { category_slug: danhMucSlug }),
        ...(thuongHieuId && { brand_id: thuongHieuId }),
        ...(keyword      && { search: keyword }),
      });
      const res  = await fetch(`${API_BASE}/api/products?${params}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
        setPagination(json.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [danhMucSlug, thuongHieuId, sort, currentPage, keyword]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── Derived ── */
  const selectedCat  = categories.find((c) => c.slug === danhMucSlug);
  const sortLabel    = SORT_OPTIONS.find((o) => o.value === sort)?.label || "Mới nhất";

  /* ── Render ── */
  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12.5px] text-gray-400 mb-4">
        <Link href="/" className="flex items-center gap-1 hover:text-red-500 transition-colors">
          <Home className="w-3 h-3" /> Trang chủ
        </Link>
        <ChevronRight className="w-3 h-3 text-gray-300" />
        {selectedCat ? (
          <>
            <Link href="/sanpham" className="hover:text-red-500 transition-colors">Sản phẩm</Link>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="text-gray-700 font-medium">{selectedCat.category_name}</span>
          </>
        ) : (
          <span className="text-gray-700 font-medium">Tất cả sản phẩm</span>
        )}
      </nav>

      {/* ── Filter bar ── */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-5">

        {/* Row 1: Category pills */}
        <div className="px-4 pt-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <button
              onClick={() => pushParams({ "danh-muc": null, "thuong-hieu": null })}
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                !danhMucSlug
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => pushParams({ "danh-muc": cat.slug, "thuong-hieu": null })}
                className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
                  danhMucSlug === cat.slug
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Brand pills + count + sort */}
        <div className="px-4 py-2.5 flex items-center gap-3 min-h-[46px]">

          {/* Brand pills (scrollable) */}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {loadingBrands ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="shrink-0 h-7 w-20 bg-gray-100 rounded-full animate-pulse" />
                ))}
              </>
            ) : brands.length > 0 ? (
              <>
                <span className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">
                  Hãng:
                </span>
                {brands.map((b) => {
                  const active = thuongHieuId === String(b.brand_id);
                  return (
                    <button
                      key={b.brand_id}
                      onClick={() => pushParams({ "thuong-hieu": active ? null : String(b.brand_id) })}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-all whitespace-nowrap ${
                        active
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {b.brand_name}
                    </button>
                  );
                })}
              </>
            ) : (
              <span className="text-[12.5px] text-gray-300 italic select-none">
                Chọn danh mục để lọc theo thương hiệu
              </span>
            )}
          </div>

          {/* Count + Sort */}
          <div className="shrink-0 flex items-center gap-3 pl-3 border-l border-gray-100">
            <span className="text-[12.5px] text-gray-400 whitespace-nowrap hidden sm:block">
              {loading ? "Đang tải..." : `${pagination.total.toLocaleString("vi-VN")} sản phẩm`}
            </span>

            <div ref={sortRef} className="relative">
              <button
                onClick={() => setSortOpen((v) => !v)}
                className="flex items-center gap-2 border border-gray-200 rounded-xl px-3.5 py-1.5 text-[13px] text-gray-700 bg-white hover:border-red-300 hover:text-red-600 transition-colors whitespace-nowrap"
              >
                {sortLabel}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-30 bg-white border border-gray-100 rounded-2xl shadow-lg min-w-[170px] py-1.5 overflow-hidden">
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => { pushParams({ sort: o.value }); setSortOpen(false); }}
                      className={`w-full text-left text-[13px] px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                        sort === o.value ? "text-red-600 font-semibold bg-red-50/40" : "text-gray-700"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keyword chip (set by header search) */}
      {keyword && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-[12.5px] font-medium px-3 py-1.5 rounded-full border border-red-100">
            Tìm: &ldquo;{keyword}&rdquo;
            <button
              onClick={() => pushParams({ "tu-khoa": null })}
              className="hover:text-red-900 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
          {(danhMucSlug || thuongHieuId) && (
            <button
              onClick={() => pushParams({ "danh-muc": null, "thuong-hieu": null, "tu-khoa": null })}
              className="text-[12.5px] text-gray-500 hover:text-red-600 font-medium transition-colors"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-20 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-gray-700">Không tìm thấy sản phẩm</p>
            <p className="text-[13px] text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
          <button
            onClick={() => pushParams({ "danh-muc": null, "thuong-hieu": null, "tu-khoa": null })}
            className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-8">
          <button
            disabled={currentPage <= 1}
            onClick={() => pushParams({ trang: String(currentPage - 1) })}
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-default transition-colors text-sm"
          >
            ‹
          </button>
          {(() => {
            const total = pagination.totalPages;
            const cur   = currentPage;
            const pages: (number | "...")[] = [];
            if (total <= 7) {
              for (let i = 1; i <= total; i++) pages.push(i);
            } else {
              pages.push(1);
              if (cur > 3) pages.push("...");
              for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
              if (cur < total - 2) pages.push("...");
              pages.push(total);
            }
            return pages.map((n, i) =>
              n === "..." ? (
                <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">...</span>
              ) : (
                <button
                  key={n}
                  onClick={() => pushParams({ trang: String(n) })}
                  className={`w-9 h-9 rounded-xl border text-sm font-medium flex items-center justify-center transition-colors ${
                    cur === n
                      ? "bg-red-600 text-white border-red-600"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {n}
                </button>
              ),
            );
          })()}
          <button
            disabled={currentPage >= pagination.totalPages}
            onClick={() => pushParams({ trang: String(currentPage + 1) })}
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-default transition-colors text-sm"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}

/* ── Page export ────────────────────────────────────────────────────────── */
export default function SanPhamPage() {
  return (
    <Suspense
      fallback={
        <div>
          <div className="bg-white border border-gray-100 rounded-2xl h-28 mb-5 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
                <div className="bg-gray-200 h-48" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
