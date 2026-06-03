"use client";

import Link from "next/link";
import {
  Search, User, ShoppingCart, Menu, X, Repeat, Phone, Smartphone,
  Laptop, Tv2, Headphones, TabletSmartphone, Speaker, Watch,
  BatteryCharging,
} from "lucide-react";
import { useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchContext } from "./searchContext";
import Logo from "./Logo";
import MegaMenuButton from "./Megamenu";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type CategoryItem = {
  category_id: number;
  category_name: string;
  slug: string;
  parent_id?: number | null;
  status: string;
};

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

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function Header() {
  const cartItems: any[] = [];
  const cartCount = cartItems.reduce((sum: number, item: any) => sum + Number(item.quantity), 0);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileCategories, setMobileCategories] = useState<CategoryItem[]>([]);

  const { keyword, setKeyword } = useContext(SearchContext);
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Fetch categories cho mobile menu
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

  // Check login
  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
      if (!token) { setUserRole(null); return; }
      try {
        const res = await fetch(`${apiUrl}/users/userinfo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserRole(data?.role ?? null);
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

  // Đóng user menu khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUserMenu]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    if (e.target.value.trim()) router.push("/timkiem");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; max-age=0";
    setIsLoggedIn(false);
    setUserRole(null);
    setShowUserMenu(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">

      {/* ── Top bar ── */}
      <div className="bg-red-700">
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
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center gap-4">

          {/* Logo */}
          <Logo className="flex-shrink-0" />

          {/* Mega menu desktop — lấy data từ MongoDB */}
          <MegaMenuButton />

          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              className="w-full bg-gray-50 text-gray-800 placeholder-gray-400 pl-4 pr-12 py-2.5 rounded-xl text-sm outline-none border border-gray-200 focus:border-red-400 focus:bg-white transition-all"
              value={keyword}
              onChange={handleSearch}
            />
            <button className="absolute right-0 top-0 bottom-0 w-11 flex items-center justify-center rounded-r-xl bg-red-600 hover:bg-red-700 transition-colors text-white">
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-1.5">

            {/* So sánh */}
            <button
              title="So sánh"
              className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
            >
              <Repeat className="w-5 h-5" />
            </button>

            {/* Giỏ hàng */}
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

            {/* User */}
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
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50">
                    <Link
                      href="/nguoidung"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      Thông tin cá nhân
                    </Link>
                    <Link
                      href="/donhang"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      Đơn hàng của tôi
                    </Link>
                    {userRole === "admin" && (
                      <Link
                        href="/admin/product"
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
      <div className="bg-red-50 border-b border-red-100 overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-6 py-1.5 flex items-center gap-3">
          <span className="flex-shrink-0 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded">
            HOT
          </span>
          <div className="overflow-hidden flex-1">
            <div className="flex gap-8 animate-ticker whitespace-nowrap">
              {[...HOT_PRODUCTS, ...HOT_PRODUCTS].map((p, i) => (
                <Link
                  key={i}
                  href="/sanpham"
                  className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                >
                  {p}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile menu — lấy data từ MongoDB ── */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-5 space-y-3 shadow-lg">
          <div className="space-y-1">
            {mobileCategories.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              ))
            ) : (
              mobileCategories.map((cat) => {
                const CatIcon = CATEGORY_ICON_MAP[cat.slug] || Smartphone;
                return (
                  <Link
                    key={cat.slug}
                    href={`/sanpham?danh-muc=${encodeURIComponent(cat.slug)}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
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
                href="/dangnhap"
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