"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const NAV_GROUPS = [
  {
    section: "Tổng quan",
    items: [
      { href: "/admin",            label: "Dashboard",           icon: "📊", badge: null },
    ],
  },
  {
    section: "Danh mục",
    items: [
      { href: "/admin/products",   label: "Quản lý sản phẩm",   icon: "📦", badge: null },
      { href: "/admin/orders",     label: "Quản lý đơn hàng",   icon: "🛒", badge: 12   },
      { href: "/admin/users",      label: "Quản lý khách hàng", icon: "👥", badge: null },
      { href: "/admin/categories", label: "Danh mục",           icon: "🗂️", badge: null },
      { href: "/admin/promotions", label: "Mã giảm giá",        icon: "🏷️", badge: 3   },
      { href: "/admin/reports",    label: "Báo cáo thống kê",   icon: "📈", badge: null },
    ],
  },
  {
    section: "Cấu hình",
    items: [
      { href: "/admin/settings",   label: "Cài đặt",            icon: "⚙️", badge: null },
    ],
  },
];

const PAGE_LABELS: Record<string, string> = {
  "/admin":            "Dashboard",
  "/admin/products":   "Quản lý sản phẩm",
  "/admin/orders":     "Quản lý đơn hàng",
  "/admin/users":      "Quản lý khách hàng",
  "/admin/categories": "Danh mục",
  "/admin/promotions": "Mã giảm giá",
  "/admin/reports":    "Báo cáo thống kê",
  "/admin/settings":   "Cài đặt",
};

function getPageLabel(pathname: string): string {
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
  const match = Object.keys(PAGE_LABELS)
    .filter((k) => k !== "/admin" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_LABELS[match] : "Admin";
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const [search, setSearch] = useState("");
  const pageLabel  = getPageLabel(pathname ?? "");

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className={`flex min-h-screen bg-[#F5F6FA] ${plusJakarta.className}`}>

      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <aside className="w-[220px] shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-50 overflow-y-auto">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-[18px] py-4 border-b border-gray-200 shrink-0">
          <div className="w-9 h-9 bg-[#D32F2F] rounded-lg flex items-center justify-center text-white font-bold text-base shrink-0">
            S
          </div>
          <div>
            <div className="text-base font-bold text-gray-900 leading-tight">SmartHub</div>
            <div className="text-[10px] text-gray-400 tracking-widest uppercase">Admin Panel</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.section}>
              <div className="text-[10px] font-semibold text-gray-400 tracking-[1px] uppercase px-[18px] pt-3 pb-1">
                {group.section}
              </div>

              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-2.5 px-[18px] py-[9px] text-[13.5px] no-underline transition-all duration-150
                      border-l-[3px]
                      ${active
                        ? "text-[#D32F2F] bg-[#FFF5F5] border-l-[#D32F2F] font-semibold"
                        : "text-gray-500 bg-transparent border-l-transparent hover:text-gray-800 hover:bg-gray-50"}
                    `}
                  >
                    <span className="text-[17px] w-5 text-center shrink-0">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge != null && (
                      <span className="bg-[#D32F2F] text-white text-[10px] font-bold px-[7px] py-[2px] rounded-full min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="flex items-center gap-2.5 px-[18px] py-3.5 border-t border-gray-200 shrink-0">
          <div className="w-[34px] h-[34px] rounded-full bg-[#D32F2F] flex items-center justify-center text-xs font-bold text-white shrink-0">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-gray-900 truncate">Admin</div>
            <div className="text-[11px] text-gray-400">Quản trị viên</div>
          </div>
          <button title="Đăng xuất" className="bg-transparent border-none text-gray-400 cursor-pointer text-lg p-0 leading-none shrink-0">
            →
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN
      ══════════════════════════════════════════ */}
      <div className="flex-1 ml-[220px] flex flex-col min-h-screen">

        {/* TOPBAR */}
        <header className="bg-white h-[58px] flex items-center px-6 gap-4 border-b border-gray-200 sticky top-0 z-40 shrink-0">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
            <span>🏠</span>
            <span className="text-gray-300">›</span>
            <span className="text-gray-900 font-medium">{pageLabel}</span>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3.5 py-[7px] border border-gray-200 flex-1 max-w-[400px] ml-2 focus-within:border-[#D32F2F] focus-within:bg-white transition-colors">
            <span className="text-gray-400 text-[15px] shrink-0">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, đơn hàng, khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none bg-transparent outline-none text-[13px] text-gray-900 w-full placeholder-gray-400"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5 ml-auto">

            {/* Bell */}
            <button title="Thông báo" className="relative w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center cursor-pointer text-[17px] hover:border-[#D32F2F] transition-colors">
              🔔
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#D32F2F] rounded-full text-[9px] text-white flex items-center justify-center font-bold border-2 border-white">
                3
              </span>
            </button>

            {/* Help */}
            <button title="Trợ giúp" className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center cursor-pointer text-[17px] hover:border-[#D32F2F] transition-colors">
              ❓
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2 cursor-pointer px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
              <div className="w-[30px] h-[30px] rounded-full bg-[#D32F2F] text-white text-[11px] font-bold flex items-center justify-center">
                AD
              </div>
              <div>
                <div className="text-[13px] font-semibold text-gray-900 leading-tight">Admin</div>
                <div className="text-[11px] text-gray-400">Quản trị viên</div>
              </div>
              <span className="text-[11px] text-gray-400">▾</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}