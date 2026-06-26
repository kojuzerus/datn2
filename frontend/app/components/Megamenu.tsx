"use client";

import { useState, useRef, useEffect, type ElementType } from "react";
import Link from "next/link";
import {
  Menu, X, Smartphone, Laptop, Headphones, Speaker,
  BatteryCharging, TabletSmartphone, Tv2, Watch, ChevronRight,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type CategoryItem = {
  category_id: number;
  category_name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  status: string;
};

type BrandItem = {
  brand_id: number;
  brand_name: string;
  logo?: string;
  status?: string;
};

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, ElementType> = {
  "dien-thoai": Smartphone,
  laptop: Laptop,
  "phu-kien": Headphones,
  "tai-nghe": Headphones,
  loa: Speaker,
  "sac-cap": BatteryCharging,
  tablet: TabletSmartphone,
  "dien-may": Tv2,
  "dong-ho": Watch,
};

const CAT_ORDER = ["dien-thoai", "laptop", "tablet", "phu-kien", "dien-may", "dong-ho"];

const HOT_TAGS: Record<string, string[]> = {
  "dien-thoai": ["Bán chạy", "Mới nhất", "Dưới 5 triệu", "5G", "Camera tốt"],
  laptop:       ["Gaming", "Văn phòng", "Mỏng nhẹ", "Dưới 15 triệu", "MacBook"],
  tablet:       ["iPad", "Android", "Màn hình lớn", "Bút cảm ứng"],
  "phu-kien":   ["Tai nghe", "Sạc nhanh", "Chống nước", "Không dây"],
  "dien-may":   ["TV 4K", "Tiết kiệm điện", "Inverter", "Smart Home"],
  "dong-ho":    ["Smartwatch", "Chống nước", "Thể thao", "Pin lâu"],
};

const BRAND_LOGOS: Record<string, string> = {
  apple: "https://logo.clearbit.com/apple.com",
  samsung: "https://logo.clearbit.com/samsung.com",
  dell: "https://logo.clearbit.com/dell.com",
  asus: "https://logo.clearbit.com/asus.com",
  hp: "https://logo.clearbit.com/hp.com",
  lenovo: "https://logo.clearbit.com/lenovo.com",
  acer: "https://logo.clearbit.com/acer.com",
  msi: "https://logo.clearbit.com/msi.com",
  razer: "https://logo.clearbit.com/razer.com",
  logitech: "https://logo.clearbit.com/logitech.com",
  xiaomi: "https://logo.clearbit.com/mi.com",
  oppo: "https://logo.clearbit.com/oppo.com",
  vivo: "https://logo.clearbit.com/vivo.com",
  iphone: "https://logo.clearbit.com/apple.com",
  sony: "https://logo.clearbit.com/sony.com",
  realme: "https://logo.clearbit.com/realme.com",
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function MegaMenuButton() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [activeCatSlug, setActiveCatSlug] = useState<string>(CAT_ORDER[0]);
  const [activeChildSlug, setActiveChildSlug] = useState<string>("");
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // ── Close on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Fetch categories once on mount ──
  useEffect(() => {
    setLoadingCats(true);
    fetch(`${apiUrl}/api/categories`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) setCategories(json.data);
        else setCategories([]);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));
  }, [apiUrl]);

  // ── Derived: sidebar top-level categories ──
  const topCats = categories.filter((c) => !c.parent_id && c.status === "active");
  const ordered = CAT_ORDER
    .map((s) => topCats.find((c) => c.slug === s))
    .filter(Boolean) as CategoryItem[];
  const others = topCats.filter((c) => !CAT_ORDER.includes(c.slug));
  const sidebarCats = [...ordered, ...others];

  // ── Sync activeCatSlug when category list loads ──
  useEffect(() => {
    if (sidebarCats.length === 0) return;
    if (!sidebarCats.some((c) => c.slug === activeCatSlug)) {
      setActiveCatSlug(sidebarCats[0].slug);
    }
  }, [categories]); // depend on raw categories, not derived array

  const activeCategory = sidebarCats.find((c) => c.slug === activeCatSlug) ?? sidebarCats[0];

  const childCategories = activeCategory
    ? categories.filter(
        (c) => c.parent_id === activeCategory.category_id && c.status === "active"
      )
    : [];

  // ── Sync activeChildSlug when active category changes ──
  useEffect(() => {
    if (childCategories.length === 0) {
      setActiveChildSlug("");
    } else if (!childCategories.some((c) => c.slug === activeChildSlug)) {
      setActiveChildSlug(childCategories[0].slug);
    }
  }, [activeCategory?.category_id]); // only re-run when top-level category changes

  const selectedCategorySlug =
    activeChildSlug || childCategories[0]?.slug || activeCategory?.slug;

  const ActiveIcon: ElementType =
    (activeCategory && ICON_MAP[activeCategory.slug]) || Smartphone;

  const tags = (activeCategory && HOT_TAGS[activeCategory.slug]) || [];

  // ── Fetch brands when selected category changes ──
  useEffect(() => {
    if (!selectedCategorySlug) {
      setBrands([]);
      return;
    }

    const ctrl = new AbortController();
    setLoadingBrands(true);

    fetch(
      `${apiUrl}/api/brands?category_slug=${encodeURIComponent(selectedCategorySlug)}`,
      { signal: ctrl.signal }
    )
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) setBrands(json.data);
        else setBrands([]);
      })
      .catch(() => setBrands([]))
      .finally(() => setLoadingBrands(false));

    return () => ctrl.abort();
  }, [apiUrl, selectedCategorySlug]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div ref={ref} className="relative hidden md:block">

      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-medium transition-colors ${
          open
            ? "bg-red-700 text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        Danh mục
      </button>

      {/* ── Mega menu panel ── */}
      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-2 flex rounded-sm bg-white border border-gray-100 shadow-xl overflow-hidden"
          style={{ width: 780, maxHeight: 500 }}
        >
          {/* ── Col 1: Category sidebar ── */}
          <div className="w-[196px] flex-shrink-0 border-r border-gray-100 py-2 overflow-y-auto bg-white">
            {loadingCats
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 mx-3 mb-1.5 rounded-sm bg-gray-100 animate-pulse"
                  />
                ))
              : sidebarCats.map((cat) => {
                  const CatIcon = ICON_MAP[cat.slug] || Smartphone;
                  const isActive = activeCatSlug === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      onMouseEnter={() => setActiveCatSlug(cat.slug)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-left transition-all border-l-2 ${
                        isActive
                          ? "border-red-500 bg-gray-50 text-red-600 font-medium"
                          : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 transition-colors ${
                          isActive
                            ? "bg-red-50 text-red-500"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <CatIcon className="w-4 h-4" />
                      </span>
                      <span className="truncate">{cat.category_name}</span>
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-red-400" />
                      )}
                    </button>
                  );
                })}
          </div>

          {/* ── Col 2: Active category content ── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">

            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
                <ActiveIcon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-gray-900 leading-tight">
                  {activeCategory?.category_name ?? "—"}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {activeCategory?.description || "Khám phá sản phẩm mới nhất"}
                </p>
              </div>
              {activeCategory && (
                <Link
                  href={`/sanpham?danh-muc=${encodeURIComponent(activeCategory.slug)}`}
                  onClick={() => setOpen(false)}
                  className="ml-auto flex-shrink-0 text-[12px] text-red-600 font-medium hover:underline border border-red-200 bg-red-50 px-3 py-1.5 rounded-sm whitespace-nowrap"
                >
                  Xem tất cả →
                </Link>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {childCategories.length > 0 ? (
                /* ── Has sub-categories: 2-column layout ── */
                <div className="grid grid-cols-2 divide-x divide-gray-100 h-full">

                  {/* Left: sub-categories + hot tags */}
                  <div className="p-5">
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">
                      Danh mục con
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {childCategories.map((child) => {
                        const isChildActive = activeChildSlug === child.slug;
                        return (
                          <Link
                            key={child.slug}
                            href={`/sanpham?danh-muc=${encodeURIComponent(child.slug)}`}
                            onClick={() => setOpen(false)}
                            onMouseEnter={() => setActiveChildSlug(child.slug)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-sm text-[13px] transition-colors ${
                              isChildActive
                                ? "bg-red-50 text-red-600 font-medium"
                                : "text-gray-600 hover:bg-gray-50 hover:text-red-600"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                                isChildActive ? "bg-red-400" : "bg-gray-300"
                              }`}
                            />
                            {child.category_name}
                          </Link>
                        );
                      })}
                    </div>

                    {tags.length > 0 && (
                      <>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mt-5 mb-3">
                          Tìm nhanh
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((t) => (
                            <Link
                              key={t}
                              href={`/sanpham?q=${encodeURIComponent(t)}`}
                              onClick={() => setOpen(false)}
                              className="text-[12px] px-3 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              {t}
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right: brands */}
                  <div className="p-5">
                    <BrandsSection
                      loading={loadingBrands}
                      brands={brands}
                      cols={3}
                      onClose={() => setOpen(false)}
                      tags={[]}
                    />
                  </div>
                </div>
              ) : (
                /* ── No sub-categories: brands full-width ── */
                <div className="p-5">
                  <BrandsSection
                    loading={loadingBrands}
                    brands={brands}
                    cols={4}
                    onClose={() => setOpen(false)}
                    tags={tags}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BRANDS SECTION ───────────────────────────────────────────────────────────

function BrandsSection({
  loading,
  brands,
  cols,
  onClose,
  tags,
}: {
  loading: boolean;
  brands: BrandItem[];
  cols: 3 | 4;
  onClose: () => void;
  tags: string[];
}) {
  const gridCols = cols === 4 ? "grid-cols-4" : "grid-cols-3";

  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">
        Thương hiệu
      </p>

      {loading ? (
        <div className={`grid ${gridCols} gap-2`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[68px] rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="px-5 py-10 text-sm text-gray-500">
          Không có thương hiệu phù hợp.
        </div>
      ) : (
        <div className={`grid ${gridCols} gap-2`}>
          {brands.map((brand) => {
            const colors = [
              "bg-blue-100 text-blue-600",
              "bg-purple-100 text-purple-600",
              "bg-green-100 text-green-600",
              "bg-orange-100 text-orange-600",
              "bg-pink-100 text-pink-600",
              "bg-teal-100 text-teal-600",
              "bg-indigo-100 text-indigo-600",
              "bg-yellow-100 text-yellow-700",
            ];
            const colorClass = colors[brand.brand_id % colors.length];
            return (
              <Link
                key={brand.brand_id}
                href={`/sanpham?brand_id=${brand.brand_id}`}
                onClick={onClose}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-gray-100 bg-white hover:border-red-200 hover:bg-red-50 transition-all text-center group"
              >
                {brand.logo || BRAND_LOGOS[brand.brand_name.toLowerCase()] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logo || BRAND_LOGOS[brand.brand_name.toLowerCase()]}
                    alt={brand.brand_name}
                    className="w-9 h-9 rounded-xl object-contain p-0.5"
                  />
                ) : (
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-bold transition-colors group-hover:bg-red-100 group-hover:text-red-600 ${colorClass}`}>
                    {brand.brand_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-[11px] text-gray-600 group-hover:text-red-600 font-medium truncate w-full leading-tight transition-colors">
                  {brand.brand_name}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {tags.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mt-5 mb-3">
            Tìm nhanh
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Link
                key={t}
                href={`/sanpham?q=${encodeURIComponent(t)}`}
                onClick={onClose}
                className="text-[12px] px-3 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/thuonghieu"
        onClick={onClose}
        className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-gray-500 hover:text-red-600 transition-colors py-2 border border-dashed border-gray-200 rounded-xl hover:border-red-200"
      >
        Xem tất cả thương hiệu
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
