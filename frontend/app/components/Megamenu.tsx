"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Menu, X } from "lucide-react";

type BrandData = {
  name: string;
  links: { label: string; href: string }[];
};

type CategoryData = {
  icon: string;
  title: string;
  sub: string;
  sidebar: { icon: string; label: string; key: string }[];
  brands: Record<string, BrandData>;
  defaultBrands: string[];
};

const CATEGORIES: Record<string, CategoryData> = {
  dienthoai: {
    icon: "📱",
    title: "Điện thoại",
    sub: "Smartphone mới nhất 2025",
    sidebar: [
      { icon: "🍎", label: "Apple iPhone", key: "iphone" },
      { icon: "📱", label: "Samsung", key: "samsung" },
      { icon: "📱", label: "Xiaomi", key: "xiaomi" },
      { icon: "📱", label: "OPPO", key: "oppo" },
    ],
    brands: {
      iphone: {
        name: "Apple iPhone",
        links: [
          { label: "iPhone 17 Pro Max", href: "/sanpham?q=iphone+17+pro+max" },
          { label: "iPhone 17 Pro", href: "/sanpham?q=iphone+17+pro" },
          { label: "iPhone 17", href: "/sanpham?q=iphone+17" },
          { label: "iPhone 16 series", href: "/sanpham?q=iphone+16" },
          { label: "iPhone SE", href: "/sanpham?q=iphone+se" },
        ],
      },
      samsung: {
        name: "Samsung",
        links: [
          { label: "Galaxy S25 Ultra", href: "/sanpham?q=galaxy+s25+ultra" },
          { label: "Galaxy Z Fold7", href: "/sanpham?q=galaxy+z+fold7" },
          { label: "Galaxy Z Flip7", href: "/sanpham?q=galaxy+z+flip7" },
          { label: "Galaxy A series", href: "/sanpham?q=galaxy+a" },
        ],
      },
      xiaomi: {
        name: "Xiaomi",
        links: [
          { label: "Xiaomi 15 Ultra", href: "/sanpham?q=xiaomi+15+ultra" },
          { label: "Redmi Note 14", href: "/sanpham?q=redmi+note+14" },
          { label: "POCO X7 Pro", href: "/sanpham?q=poco+x7+pro" },
        ],
      },
      oppo: {
        name: "OPPO",
        links: [
          { label: "OPPO Find N5", href: "/sanpham?q=oppo+find+n5" },
          { label: "OPPO Reno13", href: "/sanpham?q=oppo+reno13" },
          { label: "OPPO A3 Pro", href: "/sanpham?q=oppo+a3+pro" },
        ],
      },
    },
    defaultBrands: ["iphone", "samsung", "xiaomi", "oppo"],
  },
  laptop: {
    icon: "💻",
    title: "Laptop",
    sub: "Khám phá sản phẩm tốt nhất",
    sidebar: [
      { icon: "🍎", label: "Apple (Macbook)", key: "apple" },
      { icon: "💻", label: "Asus", key: "asus" },
      { icon: "💻", label: "Lenovo", key: "lenovo" },
      { icon: "💻", label: "Acer", key: "acer" },
      { icon: "💻", label: "Dell", key: "dell" },
      { icon: "💻", label: "HP", key: "hp" },
    ],
    brands: {
      apple: {
        name: "Apple (Macbook)",
        links: [
          { label: "MacBook Air 13 inch", href: "/sanpham?q=macbook+air+13" },
          { label: "MacBook Air 15 inch", href: "/sanpham?q=macbook+air+15" },
          { label: "MacBook Pro 14 inch", href: "/sanpham?q=macbook+pro+14" },
          { label: "MacBook Pro 16 inch", href: "/sanpham?q=macbook+pro+16" },
          { label: "MacBook M5 Series", href: "/sanpham?q=macbook+m5" },
        ],
      },
      asus: {
        name: "Asus",
        links: [
          { label: "Asus ZenBook", href: "/sanpham?q=asus+zenbook" },
          { label: "Asus VivoBook", href: "/sanpham?q=asus+vivobook" },
          { label: "Asus TUF Gaming", href: "/sanpham?q=asus+tuf+gaming" },
          { label: "Asus ROG", href: "/sanpham?q=asus+rog" },
        ],
      },
      lenovo: {
        name: "Lenovo",
        links: [
          { label: "Lenovo Gaming LOQ", href: "/sanpham?q=lenovo+loq" },
          { label: "Lenovo Yoga", href: "/sanpham?q=lenovo+yoga" },
          { label: "Lenovo Legion Gaming", href: "/sanpham?q=lenovo+legion" },
          { label: "Lenovo ThinkBook", href: "/sanpham?q=lenovo+thinkbook" },
          { label: "Lenovo ThinkPad", href: "/sanpham?q=lenovo+thinkpad" },
        ],
      },
      acer: {
        name: "Acer",
        links: [
          { label: "Acer Swift", href: "/sanpham?q=acer+swift" },
          { label: "Acer Nitro", href: "/sanpham?q=acer+nitro" },
          { label: "Acer Aspire", href: "/sanpham?q=acer+aspire" },
          { label: "Acer Aspire Gaming", href: "/sanpham?q=acer+aspire+gaming" },
          { label: "Acer Predator", href: "/sanpham?q=acer+predator" },
        ],
      },
      dell: {
        name: "Dell",
        links: [
          { label: "Dell XPS", href: "/sanpham?q=dell+xps" },
          { label: "Dell Inspiron", href: "/sanpham?q=dell+inspiron" },
          { label: "Dell Vostro", href: "/sanpham?q=dell+vostro" },
          { label: "Dell Latitude", href: "/sanpham?q=dell+latitude" },
          { label: "Dell Gaming G Series", href: "/sanpham?q=dell+gaming" },
        ],
      },
      hp: {
        name: "HP",
        links: [
          { label: "HP 14/15 – 14s/15s", href: "/sanpham?q=hp+14+15" },
          { label: "HP ProBook", href: "/sanpham?q=hp+probook" },
          { label: "HP Envy", href: "/sanpham?q=hp+envy" },
          { label: "HP Victus", href: "/sanpham?q=hp+victus" },
          { label: "HP Omen", href: "/sanpham?q=hp+omen" },
        ],
      },
    },
    defaultBrands: ["apple", "asus", "lenovo", "acer", "dell", "hp"],
  },
  dienmay: {
    icon: "📺",
    title: "Điện máy",
    sub: "Thiết bị gia dụng thông minh",
    sidebar: [
      { icon: "📺", label: "TV & Màn hình", key: "tv" },
      { icon: "❄️", label: "Máy lạnh", key: "ac" },
      { icon: "🫧", label: "Máy giặt", key: "washer" },
      { icon: "🍳", label: "Đồ gia dụng", key: "household" },
    ],
    brands: {
      tv: {
        name: "TV & Màn hình",
        links: [
          { label: "Samsung QLED", href: "/sanpham?q=samsung+qled" },
          { label: "LG OLED", href: "/sanpham?q=lg+oled" },
          { label: "Sony Bravia", href: "/sanpham?q=sony+bravia" },
          { label: "TCL TV", href: "/sanpham?q=tcl+tv" },
        ],
      },
      ac: {
        name: "Máy lạnh",
        links: [
          { label: "Daikin Inverter", href: "/sanpham?q=daikin" },
          { label: "Panasonic Inverter", href: "/sanpham?q=panasonic+dieu+hoa" },
          { label: "Mitsubishi", href: "/sanpham?q=mitsubishi+dieu+hoa" },
          { label: "LG Inverter", href: "/sanpham?q=lg+dieu+hoa" },
        ],
      },
      washer: {
        name: "Máy giặt",
        links: [
          { label: "LG ThinQ", href: "/sanpham?q=lg+may+giat" },
          { label: "Samsung AI Wash", href: "/sanpham?q=samsung+may+giat" },
          { label: "Electrolux", href: "/sanpham?q=electrolux" },
          { label: "Panasonic", href: "/sanpham?q=panasonic+may+giat" },
        ],
      },
      household: {
        name: "Đồ gia dụng",
        links: [
          { label: "Nồi cơm điện", href: "/sanpham?q=noi+com+dien" },
          { label: "Máy hút bụi", href: "/sanpham?q=may+hut+bui" },
          { label: "Lò vi sóng", href: "/sanpham?q=lo+vi+song" },
        ],
      },
    },
    defaultBrands: ["tv", "ac", "washer", "household"],
  },
  phukien: {
    icon: "🎧",
    title: "Phụ kiện",
    sub: "Tai nghe, loa, cáp sạc và hơn thế",
    sidebar: [
      { icon: "🎧", label: "Tai nghe", key: "headphones" },
      { icon: "🔊", label: "Loa", key: "speaker" },
      { icon: "🔋", label: "Sạc & Cáp", key: "charger" },
      { icon: "⌨️", label: "Bàn phím & Chuột", key: "keyboard" },
    ],
    brands: {
      headphones: {
        name: "Tai nghe",
        links: [
          { label: "Sony WH-1000XM6", href: "/sanpham?q=sony+wh1000xm6" },
          { label: "Apple AirPods Pro", href: "/sanpham?q=airpods+pro" },
          { label: "Samsung Galaxy Buds3", href: "/sanpham?q=galaxy+buds3" },
          { label: "JBL Tune", href: "/sanpham?q=jbl+tune" },
          { label: "Bose QuietComfort", href: "/sanpham?q=bose+quietcomfort" },
        ],
      },
      speaker: {
        name: "Loa",
        links: [
          { label: "JBL Charge 6", href: "/sanpham?q=jbl+charge+6" },
          { label: "Sony SRS-XB100", href: "/sanpham?q=sony+srs" },
          { label: "Harman Kardon", href: "/sanpham?q=harman+kardon" },
          { label: "Marshall Stanmore", href: "/sanpham?q=marshall" },
        ],
      },
      charger: {
        name: "Sạc & Cáp",
        links: [
          { label: "Sạc nhanh 65W", href: "/sanpham?q=sac+nhanh+65w" },
          { label: "Cáp USB-C", href: "/sanpham?q=cap+usb-c" },
          { label: "MagSafe", href: "/sanpham?q=magsafe" },
          { label: "Sạc dự phòng", href: "/sanpham?q=sac+du+phong" },
        ],
      },
      keyboard: {
        name: "Bàn phím & Chuột",
        links: [
          { label: "Keychron K2", href: "/sanpham?q=keychron+k2" },
          { label: "Logitech MX Keys", href: "/sanpham?q=logitech+mx+keys" },
          { label: "Razer DeathAdder", href: "/sanpham?q=razer+deathadder" },
          { label: "Apple Magic Mouse", href: "/sanpham?q=magic+mouse" },
        ],
      },
    },
    defaultBrands: ["headphones", "speaker", "charger", "keyboard"],
  },
  tablet: {
    icon: "📟",
    title: "Tablet",
    sub: "iPad và máy tính bảng",
    sidebar: [
      { icon: "🍎", label: "iPad", key: "ipad" },
      { icon: "📟", label: "Samsung Tab", key: "samsungtab" },
      { icon: "📟", label: "Xiaomi Pad", key: "xiaomipad" },
    ],
    brands: {
      ipad: {
        name: "iPad",
        links: [
          { label: "iPad Pro M4", href: "/sanpham?q=ipad+pro+m4" },
          { label: "iPad Air M2", href: "/sanpham?q=ipad+air+m2" },
          { label: "iPad mini 7", href: "/sanpham?q=ipad+mini+7" },
          { label: "iPad 10th gen", href: "/sanpham?q=ipad+10" },
        ],
      },
      samsungtab: {
        name: "Samsung Tab",
        links: [
          { label: "Galaxy Tab S10 Ultra", href: "/sanpham?q=galaxy+tab+s10+ultra" },
          { label: "Galaxy Tab S10+", href: "/sanpham?q=galaxy+tab+s10+" },
          { label: "Galaxy Tab A9+", href: "/sanpham?q=galaxy+tab+a9+" },
        ],
      },
      xiaomipad: {
        name: "Xiaomi Pad",
        links: [
          { label: "Xiaomi Pad 7 Pro", href: "/sanpham?q=xiaomi+pad+7+pro" },
          { label: "Xiaomi Pad 6", href: "/sanpham?q=xiaomi+pad+6" },
          { label: "Redmi Pad Pro", href: "/sanpham?q=redmi+pad+pro" },
        ],
      },
    },
    defaultBrands: ["ipad", "samsungtab", "xiaomipad"],
  },
};

const CAT_ORDER = ["dienthoai", "laptop", "dienmay", "phukien", "tablet"];

// ─── Panel nội dung bên phải ──────────────────────────────────────────────────

function BrandPanel({
  catKey,
  onClose,
}: {
  catKey: string;
  onClose: () => void;
}) {
  const cat = CATEGORIES[catKey];
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const brandsToShow = activeBrand ? [activeBrand] : cat.defaultBrands;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar brand */}
      <div className="w-44 flex-shrink-0 bg-gray-50 border-r border-gray-100 py-2">
        {cat.sidebar.map((item) => (
          <button
            key={item.key}
            onMouseEnter={() => setActiveBrand(item.key)}
            onMouseLeave={() => setActiveBrand(null)}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-all border-l-[3px] text-left
              ${
                activeBrand === item.key
                  ? "border-red-600 bg-white text-red-600 font-medium"
                  : "border-transparent text-gray-600 hover:bg-white hover:text-red-500 hover:border-red-300"
              }`}
          >
            <span className="flex items-center gap-2">
              <span>{item.icon}</span>
              {item.label}
            </span>
            <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Nội dung brand */}
      <div className="flex-1 p-5 overflow-y-auto">
        {/* Header danh mục */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-base">
            {cat.icon}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-900">{cat.title}</p>
            <p className="text-[11px] text-gray-400">{cat.sub}</p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          {brandsToShow.map((key) => {
            const brand = cat.brands[key];
            if (!brand) return null;
            return (
              <div key={key}>
                <p className="text-[12.5px] font-semibold text-gray-800 mb-2 flex items-center gap-1">
                  {brand.name}
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                </p>
                <div className="flex flex-col gap-1">
                  {brand.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className="text-[12px] text-gray-500 hover:text-red-600 transition-colors py-0.5"
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

// ─── Export chính ─────────────────────────────────────────────────────────────

export default function MegaMenuButton() {
  const [open, setOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string>("dienthoai");
  const ref = useRef<HTMLDivElement>(null);

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative hidden md:block">
      {/* Nút Danh mục */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors
          ${open ? "bg-red-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        Danh mục
      </button>

      {/* Mega menu dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-2 flex rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
          style={{ width: 680, maxHeight: 480 }}
        >
          {/* Cột trái: danh mục chính */}
          <div className="w-48 flex-shrink-0 bg-white border-r border-gray-100 py-2">
            {CAT_ORDER.map((key) => {
              const cat = CATEGORIES[key];
              return (
                <button
                  key={key}
                  onMouseEnter={() => setActiveCat(key)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-[13.5px] transition-all border-l-[3px] text-left
                    ${
                      activeCat === key
                        ? "border-red-600 bg-red-50 text-red-600 font-semibold"
                        : "border-transparent text-gray-700 hover:bg-gray-50 hover:text-red-500"
                    }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">{cat.icon}</span>
                    {cat.title}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Cột phải: brand panel */}
          <BrandPanel
            catKey={activeCat}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}