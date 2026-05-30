"use client";

import Link from "next/link";
import {
  Search, User, ShoppingCart, Menu, X, Repeat, Phone, ChevronRight,
  Smartphone, Laptop, Tv2, Headphones, TabletSmartphone, Watch,
  Apple, Cpu, MonitorSmartphone, Speaker, BatteryCharging, Keyboard,
  Wind, WashingMachine, UtensilsCrossed, Star,
} from "lucide-react";
import { useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchContext } from "./searchContext";

// ─── DATA ─────────────────────────────────────────────────────────────────────

type BrandData = {
  name: string;
  links: { label: string; href: string }[];
};

type CategoryData = {
  Icon: React.ElementType;
  iconColor: string;
  title: string;
  sub: string;
  sidebar: { Icon: React.ElementType; label: string; key: string }[];
  brands: Record<string, BrandData>;
  defaultBrands: string[];
};

const CATEGORIES: Record<string, CategoryData> = {
  dienthoai: {
    Icon: Smartphone, iconColor: "bg-blue-500", title: "Điện thoại", sub: "Smartphone mới nhất 2025",
    sidebar: [
      { Icon: Apple,       label: "Apple iPhone", key: "iphone" },
      { Icon: Smartphone,  label: "Samsung",      key: "samsung" },
      { Icon: Smartphone,  label: "Xiaomi",        key: "xiaomi" },
      { Icon: Smartphone,  label: "OPPO",          key: "oppo" },
    ],
    brands: {
      iphone: { name: "Apple iPhone", links: [
        { label: "iPhone 17 Pro Max", href: "/sanpham?q=iphone+17+pro+max" },
        { label: "iPhone 17 Pro", href: "/sanpham?q=iphone+17+pro" },
        { label: "iPhone 17", href: "/sanpham?q=iphone+17" },
        { label: "iPhone 16 series", href: "/sanpham?q=iphone+16" },
        { label: "iPhone SE", href: "/sanpham?q=iphone+se" },
      ]},
      samsung: { name: "Samsung", links: [
        { label: "Galaxy S25 Ultra", href: "/sanpham?q=galaxy+s25+ultra" },
        { label: "Galaxy Z Fold7", href: "/sanpham?q=galaxy+z+fold7" },
        { label: "Galaxy Z Flip7", href: "/sanpham?q=galaxy+z+flip7" },
        { label: "Galaxy A series", href: "/sanpham?q=galaxy+a" },
      ]},
      xiaomi: { name: "Xiaomi", links: [
        { label: "Xiaomi 15 Ultra", href: "/sanpham?q=xiaomi+15+ultra" },
        { label: "Redmi Note 14", href: "/sanpham?q=redmi+note+14" },
        { label: "POCO X7 Pro", href: "/sanpham?q=poco+x7+pro" },
      ]},
      oppo: { name: "OPPO", links: [
        { label: "OPPO Find N5", href: "/sanpham?q=oppo+find+n5" },
        { label: "OPPO Reno13", href: "/sanpham?q=oppo+reno13" },
        { label: "OPPO A3 Pro", href: "/sanpham?q=oppo+a3+pro" },
      ]},
    },
    defaultBrands: ["iphone", "samsung", "xiaomi", "oppo"],
  },
  laptop: {
    Icon: Laptop, iconColor: "bg-violet-500", title: "Laptop", sub: "Khám phá sản phẩm tốt nhất",
    sidebar: [
      { Icon: Apple,  label: "Apple (Macbook)", key: "apple" },
      { Icon: Laptop, label: "Asus",            key: "asus" },
      { Icon: Laptop, label: "Lenovo",          key: "lenovo" },
      { Icon: Laptop, label: "Acer",            key: "acer" },
      { Icon: Laptop, label: "Dell",            key: "dell" },
      { Icon: Laptop, label: "HP",              key: "hp" },
    ],
    brands: {
      apple: { name: "Apple (Macbook)", links: [
        { label: "MacBook Air 13 inch", href: "/sanpham?q=macbook+air+13" },
        { label: "MacBook Air 15 inch", href: "/sanpham?q=macbook+air+15" },
        { label: "MacBook Pro 14 inch", href: "/sanpham?q=macbook+pro+14" },
        { label: "MacBook Pro 16 inch", href: "/sanpham?q=macbook+pro+16" },
        { label: "MacBook M5 Series", href: "/sanpham?q=macbook+m5" },
      ]},
      asus: { name: "Asus", links: [
        { label: "Asus ZenBook", href: "/sanpham?q=asus+zenbook" },
        { label: "Asus VivoBook", href: "/sanpham?q=asus+vivobook" },
        { label: "Asus TUF Gaming", href: "/sanpham?q=asus+tuf+gaming" },
        { label: "Asus ROG", href: "/sanpham?q=asus+rog" },
      ]},
      lenovo: { name: "Lenovo", links: [
        { label: "Lenovo Gaming LOQ", href: "/sanpham?q=lenovo+loq" },
        { label: "Lenovo Yoga", href: "/sanpham?q=lenovo+yoga" },
        { label: "Lenovo Legion Gaming", href: "/sanpham?q=lenovo+legion" },
        { label: "Lenovo ThinkBook", href: "/sanpham?q=lenovo+thinkbook" },
        { label: "Lenovo ThinkPad", href: "/sanpham?q=lenovo+thinkpad" },
      ]},
      acer: { name: "Acer", links: [
        { label: "Acer Swift", href: "/sanpham?q=acer+swift" },
        { label: "Acer Nitro", href: "/sanpham?q=acer+nitro" },
        { label: "Acer Aspire", href: "/sanpham?q=acer+aspire" },
        { label: "Acer Aspire Gaming", href: "/sanpham?q=acer+aspire+gaming" },
        { label: "Acer Predator", href: "/sanpham?q=acer+predator" },
      ]},
      dell: { name: "Dell", links: [
        { label: "Dell XPS", href: "/sanpham?q=dell+xps" },
        { label: "Dell Inspiron", href: "/sanpham?q=dell+inspiron" },
        { label: "Dell Vostro", href: "/sanpham?q=dell+vostro" },
        { label: "Dell Latitude", href: "/sanpham?q=dell+latitude" },
        { label: "Dell Gaming G Series", href: "/sanpham?q=dell+gaming" },
      ]},
      hp: { name: "HP", links: [
        { label: "HP 14/15 – 14s/15s", href: "/sanpham?q=hp+14+15" },
        { label: "HP ProBook", href: "/sanpham?q=hp+probook" },
        { label: "HP Envy", href: "/sanpham?q=hp+envy" },
        { label: "HP Victus", href: "/sanpham?q=hp+victus" },
        { label: "HP Omen", href: "/sanpham?q=hp+omen" },
      ]},
    },
    defaultBrands: ["apple", "asus", "lenovo", "acer", "dell", "hp"],
  },
  dienmay: {
    Icon: Tv2, iconColor: "bg-emerald-500", title: "Điện máy", sub: "Thiết bị gia dụng thông minh",
    sidebar: [
      { Icon: Tv2,             label: "TV & Màn hình", key: "tv" },
      { Icon: Wind,            label: "Máy lạnh",      key: "ac" },
      { Icon: WashingMachine,  label: "Máy giặt",      key: "washer" },
      { Icon: UtensilsCrossed, label: "Đồ gia dụng",   key: "household" },
    ],
    brands: {
      tv: { name: "TV & Màn hình", links: [
        { label: "Samsung QLED", href: "/sanpham?q=samsung+qled" },
        { label: "LG OLED", href: "/sanpham?q=lg+oled" },
        { label: "Sony Bravia", href: "/sanpham?q=sony+bravia" },
        { label: "TCL TV", href: "/sanpham?q=tcl+tv" },
      ]},
      ac: { name: "Máy lạnh", links: [
        { label: "Daikin Inverter", href: "/sanpham?q=daikin" },
        { label: "Panasonic Inverter", href: "/sanpham?q=panasonic+dieu+hoa" },
        { label: "Mitsubishi", href: "/sanpham?q=mitsubishi+dieu+hoa" },
        { label: "LG Inverter", href: "/sanpham?q=lg+dieu+hoa" },
      ]},
      washer: { name: "Máy giặt", links: [
        { label: "LG ThinQ", href: "/sanpham?q=lg+may+giat" },
        { label: "Samsung AI Wash", href: "/sanpham?q=samsung+may+giat" },
        { label: "Electrolux", href: "/sanpham?q=electrolux" },
        { label: "Panasonic", href: "/sanpham?q=panasonic+may+giat" },
      ]},
      household: { name: "Đồ gia dụng", links: [
        { label: "Nồi cơm điện", href: "/sanpham?q=noi+com+dien" },
        { label: "Máy hút bụi", href: "/sanpham?q=may+hut+bui" },
        { label: "Lò vi sóng", href: "/sanpham?q=lo+vi+song" },
      ]},
    },
    defaultBrands: ["tv", "ac", "washer", "household"],
  },
  phukien: {
    Icon: Headphones, iconColor: "bg-orange-500", title: "Phụ kiện", sub: "Tai nghe, loa, cáp sạc và hơn thế",
    sidebar: [
      { Icon: Headphones,      label: "Tai nghe",         key: "headphones" },
      { Icon: Speaker,         label: "Loa",              key: "speaker" },
      { Icon: BatteryCharging, label: "Sạc & Cáp",        key: "charger" },
      { Icon: Keyboard,        label: "Bàn phím & Chuột", key: "keyboard" },
    ],
    brands: {
      headphones: { name: "Tai nghe", links: [
        { label: "Sony WH-1000XM6", href: "/sanpham?q=sony+wh1000xm6" },
        { label: "Apple AirPods Pro", href: "/sanpham?q=airpods+pro" },
        { label: "Samsung Galaxy Buds3", href: "/sanpham?q=galaxy+buds3" },
        { label: "JBL Tune", href: "/sanpham?q=jbl+tune" },
        { label: "Bose QuietComfort", href: "/sanpham?q=bose+quietcomfort" },
      ]},
      speaker: { name: "Loa", links: [
        { label: "JBL Charge 6", href: "/sanpham?q=jbl+charge+6" },
        { label: "Sony SRS-XB100", href: "/sanpham?q=sony+srs" },
        { label: "Harman Kardon", href: "/sanpham?q=harman+kardon" },
        { label: "Marshall Stanmore", href: "/sanpham?q=marshall" },
      ]},
      charger: { name: "Sạc & Cáp", links: [
        { label: "Sạc nhanh 65W", href: "/sanpham?q=sac+nhanh+65w" },
        { label: "Cáp USB-C", href: "/sanpham?q=cap+usb-c" },
        { label: "MagSafe", href: "/sanpham?q=magsafe" },
        { label: "Sạc dự phòng", href: "/sanpham?q=sac+du+phong" },
      ]},
      keyboard: { name: "Bàn phím & Chuột", links: [
        { label: "Keychron K2", href: "/sanpham?q=keychron+k2" },
        { label: "Logitech MX Keys", href: "/sanpham?q=logitech+mx+keys" },
        { label: "Razer DeathAdder", href: "/sanpham?q=razer+deathadder" },
        { label: "Apple Magic Mouse", href: "/sanpham?q=magic+mouse" },
      ]},
    },
    defaultBrands: ["headphones", "speaker", "charger", "keyboard"],
  },
  tablet: {
    Icon: TabletSmartphone, iconColor: "bg-cyan-500", title: "Tablet", sub: "iPad và máy tính bảng",
    sidebar: [
      { Icon: Apple,            label: "iPad",        key: "ipad" },
      { Icon: TabletSmartphone, label: "Samsung Tab",  key: "samsungtab" },
      { Icon: TabletSmartphone, label: "Xiaomi Pad",   key: "xiaomipad" },
    ],
    brands: {
      ipad: { name: "iPad", links: [
        { label: "iPad Pro M4", href: "/sanpham?q=ipad+pro+m4" },
        { label: "iPad Air M2", href: "/sanpham?q=ipad+air+m2" },
        { label: "iPad mini 7", href: "/sanpham?q=ipad+mini+7" },
        { label: "iPad 10th gen", href: "/sanpham?q=ipad+10" },
      ]},
      samsungtab: { name: "Samsung Tab", links: [
        { label: "Galaxy Tab S10 Ultra", href: "/sanpham?q=galaxy+tab+s10+ultra" },
        { label: "Galaxy Tab S10+", href: "/sanpham?q=galaxy+tab+s10+" },
        { label: "Galaxy Tab A9+", href: "/sanpham?q=galaxy+tab+a9+" },
      ]},
      xiaomipad: { name: "Xiaomi Pad", links: [
        { label: "Xiaomi Pad 7 Pro", href: "/sanpham?q=xiaomi+pad+7+pro" },
        { label: "Xiaomi Pad 6", href: "/sanpham?q=xiaomi+pad+6" },
        { label: "Redmi Pad Pro", href: "/sanpham?q=redmi+pad+pro" },
      ]},
    },
    defaultBrands: ["ipad", "samsungtab", "xiaomipad"],
  },
};

const CAT_ORDER = ["dienthoai", "laptop", "dienmay", "phukien", "tablet"];

const HOT_PRODUCTS = [
  "iPhone 17 Pro Max", "Samsung Galaxy Z Fold7 5G", "MacBook Air M4 2025",
  "Laptop Lenovo LOQ 15IRR9", "iPad Pro M4", "Apple Watch Ultra 3",
  "ASUS ROG Zephyrus G16", "Sony WH-1000XM6",
];

// ─── MEGA MENU ────────────────────────────────────────────────────────────────

function MegaMenu({ onClose }: { onClose: () => void }) {
  const [activeCat, setActiveCat] = useState<string>("dienthoai");
  const [activeBrand, setActiveBrand] = useState<string | null>(null);

  const cat = CATEGORIES[activeCat];
  const brandsToShow = activeBrand ? [activeBrand] : cat.defaultBrands;

  return (
    <div
      className="absolute top-full left-0 z-50 mt-1 flex bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      style={{ width: 700, maxHeight: 460 }}
    >
      {/* Cột 1: Danh mục chính */}
      <div className="w-48 flex-shrink-0 bg-gray-50 border-r border-gray-100 py-2 overflow-y-auto">
        {CAT_ORDER.map((key) => {
          const CatIcon = CATEGORIES[key].Icon;
          return (
            <button
              key={key}
              onMouseEnter={() => { setActiveCat(key); setActiveBrand(null); }}
              className={`w-full flex items-center justify-between px-4 py-3 text-[13.5px] transition-all border-l-[3px] text-left
                ${activeCat === key
                  ? "border-red-600 bg-white text-red-600 font-semibold"
                  : "border-transparent text-gray-700 hover:bg-white hover:text-red-500"
                }`}
            >
              <span className="flex items-center gap-2.5">
                <CatIcon className="w-4 h-4 flex-shrink-0" />
                {CATEGORIES[key].title}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Cột 2: Brand sidebar */}
      <div className="w-44 flex-shrink-0 bg-white border-r border-gray-100 py-2 overflow-y-auto">
        {cat.sidebar.map((item) => {
          const BrandIcon = item.Icon;
          return (
            <button
              key={item.key}
              onMouseEnter={() => setActiveBrand(item.key)}
              onMouseLeave={() => setActiveBrand(null)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-all border-l-[3px] text-left
                ${activeBrand === item.key
                  ? "border-red-500 bg-red-50 text-red-600 font-medium"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-red-500"
                }`}
            >
              <span className="flex items-center gap-2">
                <BrandIcon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </span>
              <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Cột 3: Nội dung brand */}
      <div className="flex-1 p-5 overflow-y-auto">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
          <div className={`w-9 h-9 rounded-xl ${cat.iconColor} flex items-center justify-center flex-shrink-0`}>
            <cat.Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-900">{cat.title}</p>
            <p className="text-[11px] text-gray-400">{cat.sub}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          {brandsToShow.map((key) => {
            const brand = cat.brands[key];
            if (!brand) return null;
            return (
              <div key={key}>
                <p className="text-[12.5px] font-semibold text-gray-800 mb-1.5 flex items-center gap-1">
                  {brand.name}
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                </p>
                <div className="flex flex-col gap-0.5">
                  {brand.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className="text-[12px] text-gray-500 hover:text-red-600 transition-colors py-0.5 leading-relaxed"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── HEADER CHÍNH ─────────────────────────────────────────────────────────────

export default function Header() {
  const cartItems: any[] = [];
  const cartCount = cartItems.reduce((count: number, item: any) => count + Number(item.quantity), 0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const { keyword, setKeyword } = useContext(SearchContext);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Check login
  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
      if (!token) { setUserRole(null); return; }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/userinfo`, {
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
  }, []);

  // Đóng mega menu khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

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

          {/* Nút Danh mục — click để mở mega menu */}
          <div ref={menuRef} className="relative hidden md:block flex-shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors
                ${menuOpen ? "bg-red-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              Danh mục
            </button>

            {menuOpen && (
              <MegaMenu onClose={() => setMenuOpen(false)} />
            )}
          </div>

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
                href="/dangnhap"
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

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-5 space-y-3 shadow-lg">
          {/* Danh mục mobile */}
          <div className="space-y-1">
            {CAT_ORDER.map((key) => {
              const CatIcon = CATEGORIES[key].Icon;
              return (
                <Link
                  key={key}
                  href={`/sanpham?danh-muc=${key}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <CatIcon className="w-4 h-4 flex-shrink-0" />
                  {CATEGORIES[key].title}
                </Link>
              );
            })}
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