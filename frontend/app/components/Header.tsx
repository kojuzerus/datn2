"use client";

import Link from "next/link";
import { Search, User, ShoppingCart, Menu, X, Repeat, Phone } from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchContext } from "./searchContext";

export default function Header() {
  const cartItems: any[] = [];
  const cartCount = cartItems.reduce(
    (count: number, item: any) => count + Number(item.quantity),
    0,
  );

  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [userRole, setUserRole] = useState<string | null>(null);

  const { keyword, setKeyword } = useContext(SearchContext);
  const router = useRouter();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
      if (!token) { setUserRole(null); return; }
      try {
        const res = await fetch("http://localhost:3000/users/userinfo", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserRole(data?.role ?? null);
        }
      } catch { setUserRole(null); }
    };
    checkLoginStatus();
    window.addEventListener("focus", checkLoginStatus);
    window.addEventListener("storage", checkLoginStatus);
    return () => {
      window.removeEventListener("focus", checkLoginStatus);
      window.removeEventListener("storage", checkLoginStatus);
    };
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    if (e.target.value.trim()) router.push("/timkiem");
  };

  const hotProducts = [
    "iPhone 17 Pro Max",
    "Samsung Galaxy Z Fold7 5G",
    "MacBook Air M4 2025",
    "Laptop Lenovo LOQ 15IRR9",
    "iPad Pro M4",
    "Apple Watch Ultra 3",
    "ASUS ROG Zephyrus G16",
    "Sony WH-1000XM6",
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">

      {/* Top bar — đỏ đậm */}
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

      {/* Main header — trắng */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-red-600 transition-transform group-hover:scale-105">
              💻
            </div>
            <div className="leading-none hidden sm:block">
              <div className="text-lg font-bold text-gray-900 tracking-tight">
                SMART<span className="text-red-600">HUB</span>
              </div>
              <div className="text-[9px] text-gray-400 tracking-[2px] mt-0.5">CÔNG NGHỆ</div>
            </div>
          </Link>

          {/* Danh mục */}
          <Link
            href="/sanpham"
            className="hidden md:flex items-center gap-2 flex-shrink-0 font-semibold text-sm px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <Menu className="w-4 h-4" />
            Danh mục
          </Link>

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
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title="Tài khoản"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all"
                >
                  <User className="w-5 h-5" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50">
                    <Link href="/nguoidung" className="block px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                      Thông tin cá nhân
                    </Link>
                    <Link href="/donhang" className="block px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                      Đơn hàng của tôi
                    </Link>
                    {userRole === "admin" && (
                      <Link href="/admin/product" className="block px-4 py-2.5 text-sm text-amber-500 font-medium hover:bg-amber-50 transition-colors">
                        Trang quản trị
                      </Link>
                    )}
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => {
                        localStorage.removeItem("token");
                        document.cookie = "token=; path=/; max-age=0";
                        setIsLoggedIn(false);
                        setUserRole(null);
                        setShowUserMenu(false);
                        router.push("/");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors" > <User className="w-4 h-4" /> Đăng nhập </Link>
            )}
          </div>

          {/* Mobile menu btn */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-500 hover:text-gray-800 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Ticker */}
      <div className="bg-red-50 border-b border-red-100 overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-6 py-1.5 flex items-center gap-3">
          <span className="flex-shrink-0 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded">
            HOT
          </span>
          <div className="overflow-hidden flex-1">
            <div className="flex gap-8 animate-ticker whitespace-nowrap">
              {[...hotProducts, ...hotProducts].map((p, i) => (
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

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-5 space-y-4 shadow-lg">
          <div className="flex gap-3 pt-2">
            <Link
              href="/giohang"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Giỏ hàng {cartCount > 0 && `(${cartCount})`}
            </Link>
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
            >
              <User className="w-5 h-5" />
              Đăng nhập
            </Link>
          </div>
        </div>
      )}
      
    </header>
  );
  
}