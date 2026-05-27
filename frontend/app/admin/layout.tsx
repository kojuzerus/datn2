"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const NAV_ITEMS = [
  {
    section: "Tổng quan",
    items: [{ href: "/admin", label: "Thống kê", icon: "📊" }],
  },
  {
    section: "Quản lý",
    items: [
      { href: "/admin/products", label: "Sản phẩm", icon: "📦", badge: null },
      { href: "/admin/orders", label: "Đơn hàng", icon: "🛒", badge: 12 },
      { href: "/admin/users", label: "Người dùng", icon: "👥", badge: null },
      { href: "/admin/categories", label: "Danh mục", icon: "🗂️", badge: null },
      { href: "/admin/promotions", label: "Khuyến mãi", icon: "🏷️", badge: 3 },
    ],
  },
  {
    section: "Hệ thống",
    items: [{ href: "/admin/settings", label: "Cài đặt", icon: "⚙️" }],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f0f0f2", fontFamily: plusJakarta.style.fontFamily }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        minWidth: 220,
        background: "#C0121C",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{
          padding: "20px 18px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{
            width: 36, height: 36,
            background: "#fff",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: "#C0121C", fontWeight: 800,
          }}>S</div>
          <div>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>SmartHub</div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, letterSpacing: "0.8px", textTransform: "uppercase" }}>Admin Panel</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
          {NAV_ITEMS.map((group) => (
            <div key={group.section}>
              <div style={{
                fontSize: 10, fontWeight: 600,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.9px",
                textTransform: "uppercase",
                padding: "10px 18px 4px",
              }}>
                {group.section}
              </div>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "9px 18px",
                      color: isActive ? "#fff" : "rgba(255,255,255,0.75)",
                      fontWeight: isActive ? 600 : 400,
                      fontSize: 13,
                      borderLeft: isActive ? "3px solid #fff" : "3px solid transparent",
                      background: isActive ? "rgba(255,255,255,0.16)" : "transparent",
                      textDecoration: "none",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 16, width: 18, textAlign: "center" }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span style={{
                        background: "#fff",
                        color: "#C0121C",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 7px",
                        borderRadius: 20,
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{
          padding: "14px 18px",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          display: "flex",
          alignItems: "center",
          gap: 9,
        }}>
          <div style={{
            width: 34, height: 34,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff",
          }}>AD</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Admin</div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>Quản trị viên</div>
          </div>
          <button
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.55)",
              cursor: "pointer",
              fontSize: 18,
              padding: 0,
            }}
            title="Đăng xuất"
          >
            →
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 220, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Topbar */}
        <header style={{
          background: "#fff",
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 16,
          borderBottom: "1px solid #e5e5e5",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>Bảng điều khiển</span>

          {/* Search */}
          <div style={{
            flex: 1,
            maxWidth: 320,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#f5f5f5",
            borderRadius: 8,
            padding: "6px 12px",
            border: "1px solid #e0e0e0",
          }}>
            <span style={{ color: "#999", fontSize: 14 }}>🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, đơn hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: 13,
                color: "#1a1a1a",
                width: "100%",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{
              width: 36, height: 36,
              borderRadius: 8,
              border: "1px solid #e5e5e5",
              background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              fontSize: 16,
              position: "relative",
            }}>
              🔔
              <span style={{
                position: "absolute", top: 7, right: 7,
                width: 7, height: 7,
                borderRadius: "50%",
                background: "#C0121C",
                border: "1.5px solid #fff",
              }} />
            </button>
            <div style={{
              width: 36, height: 36,
              borderRadius: "50%",
              background: "#FCEBEB",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#C0121C",
              cursor: "pointer",
            }}>
              AD
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}