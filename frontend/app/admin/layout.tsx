"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderOpen,
  Tag,
  BarChart2,
  Settings,
  Bell,
  Search,
  HelpCircle,
  ChevronDown,
  LogOut,
  Home,
  ChevronRight,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  badge: number | null;
}

const NAV_GROUPS: { section: string; items: NavItem[] }[] = [
  {
    section: "Tổng quan",
    items: [
      { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, badge: null },
    ],
  },
  {
    section: "Danh mục",
    items: [
      { href: "/admin/products",   label: "Quản lý sản phẩm",   Icon: Package,      badge: null },
      { href: "/admin/orders",     label: "Quản lý đơn hàng",   Icon: ShoppingCart, badge: null },
      { href: "/admin/users",      label: "Quản lý khách hàng", Icon: Users,        badge: null },
      { href: "/admin/categories", label: "Danh mục",           Icon: FolderOpen,   badge: null },
      { href: "/admin/promotions", label: "Mã giảm giá",        Icon: Tag,          badge: null },
      { href: "/admin/reports",    label: "Báo cáo thống kê",   Icon: BarChart2,    badge: null },
    ],
  },
  {
    section: "Cấu hình",
    items: [
      { href: "/admin/settings",   label: "Cài đặt",            Icon: Settings,     badge: null },
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
  const pathname  = usePathname();
  const router    = useRouter();
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const pageLabel = getPageLabel(pathname ?? "");

  useEffect(() => {
    const token = localStorage.getItem("smarthub_token");
    const userRaw = localStorage.getItem("smarthub_user");
    const user = userRaw ? JSON.parse(userRaw) : null;
    if (!token || user?.role !== "admin") {
      router.replace("/login");
      return;
    }
    setAdminName(user.hoTen || "Admin");
    setChecked(true);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("smarthub_token");
    localStorage.removeItem("smarthub_user");
    router.replace("/login");
  };

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(href + "/");

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center text-[13px] text-gray-400">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen bg-[#F5F6FA] ${plusJakarta.className}`}>

      {/* ═══ SIDEBAR ═══ */}
      <aside className="w-[228px] shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0 z-50 overflow-y-auto shadow-[1px_0_0_0_#F3F4F6]">

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-[15px] shrink-0"
               style={{ background: "linear-gradient(135deg,#D32F2F,#B71C1C)" }}>
            S
          </div>
          <div>
            <div className="text-[15px] font-bold text-gray-900 leading-tight tracking-tight">SmartHub</div>
            <div className="text-[9.5px] text-gray-400 tracking-[1.5px] uppercase mt-0.5">Admin Panel</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.section} className="mb-1">
              <div className="text-[10px] font-semibold text-gray-400 tracking-[1.4px] uppercase px-5 pt-3 pb-1.5">
                {group.section}
              </div>

              {group.items.map(({ href, label, Icon, badge }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`
                      flex items-center gap-3 mx-2.5 px-3 py-[9px] rounded-xl text-[13px] no-underline transition-all duration-150 mb-0.5
                      ${active
                        ? "text-[#D32F2F] bg-[#FFF5F5] font-semibold"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 font-normal"}
                    `}
                  >
                    <Icon
                      className={`shrink-0 ${active ? "text-[#D32F2F]" : "text-gray-400"}`}
                      size={16}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    <span className="flex-1 leading-tight">{label}</span>
                    {badge != null && (
                      <span className="bg-[#D32F2F] text-white text-[10px] font-bold px-[6px] py-[1.5px] rounded-full min-w-[18px] text-center leading-snug">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-t border-gray-100 shrink-0 bg-gray-50/60">
          <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
               style={{ background: "linear-gradient(135deg,#D32F2F,#B71C1C)" }}>
            AD
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-gray-900 truncate">{adminName}</div>
            <div className="text-[11px] text-gray-400 leading-tight">Quản trị viên</div>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="text-gray-400 hover:text-[#D32F2F] cursor-pointer transition-colors p-1.5 rounded-sm hover:bg-red-50"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <div className="flex-1 ml-[228px] flex flex-col min-h-screen">

        {/* TOPBAR */}
        <header className="bg-white h-[58px] flex items-center px-6 gap-4 border-b border-gray-100 sticky top-0 z-40 shrink-0">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12.5px] text-gray-400 shrink-0">
            <Home size={13} className="text-gray-400" />
            <ChevronRight size={12} className="text-gray-300" />
            <span className="text-gray-700 font-medium">{pageLabel}</span>
          </div>

          {/* Về trang chủ */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 text-[12.5px] text-gray-500 hover:text-[#D32F2F] border border-gray-200 hover:border-[#D32F2F] rounded-xl px-3 py-1.5 no-underline transition-colors shrink-0"
          >
            <ArrowLeftRight size={13} /> Về trang chủ
          </Link>

          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-[7px] border border-gray-200 flex-1 max-w-[440px] ml-2 focus-within:border-[#D32F2F] focus-within:bg-white transition-all duration-200 shadow-none focus-within:shadow-[0_0_0_3px_rgba(211,47,47,0.08)]">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, đơn hàng, khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none bg-transparent outline-none text-[13px] text-gray-900 w-full placeholder-gray-400"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">

            {/* Bell */}
            <button
              title="Thông báo"
              className="relative w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center cursor-pointer hover:border-[#D32F2F] hover:bg-[#FFF5F5] transition-all duration-150"
            >
              <Bell size={16} className="text-gray-500" />
              <span className="absolute -top-1 -right-1 w-[17px] h-[17px] bg-[#D32F2F] rounded-full text-[9px] text-white flex items-center justify-center font-bold border-2 border-white">
                3
              </span>
            </button>

            {/* Help */}
            <button
              title="Trợ giúp"
              className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center cursor-pointer hover:border-[#D32F2F] hover:bg-[#FFF5F5] transition-all duration-150"
            >
              <HelpCircle size={16} className="text-gray-500" />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Profile */}
            <div className="flex items-center gap-2 cursor-pointer pl-1 pr-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div
                className="w-[30px] h-[30px] rounded-full text-white text-[11px] font-bold flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#D32F2F,#B71C1C)" }}
              >
                AD
              </div>
              <div>
                <div className="text-[12.5px] font-semibold text-gray-900 leading-tight">{adminName}</div>
                <div className="text-[10.5px] text-gray-400 leading-tight">Quản trị viên</div>
              </div>
              <ChevronDown size={13} className="text-gray-400 ml-0.5" />
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
