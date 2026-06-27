"use client";

import Link from "next/link";
import {
  Search, User, ShoppingCart, Menu, X, Repeat, Phone, Smartphone,
  Laptop, Tv2, Headphones, TabletSmartphone, Speaker, Watch,
  BatteryCharging, TrendingUp,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import MegaMenuButton from "./Megamenu";
import { useComparison } from "./comparisonContext";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type CategoryItem = {
  category_id: number;
  category_name: string;
  slug: string;
  parent_id?: number | null;
  status: string;
};

interface SearchProduct {
  id: number;
  ten: string;
  slug: string;
  thuongHieu: string;
  thumbnail: string;
  gia: number;
  giaSale: number | null;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  "dien-thoai": Smartphone,
  laptop: Laptop,
  "dien-may": Tv2,
  "phu-kien": Headphones,
  tablet: TabletSmartphone,
  "tai-nghe": Headphones,
  loa: Speaker,
  "sac-cap": BatteryCharging,
  "dong-ho": Watch,
};

const CAT_ORDER = ["dien-thoai", "laptop", "dien-may", "phu-kien", "tablet"];

const HOT_PRODUCTS = [
  "iPhone 17 Pro Max", "Samsung Galaxy Z Fold7 5G", "MacBook Air M4 2025",
  "Laptop Lenovo LOQ 15IRR9", "iPad Pro M4", "Apple Watch Ultra 3",
  "ASUS ROG Zephyrus G16", "Sony WH-1000XM6",
];

const TRENDING_KEYWORDS = [
  "iPhone 16", "Samsung Galaxy", "MacBook", "AirPods", "iPad", "Laptop gaming",
];

const fmtPrice = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function Header() {
  const cartItems: unknown[] = [];
  const cartCount = 0;
  const { items: compareItems } = useComparison();

  const [mobileOpen,      setMobileOpen]      = useState(false);
  const [showUserMenu,    setShowUserMenu]    = useState(false);
  const [isLoggedIn,      setIsLoggedIn]      = useState(false);
  const [userRole,        setUserRole]        = useState<string | null>(null);
  const [mobileCategories, setMobileCategories] = useState<CategoryItem[]>([]);

  // ── Search state ──
  const [searchInput,     setSearchInput]     = useState("");
  const [suggestions,     setSuggestions]     = useState<SearchProduct[]>([]);
  const [suggestOpen,     setSuggestOpen]     = useState(false);
  const [suggestLoading,  setSuggestLoading]  = useState(false);
  const [inputFocused,    setInputFocused]    = useState(false);
  const [activeIdx,       setActiveIdx]       = useState(-1);

  const router      = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // ── Fetch mobile categories ──
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${apiUrl}/api/categories`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          const top = json.data.filter(
            (c: CategoryItem) => !c.parent_id && c.status === "active"
          );
          const ordered = CAT_ORDER
            .map((slug) => top.find((c: CategoryItem) => c.slug === slug))
            .filter(Boolean) as CategoryItem[];
          const others = top.filter((c: CategoryItem) => !CAT_ORDER.includes(c.slug));
          setMobileCategories([...ordered, ...others]);
        }
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [apiUrl]);

  // ── Check login ──
  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem("smarthub_token");
      setIsLoggedIn(!!token);
      if (!token) { setUserRole(null); return; }
      try {
        const res = await fetch(`${apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserRole(data?.user?.role ?? null);
        }
      } catch { setUserRole(null); }
    };
    checkLogin();
    window.addEventListener("focus", checkLogin);
    window.addEventListener("storage", checkLogin);
    return () => {
      window.removeEventListener("focus", checkLogin);
      window.removeEventListener("storage", checkLogin);
    };
  }, [apiUrl]);

  // ── Close user menu on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setShowUserMenu(false);
    };
    if (showUserMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUserMenu]);

  // ── Close search dropdown on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
        setInputFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Cleanup debounce on unmount ──
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // ── Fetch suggestions (debounced 280ms) ──
  const fetchSuggestions = useCallback(
    (q: string) => {
      clearTimeout(debounceRef.current);
      if (!q.trim()) {
        setSuggestions([]);
        setSuggestOpen(false);
        setSuggestLoading(false);
        return;
      }
      setSuggestLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const res  = await fetch(
            `${apiUrl}/api/products?search=${encodeURIComponent(q)}&limit=6&status=active`
          );
          const json = await res.json();
          if (json.success) {
            setSuggestions(json.data ?? []);
            setSuggestOpen(true);
          }
        } catch {
          /* ignore */
        } finally {
          setSuggestLoading(false);
        }
      }, 280);
    },
    [apiUrl],
  );

  // ── Handlers ──
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    setActiveIdx(-1);
    fetchSuggestions(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSuggestOpen(false);
      return;
    }
    if (!suggestOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      const p = suggestions[activeIdx];
      setSuggestOpen(false);
      setSearchInput(p.ten);
      router.push(`/sanpham/${p.slug}`);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    setSuggestOpen(false);
    setInputFocused(false);
    router.push(`/sanpham?tu-khoa=${encodeURIComponent(q)}`);
  };

  const handleTrendingClick = (kw: string) => {
    setSearchInput(kw);
    setSuggestOpen(false);
    setInputFocused(false);
    router.push(`/sanpham?tu-khoa=${encodeURIComponent(kw)}`);
  };

  const handleSuggestionClick = (p: SearchProduct) => {
    setSuggestOpen(false);
    setInputFocused(false);
    setSearchInput(p.ten);
    router.push(`/sanpham/${p.slug}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("smarthub_token");
    localStorage.removeItem("smarthub_user");
    setIsLoggedIn(false);
    setUserRole(null);
    setShowUserMenu(false);
    router.push("/");
  };

  // ── Dropdown visibility logic ──
  const showTrending  = inputFocused && !searchInput.trim();
  const showResults   = suggestOpen && !!searchInput.trim();
  const showDropdown  = showTrending || showResults || (suggestLoading && !!searchInput.trim());

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 shadow-sm dark:shadow-slate-900/50">

      {/* ── Top bar ── */}
      <div className="bg-red-700 dark:bg-red-900">
        <div className="max-w-screen-xl mx-auto px-6 py-1.5 flex items-center justify-between">
          <span className="text-xs text-red-200">
            Chào mừng đến với{" "}
            <span className="text-white font-semibold">SMARTHUB</span>{" "}
            — Thế giới công nghệ
          </span>
          <a
            href="tel:18009999"
            className="flex items-center gap-1.5 text-white text-xs font-medium hover:text-red-200 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            1800 9999
          </a>
        </div>
      </div>

      {/* ── Main header ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center gap-4">

          <Logo className="flex-shrink-0" />
          <MegaMenuButton />

          {/* Search */}
          <div ref={searchRef} className="flex-1 relative">
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                value={searchInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                className="w-full bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 pl-4 pr-12 py-2.5 rounded-xl text-sm outline-none border border-gray-200 dark:border-slate-600 focus:border-red-400 focus:bg-white dark:focus:bg-slate-700 transition-all"
                autoComplete="off"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 w-11 flex items-center justify-center rounded-r-xl bg-red-600 hover:bg-red-700 transition-colors text-white"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Suggestions / Trending dropdown */}
            {showDropdown && (
              <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-sm shadow-xl z-50 overflow-hidden">

                {/* ── Trending (empty input) ── */}
                {showTrending && (
                  <div className="p-4">
                    <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-gray-400 uppercase tracking-wide mb-3">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Tìm kiếm phổ biến
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {TRENDING_KEYWORDS.map((kw) => (
                        <button
                          key={kw}
                          onClick={() => handleTrendingClick(kw)}
                          className="px-3.5 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 text-[12.5px] font-medium rounded-full transition-colors"
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Loading skeleton ── */}
                {suggestLoading && suggestions.length === 0 && (
                  <div className="p-3 space-y-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 px-2 py-2 animate-pulse">
                        <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-100 rounded w-1/3" />
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-20 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* ── No results ── */}
                {showResults && !suggestLoading && suggestions.length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-[13px] text-gray-400">
                      Không tìm thấy sản phẩm cho &ldquo;{searchInput}&rdquo;
                    </p>
                  </div>
                )}

                {/* ── Product list ── */}
                {showResults && suggestions.length > 0 && (
                  <>
                    <div>
                      {suggestions.map((p, i) => (
                        <button
                          key={p.id}
                          onClick={() => handleSuggestionClick(p)}
                          onMouseEnter={() => setActiveIdx(i)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            i === activeIdx ? "bg-red-50" : "hover:bg-gray-50"
                          } ${i > 0 ? "border-t border-gray-50" : ""}`}
                        >
                          <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden shrink-0">
                            <img
                              src={p.thumbnail || "https://placehold.co/40x40?text=?"}
                              alt=""
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-gray-800 font-medium truncate leading-tight">
                              {p.ten}
                            </p>
                            <p className="text-[11.5px] text-gray-400 mt-0.5">{p.thuongHieu}</p>
                          </div>
                          <p className="text-[13px] font-bold text-red-600 shrink-0">
                            {fmtPrice(p.giaSale ?? p.gia)}
                          </p>
                        </button>
                      ))}
                    </div>

                    {/* View all results */}
                    <button
                      onClick={() => handleSubmit()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-red-50 border-t border-gray-100 text-[13px] text-red-600 font-semibold hover:text-red-700 transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Xem tất cả kết quả cho &ldquo;{searchInput}&rdquo;
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-1.5">

            <Link
              href="/sosanh"
              title="So sánh sản phẩm"
              className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all relative"
            >
              <Repeat className="w-5 h-5" />
              {compareItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {compareItems.length}
                </span>
              )}
            </Link>

            <Link
              href="/giohang"
              title="Giỏ hàng"
              className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {isLoggedIn ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title="Tài khoản"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all"
                >
                  <User className="w-5 h-5" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-50">
                    <Link
                      href="/nguoidung"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      Thông tin cá nhân
                    </Link>
                    <Link
                      href="/don-hang"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      Đơn hàng của tôi
                    </Link>
                    {userRole === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2.5 text-sm text-amber-500 font-medium hover:bg-amber-50 transition-colors"
                      >
                        Trang quản trị
                      </Link>
                    )}
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                <User className="w-4 h-4" />
                Đăng nhập
              </Link>
            )}
          </div>

          {/* Mobile menu btn */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-500 hover:text-gray-800 transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ── Ticker ── */}
      <div className="bg-red-50 dark:bg-slate-800 border-b border-red-100 dark:border-slate-700 overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-6 py-1.5 flex items-center gap-3">
          <span className="flex-shrink-0 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded">
            HOT
          </span>
          <div className="overflow-hidden flex-1">
            <div className="flex gap-8 animate-ticker whitespace-nowrap">
              {[...HOT_PRODUCTS, ...HOT_PRODUCTS].map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleTrendingClick(p)}
                  className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 px-6 py-5 space-y-3 shadow-lg">

          {/* Mobile search */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-red-400 focus-within:bg-white transition-colors">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchInput}
              onChange={handleInputChange}
              className="flex-1 bg-transparent text-[13px] text-gray-900 outline-none placeholder-gray-400"
              autoComplete="off"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          <div className="space-y-1">
            {mobileCategories.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded-sm bg-gray-100 animate-pulse" />
              ))
            ) : (
              mobileCategories.map((cat) => {
                const CatIcon = CATEGORY_ICON_MAP[cat.slug] || Smartphone;
                return (
                  <Link
                    key={cat.slug}
                    href={`/sanpham?danh-muc=${encodeURIComponent(cat.slug)}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <CatIcon className="w-4 h-4 flex-shrink-0" />
                    {cat.category_name}
                  </Link>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-100 pt-3 flex gap-3">
            <Link
              href="/giohang"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Giỏ hàng {cartCount > 0 && `(${cartCount})`}
            </Link>
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
              >
                <User className="w-5 h-5" />
                Đăng xuất
              </button>
            ) : (
              <Link
                href="/login"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
              >
                <User className="w-5 h-5" />
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
