"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Star, ChevronRight, X, Package, Home, ChevronDown, Repeat,
  SlidersHorizontal, Check, Tag, Heart,
} from "lucide-react";
import { useComparison } from "../../components/comparisonContext";
import { useFavorites, type FavoriteProduct } from "../../components/favoritesContext";

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

  return (
    <div className="group flex flex-col h-full">
      <Link href={`/sanpham/${p.slug}`} className="flex-1 block">
        <div className="bg-white border border-gray-100 rounded-t-2xl overflow-hidden hover:shadow-lg hover:border-red-100 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative">
          {p.badge && (
            <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              {p.badge}
            </span>
          )}
          {p.giamGia > 0 && (
            <span className="absolute top-3 right-12 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
              -{p.giamGia}%
            </span>
          )}
          <button
            onClick={handleToggleFavorite}
            title="Yêu thích"
            className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur transition-colors ${
              liked ? "bg-red-500 text-white" : "bg-white/90 text-gray-400 hover:text-red-500"
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-white" : ""}`} />
          </button>
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
                <div className="flex items-center gap-1 bg-amber-50 rounded-full px-2 py-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-700">{p.danhGia.toFixed(1)}</span>
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

/* ── Pill button (toolbar trigger) ─────────────────────────────────────── */
function Pill({
  label, icon, active, hasDropdown, onClick,
}: {
  label: string;
  icon?: ReactNode;
  active: boolean;
  hasDropdown?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium border whitespace-nowrap transition-colors ${
        active
          ? "border-red-500 bg-red-50 text-red-600"
          : "border-gray-200 text-gray-700 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {icon}
      {label}
      {hasDropdown && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${active ? "rotate-180" : ""}`} />}
    </button>
  );
}

/* ── Filter content lists (shared between combined panel + single dropdowns) ── */
function CategoryList({ categories, danhMucSlug, onCategory }: {
  categories: Category[]; danhMucSlug: string; onCategory: (slug: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={() => onCategory(null)}
        className={`flex items-center justify-between text-left px-2.5 py-2 rounded-lg text-[13.5px] transition-colors ${
          !danhMucSlug ? "bg-red-50 text-red-600 font-semibold" : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        Tất cả sản phẩm
        {!danhMucSlug && <Check className="w-3.5 h-3.5" />}
      </button>
      {categories.map((cat) => {
        const active = danhMucSlug === cat.slug;
        return (
          <button
            key={cat.slug}
            onClick={() => onCategory(active ? null : cat.slug)}
            className={`flex items-center justify-between text-left px-2.5 py-2 rounded-lg text-[13.5px] transition-colors ${
              active ? "bg-red-50 text-red-600 font-semibold" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="truncate">{cat.category_name}</span>
            {active && <Check className="w-3.5 h-3.5 shrink-0" />}
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
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />)}
      </div>
    );
  }
  if (brands.length === 0) {
    return <p className="text-[12.5px] text-gray-300 italic">Không có thương hiệu</p>;
  }
  return (
    <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
      {brands.map((b) => {
        const active = brandIds.includes(String(b.brand_id));
        return (
          <label key={b.brand_id} className="flex items-center gap-2.5 px-1 py-1 cursor-pointer group">
            <span
              onClick={() => onToggleBrand(b.brand_id)}
              className={`w-4 h-4 rounded-[5px] border flex items-center justify-center shrink-0 transition-colors ${
                active ? "bg-red-600 border-red-600" : "border-gray-300 group-hover:border-red-300"
              }`}
            >
              {active && <Check className="w-3 h-3 text-white" />}
            </span>
            <span
              onClick={() => onToggleBrand(b.brand_id)}
              className={`text-[13.5px] select-none ${active ? "text-red-600 font-medium" : "text-gray-600"}`}
            >
              {b.brand_name}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function PriceList({ priceKey, onPricePreset }: { priceKey: string; onPricePreset: (key: string | null) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      {PRICE_PRESETS.map((preset) => {
        const active = priceKey === preset.key;
        return (
          <button
            key={preset.key}
            onClick={() => onPricePreset(active ? null : preset.key)}
            className={`flex items-center gap-2.5 px-1 py-1.5 rounded-lg text-[13.5px] text-left transition-colors ${
              active ? "text-red-600 font-medium" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${active ? "border-red-600" : "border-gray-300"}`}>
              {active && <span className="w-2 h-2 rounded-full bg-red-600" />}
            </span>
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}

function RatingList({ ratingMin, onRating }: { ratingMin: string; onRating: (v: number | null) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      {RATING_PRESETS.map((r) => {
        const active = ratingMin === String(r);
        return (
          <button
            key={r}
            onClick={() => onRating(active ? null : r)}
            className={`flex items-center gap-1.5 px-1 py-1.5 rounded-lg transition-colors ${
              active ? "text-red-600" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < r ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
            ))}
            <span className="text-[13px] font-medium ml-0.5">trở lên</span>
          </button>
        );
      })}
    </div>
  );
}

function DiscountToggle({ discountOnly, onDiscount }: { discountOnly: boolean; onDiscount: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 px-1 py-1 cursor-pointer group">
      <span
        onClick={() => onDiscount(!discountOnly)}
        className={`w-4 h-4 rounded-[5px] border flex items-center justify-center shrink-0 transition-colors ${
          discountOnly ? "bg-red-600 border-red-600" : "border-gray-300 group-hover:border-red-300"
        }`}
      >
        {discountOnly && <Check className="w-3 h-3 text-white" />}
      </span>
      <span
        onClick={() => onDiscount(!discountOnly)}
        className={`text-[13.5px] select-none flex items-center gap-1.5 ${discountOnly ? "text-red-600 font-medium" : "text-gray-600"}`}
      >
        <Tag className="w-3.5 h-3.5" />
        Chỉ hiện sản phẩm giảm giá
      </span>
    </label>
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

      {/* ── Filter toolbar ── */}
      <div ref={toolbarRef} className="relative mb-3">
        <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] pb-0.5">
          <Pill
            label="Bộ lọc"
            icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            active={openDropdown === "filter" || activeFilterCount > 0}
            onClick={() => toggleDropdown("filter")}
          />
          <Pill
            label="Giảm giá"
            icon={<Tag className="w-3.5 h-3.5" />}
            active={discountOnly}
            onClick={() => handleDiscount(!discountOnly)}
          />
          <Pill
            label={selectedCat ? selectedCat.category_name : "Danh mục"}
            active={openDropdown === "category" || !!danhMucSlug}
            hasDropdown
            onClick={() => toggleDropdown("category")}
          />
          <Pill
            label={brandIds.length ? `Thương hiệu (${brandIds.length})` : "Thương hiệu"}
            active={openDropdown === "brand" || brandIds.length > 0}
            hasDropdown
            onClick={() => toggleDropdown("brand")}
          />
          <Pill
            label={selectedPriceRange ? selectedPriceRange.label : "Xem theo giá"}
            active={openDropdown === "price" || !!priceKey}
            hasDropdown
            onClick={() => toggleDropdown("price")}
          />
          <Pill
            label={ratingMin ? `${ratingMin}★ trở lên` : "Đánh giá"}
            active={openDropdown === "rating" || !!ratingMin}
            hasDropdown
            onClick={() => toggleDropdown("rating")}
          />
        </div>

        {/* ── Combined filter panel ── */}
        {openDropdown === "filter" && (
          <div className="absolute left-0 top-full mt-2 z-30 w-[min(820px,calc(100vw-2rem))] bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 max-h-[420px] overflow-y-auto p-5 gap-5">
              <div>
                <p className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide mb-3">Danh mục</p>
                <CategoryList categories={categories} danhMucSlug={danhMucSlug} onCategory={handleCategory} />
              </div>
              <div className="sm:pl-5 pt-5 sm:pt-0">
                <p className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide mb-3">Thương hiệu</p>
                <BrandList brands={brands} loadingBrands={loadingBrands} brandIds={brandIds} onToggleBrand={handleToggleBrand} />
              </div>
              <div className="sm:pl-5 pt-5 sm:pt-0 flex flex-col gap-5">
                <div>
                  <p className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide mb-3">Khoảng giá</p>
                  <PriceList priceKey={priceKey} onPricePreset={handlePricePreset} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide mb-3">Đánh giá</p>
                  <RatingList ratingMin={ratingMin} onRating={handleRating} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide mb-3">Ưu đãi</p>
                  <DiscountToggle discountOnly={discountOnly} onDiscount={handleDiscount} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5 border-t border-gray-100 bg-gray-50/60">
              <button
                onClick={handleClearAll}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13px] font-medium hover:bg-gray-100 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => setOpenDropdown("")}
                className="flex-1 sm:flex-none ml-auto px-6 py-2.5 rounded-xl bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition-colors"
              >
                Xem kết quả {loading ? "" : `(${pagination.total.toLocaleString("vi-VN")})`}
              </button>
            </div>
          </div>
        )}

        {/* ── Single-purpose dropdowns ── */}
        {openDropdown === "category" && (
          <div className="absolute left-0 top-full mt-2 z-30 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl p-4 max-h-80 overflow-y-auto">
            <CategoryList categories={categories} danhMucSlug={danhMucSlug} onCategory={(s) => { handleCategory(s); setOpenDropdown(""); }} />
          </div>
        )}
        {openDropdown === "brand" && (
          <div className="absolute left-0 top-full mt-2 z-30 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl p-4">
            <BrandList brands={brands} loadingBrands={loadingBrands} brandIds={brandIds} onToggleBrand={handleToggleBrand} />
          </div>
        )}
        {openDropdown === "price" && (
          <div className="absolute left-0 top-full mt-2 z-30 w-60 bg-white border border-gray-100 rounded-2xl shadow-xl p-4">
            <PriceList priceKey={priceKey} onPricePreset={(k) => { handlePricePreset(k); setOpenDropdown(""); }} />
          </div>
        )}
        {openDropdown === "rating" && (
          <div className="absolute left-0 top-full mt-2 z-30 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl p-4">
            <RatingList ratingMin={ratingMin} onRating={(v) => { handleRating(v); setOpenDropdown(""); }} />
          </div>
        )}
      </div>

      {/* ── Sort row ── */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="text-[13.5px] font-semibold text-gray-700 shrink-0">Sắp xếp theo</span>
        {SORT_OPTIONS.map((o) => (
          <Pill key={o.value} label={o.label} active={sort === o.value} onClick={() => pushParams({ sort: o.value })} />
        ))}
      </div>

      {/* Active filter chips */}
      {(keyword || danhMucSlug || brandIds.length > 0 || priceKey || ratingMin || discountOnly) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {keyword && (
            <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-[12.5px] font-medium px-3 py-1.5 rounded-full border border-red-100">
              Tìm: &ldquo;{keyword}&rdquo;
              <button onClick={() => pushParams({ "tu-khoa": null })} className="hover:text-red-900 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCat && (
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-[12.5px] font-medium px-3 py-1.5 rounded-full">
              {selectedCat.category_name}
              <button onClick={() => handleCategory(null)} className="hover:text-red-600 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {brandIds.map((id) => {
            const b = brands.find((br) => String(br.brand_id) === id);
            if (!b) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-[12.5px] font-medium px-3 py-1.5 rounded-full">
                {b.brand_name}
                <button onClick={() => handleToggleBrand(b.brand_id)} className="hover:text-red-600 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {selectedPriceRange && (
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-[12.5px] font-medium px-3 py-1.5 rounded-full">
              {selectedPriceRange.label}
              <button onClick={() => handlePricePreset(null)} className="hover:text-red-600 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {ratingMin && (
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-[12.5px] font-medium px-3 py-1.5 rounded-full">
              {ratingMin}★ trở lên
              <button onClick={() => handleRating(null)} className="hover:text-red-600 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {discountOnly && (
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-[12.5px] font-medium px-3 py-1.5 rounded-full">
              Giảm giá
              <button onClick={() => handleDiscount(false)} className="hover:text-red-600 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button onClick={handleClearAll} className="text-[12.5px] text-gray-500 hover:text-red-600 font-medium transition-colors">
            Xóa tất cả bộ lọc
          </button>
        </div>
      )}

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
