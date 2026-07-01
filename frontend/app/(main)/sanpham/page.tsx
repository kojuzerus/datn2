"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Star, ChevronRight, X, Package, Home, ChevronDown, Repeat,
  SlidersHorizontal, Check, Tag, Heart, Truck,
} from "lucide-react";
import { useComparison } from "../../components/comparisonContext";
import { useFavorites, type FavoriteProduct } from "../../components/favoritesContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Variant { variant_id: number; color: string; config: string; price: number; sale_price: number | null; }
interface Product {
  id: number; ten: string; slug: string; thuongHieu: string;
  thumbnail: string; moTa: string; gia: number; giaSale: number | null;
  giamGia: number; danhGia: number; luotBan: number; badge: string;
  categoryName: string; variants?: Variant[];
}
interface Category { category_id: number; category_name: string; slug: string; parent_id?: number | null; }
interface Brand    { brand_id: number; brand_name: string; }
interface Pagination { total: number; page: number; limit: number; totalPages: number; }

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

const SORT_OPTIONS = [
  { value: "newest",     label: "Mới nhất"     },
  { value: "sold",       label: "Bán chạy"     },
  { value: "rating",     label: "Đánh giá cao" },
  { value: "price_asc",  label: "Giá thấp - cao" },
  { value: "price_desc", label: "Giá cao - thấp" },
];

const PRICE_PRESETS = [
  { key: "0-5tr",    label: "Dưới 5 triệu",     min: null,        max: 5_000_000  },
  { key: "5-10tr",   label: "5 - 10 triệu",     min: 5_000_000,   max: 10_000_000 },
  { key: "10-20tr",  label: "10 - 20 triệu",    min: 10_000_000,  max: 20_000_000 },
  { key: "20tr-up",  label: "Trên 20 triệu",    min: 20_000_000,  max: null       },
];

const RATING_PRESETS = [4, 3, 2];

type DropdownKey = "" | "filter" | "category" | "brand" | "price" | "rating";

/* ── Product Card ───────────────────────────────────────────────────────── */
function ProductCard({ p }: { p: Product }) {
  const { addItem, removeItem, isInComparison } = useComparison();
  const { isFavorite, toggleItem } = useFavorites();
  const inCompare = isInComparison(p.id);
  const liked = isFavorite(p.id);

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

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fav: FavoriteProduct = {
      id: p.id, ten: p.ten, slug: p.slug, thumbnail: p.thumbnail,
      gia: p.gia, giaSale: p.giaSale, giamGia: p.giamGia,
      danhGia: p.danhGia, thuongHieu: p.thuongHieu, categoryName: p.categoryName,
    };
    toggleItem(fav);
  };

  const configs = p.variants
    ? [...new Set(p.variants.map((v) => v.config).filter(Boolean))].slice(0, 3)
    : [];

  return (
    <div className="group flex flex-col relative">
      {/* Heart button – absolute, outside Link */}
      <button
        onClick={handleToggleFavorite}
        title="Yêu thích"
        className={`absolute bottom-[44px] right-2.5 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white shadow border border-gray-100 transition-colors ${
          liked ? "text-red-500 border-red-200" : "text-gray-300 hover:text-red-400"
        }`}
      >
        <Heart className={`w-3.5 h-3.5 ${liked ? "fill-red-500" : ""}`} />
      </button>

      <Link href={`/sanpham/${p.slug}`} className="flex-1 block">
        <div className="bg-white border border-gray-100 rounded-t-2xl overflow-hidden hover:shadow-lg hover:border-red-100 hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
          {/* Badge row */}
          <div className="flex items-center justify-between px-2.5 pt-2.5 min-h-[26px]">
            {p.giamGia > 0 ? (
              <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                Giảm {p.giamGia}%
              </span>
            ) : <span />}
            <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-100 whitespace-nowrap">
              Trả góp 0%
            </span>
          </div>

          {/* Image */}
          <div className="bg-white flex items-center justify-center h-36 px-4 py-1.5 overflow-hidden">
            <img
              src={p.thumbnail || "https://placehold.co/300x300?text=No+Image"}
              alt={p.ten}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>

          {/* Content */}
          <div className="px-2.5 pb-2.5 flex flex-col gap-1.5">
            {/* Short description */}
            {p.moTa && (
              <p className="text-[10.5px] text-gray-400 line-clamp-1 leading-tight">{p.moTa}</p>
            )}

            {/* Product name */}
            <h3 className="font-semibold text-gray-800 text-[12.5px] leading-snug line-clamp-2 min-h-[36px]">
              {p.ten}
            </h3>

            {/* Price */}
            <div className="flex items-baseline gap-1.5">
              <p className="text-[14px] font-bold text-red-600">{fmt(p.giaSale ?? p.gia)}</p>
              {p.giamGia > 0 && (
                <p className="text-[10.5px] text-gray-400 line-through">{fmt(p.gia)}</p>
              )}
            </div>

            {/* Config pills */}
            {configs.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {configs.map((c, i) => (
                  <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Delivery + rating */}
            <div className="flex items-center justify-between pt-1.5 mt-0.5 border-t border-gray-50">
              <span className="flex items-center gap-1 text-[10.5px] text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-lg">
                <Truck className="w-3 h-3" /> Giao 2 Giờ
              </span>
              {p.danhGia > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-[11px] font-semibold text-gray-600">{p.danhGia.toFixed(1)}</span>
                </span>
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

/* ── Filter content lists ───────────────────────────────────────────────── */
function CategoryList({ categories, danhMucSlug, onCategory }: {
  categories: Category[]; danhMucSlug: string; onCategory: (slug: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={() => onCategory(null)}
        className={`flex items-center justify-between text-left px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
          !danhMucSlug ? "bg-red-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        Tất cả sản phẩm
        {!danhMucSlug && <Check className="w-3.5 h-3.5 shrink-0" />}
      </button>
      {categories.filter(c => !c.parent_id).map((cat) => {
        const active = danhMucSlug === cat.slug;
        return (
          <button
            key={cat.slug}
            onClick={() => onCategory(active ? null : cat.slug)}
            className={`flex items-center justify-between text-left px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
              active ? "bg-red-50 text-red-600 border border-red-100" : "text-gray-600 hover:bg-gray-50 border border-transparent"
            }`}
          >
            <span className="truncate">{cat.category_name}</span>
            {active && <Check className="w-3.5 h-3.5 shrink-0 text-red-500" />}
          </button>
        );
      })}
    </div>
  );
}

function BrandList({ brands, loadingBrands, brandIds, onToggleBrand }: {
  brands: Brand[]; loadingBrands: boolean; brandIds: string[]; onToggleBrand: (id: number) => void;
}) {
  if (loadingBrands) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-9 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }
  if (brands.length === 0) {
    return <p className="text-[12.5px] text-gray-400 italic text-center py-4">Không có thương hiệu</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-0.5">
      {brands.map((b) => {
        const active = brandIds.includes(String(b.brand_id));
        return (
          <button
            key={b.brand_id}
            onClick={() => onToggleBrand(b.brand_id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12.5px] font-medium transition-all text-left ${
              active
                ? "border-red-400 bg-red-50 text-red-600 shadow-sm"
                : "border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50/40"
            }`}
          >
            <span className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${
              active ? "bg-red-600 border-red-600" : "border-gray-300"
            }`}>
              {active && <Check className="w-2.5 h-2.5 text-white" />}
            </span>
            <span className="truncate">{b.brand_name}</span>
          </button>
        );
      })}
    </div>
  );
}

function PriceList({ priceKey, onPricePreset }: { priceKey: string; onPricePreset: (key: string | null) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PRICE_PRESETS.map((preset) => {
        const active = priceKey === preset.key;
        return (
          <button
            key={preset.key}
            onClick={() => onPricePreset(active ? null : preset.key)}
            className={`px-3 py-2.5 rounded-xl border text-[12.5px] font-medium text-left transition-all ${
              active
                ? "border-red-500 bg-red-600 text-white shadow-sm"
                : "border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50"
            }`}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}

function RatingList({ ratingMin, onRating }: { ratingMin: string; onRating: (v: number | null) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {RATING_PRESETS.map((r) => {
        const active = ratingMin === String(r);
        return (
          <button
            key={r}
            onClick={() => onRating(active ? null : r)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
              active
                ? "border-amber-300 bg-amber-50 shadow-sm"
                : "border-gray-200 hover:border-amber-200 hover:bg-amber-50/50"
            }`}
          >
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < r ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
              ))}
            </div>
            <span className={`text-[12.5px] font-medium ${active ? "text-amber-700" : "text-gray-500"}`}>trở lên</span>
            {active && <Check className="w-3.5 h-3.5 text-amber-500 ml-auto" />}
          </button>
        );
      })}
    </div>
  );
}

/* ── Main listing content ───────────────────────────────────────────────── */
function ProductsContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const danhMucSlug  = searchParams.get("danh-muc")    || "";
  const thuongHieuId = searchParams.get("thuong-hieu") || "";
  const brandIds     = thuongHieuId ? thuongHieuId.split(",").filter(Boolean) : [];
  const priceKey     = searchParams.get("gia")          || "";
  const ratingMin    = searchParams.get("sao-tu")       || "";
  const discountOnly = searchParams.get("giam-gia") === "1";
  const sort         = searchParams.get("sort")         || "newest";
  const currentPage  = parseInt(searchParams.get("trang") || "1");
  const keyword      = searchParams.get("tu-khoa")      || "";

  const [products,      setProducts]      = useState<Product[]>([]);
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [brands,        setBrands]        = useState<Brand[]>([]);
  const [pagination,    setPagination]    = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading,       setLoading]       = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [openDropdown,  setOpenDropdown]  = useState<DropdownKey>("");
  const toolbarRef = useRef<HTMLDivElement>(null);

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

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node))
        setOpenDropdown("");
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

  const selectedPriceRange = PRICE_PRESETS.find((p) => p.key === priceKey);

  /* ── Fetch products ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage), limit: "20", sort, status: "active",
        ...(danhMucSlug       && { category_slug: danhMucSlug }),
        ...(brandIds.length   && { brand_id: brandIds.join(",") }),
        ...(keyword           && { search: keyword }),
        ...(ratingMin         && { rating_min: ratingMin }),
        ...(discountOnly      && { discount_only: "1" }),
        ...(selectedPriceRange?.min != null && { price_min: String(selectedPriceRange.min) }),
        ...(selectedPriceRange?.max != null && { price_max: String(selectedPriceRange.max) }),
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
  }, [danhMucSlug, thuongHieuId, sort, currentPage, keyword, ratingMin, discountOnly, priceKey]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── Filter handlers ── */
  const toggleDropdown = (key: DropdownKey) => setOpenDropdown((cur) => (cur === key ? "" : key));
  const handleCategory = (slug: string | null) => pushParams({ "danh-muc": slug, "thuong-hieu": null });
  const handleToggleBrand = (id: number) => {
    const idStr = String(id);
    const next = brandIds.includes(idStr) ? brandIds.filter((b) => b !== idStr) : [...brandIds, idStr];
    pushParams({ "thuong-hieu": next.length ? next.join(",") : null });
  };
  const handlePricePreset = (key: string | null) => pushParams({ gia: key });
  const handleRating = (v: number | null) => pushParams({ "sao-tu": v ? String(v) : null });
  const handleDiscount = (v: boolean) => pushParams({ "giam-gia": v ? "1" : null });
  const handleClearAll = () => {
    pushParams({ "danh-muc": null, "thuong-hieu": null, gia: null, "sao-tu": null, "giam-gia": null, "tu-khoa": null });
    setOpenDropdown("");
  };

  /* ── Derived ── */
  const selectedCat  = categories.find((c) => c.slug === danhMucSlug);
  const activeFilterCount =
    (danhMucSlug ? 1 : 0) + brandIds.length + (priceKey ? 1 : 0) + (ratingMin ? 1 : 0) + (discountOnly ? 1 : 0);

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

      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[16px] font-bold text-gray-900">Chọn theo tiêu chí</p>
        <span className="text-[13px] text-gray-400 whitespace-nowrap">
          {loading ? "Đang tải..." : `${pagination.total.toLocaleString("vi-VN")} sản phẩm`}
        </span>
      </div>

      {/* ── Sticky toolbar ── */}
      <div ref={toolbarRef} className="relative sticky top-[96px] z-20 mb-3">

        {/* Hàng 1: Bộ lọc pills */}
        <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] py-3 border-b border-gray-100 bg-white">

          {/* Bộ lọc */}
          <button
            onClick={() => toggleDropdown("filter")}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-colors ${
              activeFilterCount > 0 || openDropdown === "filter"
                ? "border-red-500 text-red-600"
                : "border-gray-300 text-gray-700 hover:border-gray-400"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Bộ lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>

          {/* Giảm giá */}
          <button
            onClick={() => handleDiscount(!discountOnly)}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-colors ${
              discountOnly
                ? "border-red-500 bg-red-50 text-red-600"
                : "border-gray-200 text-gray-700 hover:border-gray-400"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Giảm giá
          </button>

          {/* Danh mục */}
          <button
            onClick={() => toggleDropdown("category")}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-colors ${
              danhMucSlug || openDropdown === "category"
                ? "border-red-500 bg-red-50 text-red-600"
                : "border-gray-200 text-gray-700 hover:border-gray-400"
            }`}
          >
            {selectedCat ? selectedCat.category_name : "Danh mục"}
            {danhMucSlug ? (
              <span onClick={(e) => { e.stopPropagation(); handleCategory(null); }}>
                <X className="w-3.5 h-3.5" />
              </span>
            ) : (
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === "category" ? "rotate-180" : ""}`} />
            )}
          </button>

          {/* Thương hiệu */}
          <button
            onClick={() => toggleDropdown("brand")}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-colors ${
              brandIds.length > 0 || openDropdown === "brand"
                ? "border-red-500 bg-red-50 text-red-600"
                : "border-gray-200 text-gray-700 hover:border-gray-400"
            }`}
          >
            {brandIds.length > 0 ? `Thương hiệu (${brandIds.length})` : "Thương hiệu"}
            {brandIds.length > 0 ? (
              <span onClick={(e) => { e.stopPropagation(); pushParams({ "thuong-hieu": null }); }}>
                <X className="w-3.5 h-3.5" />
              </span>
            ) : (
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === "brand" ? "rotate-180" : ""}`} />
            )}
          </button>

          {/* Khoảng giá */}
          <button
            onClick={() => toggleDropdown("price")}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-colors ${
              priceKey || openDropdown === "price"
                ? "border-red-500 bg-red-50 text-red-600"
                : "border-gray-200 text-gray-700 hover:border-gray-400"
            }`}
          >
            {selectedPriceRange ? selectedPriceRange.label : "Khoảng giá"}
            {priceKey ? (
              <span onClick={(e) => { e.stopPropagation(); handlePricePreset(null); }}>
                <X className="w-3.5 h-3.5" />
              </span>
            ) : (
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === "price" ? "rotate-180" : ""}`} />
            )}
          </button>

          {/* Đánh giá */}
          <button
            onClick={() => toggleDropdown("rating")}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-colors ${
              ratingMin || openDropdown === "rating"
                ? "border-red-500 bg-red-50 text-red-600"
                : "border-gray-200 text-gray-700 hover:border-gray-400"
            }`}
          >
            {ratingMin ? `${ratingMin}★ trở lên` : "Đánh giá"}
            {ratingMin ? (
              <span onClick={(e) => { e.stopPropagation(); handleRating(null); }}>
                <X className="w-3.5 h-3.5" />
              </span>
            ) : (
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === "rating" ? "rotate-180" : ""}`} />
            )}
          </button>

          {/* Keyword chip */}
          {keyword && (
            <span className="shrink-0 inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-[12px] font-medium px-3.5 py-1.5 rounded-full border border-gray-200">
              &ldquo;{keyword}&rdquo;
              <button onClick={() => pushParams({ "tu-khoa": null })} className="hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {/* Xóa lọc */}
          {activeFilterCount > 0 && (
            <>
              <div className="w-px h-4 bg-gray-200 shrink-0 mx-0.5" />
              <button
                onClick={handleClearAll}
                className="shrink-0 flex items-center gap-1 px-2 text-[12px] text-gray-400 hover:text-red-500 font-medium transition-colors whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5" /> Xóa lọc
              </button>
            </>
          )}
        </div>

        {/* Hàng 2: Sắp xếp */}
        <div className="flex items-center justify-between gap-4 py-2.5 bg-white">
          <span className="text-[14px] font-bold text-gray-800 shrink-0">Sắp xếp theo</span>
          <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => pushParams({ sort: o.value })}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border whitespace-nowrap transition-colors ${
                  sort === o.value
                    ? "border-red-500 text-red-600 bg-white"
                    : "border-gray-200 text-gray-600 bg-white hover:border-gray-400"
                }`}
              >
                {o.value === "rating" && (
                  <Star className={`w-3.5 h-3.5 ${sort === o.value ? "fill-red-500 text-red-500" : "fill-gray-300 text-gray-300"}`} />
                )}
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Combined filter panel ── */}
        {openDropdown === "filter" && (
          <div className="absolute left-0 top-full mt-1 z-30 w-[min(860px,calc(100vw-2rem))] bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-gray-800 text-[14px]">Bộ lọc tìm kiếm</span>
                {activeFilterCount > 0 && (
                  <span className="bg-red-100 text-red-600 text-[11px] font-bold px-2 py-0.5 rounded-full">{activeFilterCount} đang chọn</span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button onClick={handleClearAll} className="text-[12.5px] text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1 font-medium">
                  <X className="w-3 h-3" /> Xóa tất cả
                </button>
              )}
            </div>
            <div className="grid grid-cols-[220px_1fr_220px] divide-x divide-gray-100" style={{ maxHeight: 400, overflowY: "auto" }}>
              <div className="p-4">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Danh mục
                </p>
                <CategoryList categories={categories} danhMucSlug={danhMucSlug} onCategory={handleCategory} />
              </div>
              <div className="p-4">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Thương hiệu
                  {brandIds.length > 0 && (
                    <span className="ml-1 bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{brandIds.length}</span>
                  )}
                </p>
                <BrandList brands={brands} loadingBrands={loadingBrands} brandIds={brandIds} onToggleBrand={handleToggleBrand} />
              </div>
              <div className="p-4 flex flex-col gap-4">
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Khoảng giá
                  </p>
                  <PriceList priceKey={priceKey} onPricePreset={handlePricePreset} />
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Đánh giá
                  </p>
                  <RatingList ratingMin={ratingMin} onRating={handleRating} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/70">
              <button onClick={() => setOpenDropdown("")} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13px] font-medium hover:bg-gray-100 transition-colors">
                Đóng
              </button>
              <button onClick={() => setOpenDropdown("")} className="px-7 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold transition-colors shadow-sm">
                {loading ? "Đang tải..." : `Xem ${pagination.total.toLocaleString("vi-VN")} kết quả`}
              </button>
            </div>
          </div>
        )}

        {/* ── Dropdowns ── */}
        {openDropdown === "category" && (
          <div className="absolute left-0 top-full mt-1 z-30 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl p-3 max-h-80 overflow-y-auto">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-1">Danh mục</p>
            <CategoryList categories={categories} danhMucSlug={danhMucSlug} onCategory={(s) => { handleCategory(s); setOpenDropdown(""); }} />
          </div>
        )}
        {openDropdown === "brand" && (
          <div className="absolute left-0 top-full mt-1 z-30 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl p-3">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thương hiệu</p>
              {brandIds.length > 0 && (
                <button onClick={() => { pushParams({ "thuong-hieu": null }); setOpenDropdown(""); }} className="text-[11px] text-red-500 hover:text-red-700 font-medium">Xóa</button>
              )}
            </div>
            <BrandList brands={brands} loadingBrands={loadingBrands} brandIds={brandIds} onToggleBrand={handleToggleBrand} />
            {brandIds.length > 0 && (
              <button onClick={() => setOpenDropdown("")} className="mt-3 w-full py-2 bg-red-600 hover:bg-red-700 text-white text-[12.5px] font-semibold rounded-xl transition-colors">
                Xem kết quả
              </button>
            )}
          </div>
        )}
        {openDropdown === "price" && (
          <div className="absolute left-0 top-full mt-1 z-30 w-60 bg-white border border-gray-100 rounded-2xl shadow-xl p-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-1">Khoảng giá</p>
            <PriceList priceKey={priceKey} onPricePreset={(k) => { handlePricePreset(k); setOpenDropdown(""); }} />
          </div>
        )}
        {openDropdown === "rating" && (
          <div className="absolute left-0 top-full mt-1 z-30 w-60 bg-white border border-gray-100 rounded-2xl shadow-xl p-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-1">Đánh giá</p>
            <RatingList ratingMin={ratingMin} onRating={(v) => { handleRating(v); setOpenDropdown(""); }} />
          </div>
        )}
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
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
          <button onClick={handleClearAll} className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
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
          <div className="bg-white border border-gray-100 rounded-2xl h-12 mb-3 animate-pulse" />
          <div className="bg-white border border-gray-100 rounded-2xl h-10 mb-5 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
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
