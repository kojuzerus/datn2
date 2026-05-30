"use client";

import { useState, useEffect, useRef } from "react";
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from "chart.js";

Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

// ── Types ──────────────────────────────────────────────────────────────────
type Period = "day" | "week" | "month" | "year";

interface PeriodData {
  label: string;
  stats: { revenue: string; orders: string; users: string; cancel: string };
  chg: { revenue: string; orders: string; users: string; cancel: string };
  chgUp: { revenue: boolean; orders: boolean; users: boolean; cancel: boolean };
  chart1: { data: number[]; vals: string[] };
  chart2: { data: number[]; vals: string[] };
}

// ── Data ───────────────────────────────────────────────────────────────────
const PERIOD_DATA: Record<Period, PeriodData> = {
  day: {
    label: "Hôm nay — 27/05/2026",
    stats: { revenue: "12.4M", orders: "183", users: "94", cancel: "7" },
    chg: { revenue: "+8.2%", orders: "+5.4%", users: "+3.1%", cancel: "-1.2%" },
    chgUp: { revenue: true, orders: true, users: true, cancel: false },
    chart1: { data: [48, 27, 16, 9], vals: ["5.9M₫", "3.4M₫", "2.0M₫", "1.1M₫"] },
    chart2: { data: [55, 24, 14, 7], vals: ["101", "44", "26", "12"] },
  },
  week: {
    label: "Tuần này — 21/05 – 27/05/2026",
    stats: { revenue: "68.7M", orders: "921", users: "412", cancel: "34" },
    chg: { revenue: "+11.3%", orders: "+7.8%", users: "+4.5%", cancel: "-2.1%" },
    chgUp: { revenue: true, orders: true, users: true, cancel: false },
    chart1: { data: [44, 29, 18, 9], vals: ["30.2M₫", "19.9M₫", "12.4M₫", "6.2M₫"] },
    chart2: { data: [58, 22, 13, 7], vals: ["534", "203", "120", "64"] },
  },
  month: {
    label: "Tháng 5/2026",
    stats: { revenue: "284M", orders: "3.841", users: "1.623", cancel: "127" },
    chg: { revenue: "+14.6%", orders: "+9.2%", users: "+6.3%", cancel: "-3.4%" },
    chgUp: { revenue: true, orders: true, users: true, cancel: false },
    chart1: { data: [45, 28, 17, 10], vals: ["127.8M₫", "79.5M₫", "48.3M₫", "28.4M₫"] },
    chart2: { data: [60, 21, 12, 7], vals: ["2.305", "807", "461", "268"] },
  },
  year: {
    label: "Năm 2026 (đến nay)",
    stats: { revenue: "1.42T", orders: "19.284", users: "5.631", cancel: "614" },
    chg: { revenue: "+22.1%", orders: "+18.4%", users: "+15.7%", cancel: "-5.2%" },
    chgUp: { revenue: true, orders: true, users: true, cancel: false },
    chart1: { data: [43, 30, 17, 10], vals: ["610M₫", "426M₫", "241M₫", "143M₫"] },
    chart2: { data: [61, 20, 12, 7], vals: ["11.763", "3.857", "2.314", "1.350"] },
  },
};

const COLORS1 = ["#C0121C", "#378ADD", "#1D9E75", "#BA7517"];
const COLORS2 = ["#3B6D11", "#185FA5", "#854F0B", "#A32D2D"];
const LABELS1 = ["Điện thoại", "Laptop", "Phụ kiện", "Tivi"];
const LABELS2 = ["Hoàn thành", "Đang giao", "Chờ xử lý", "Đã hủy"];

const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "Ngày" },
  { key: "week", label: "Tuần" },
  { key: "month", label: "Tháng" },
  { key: "year", label: "Năm" },
];

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  change,
  isUp,
  iconBg,
  iconColor,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  isUp: boolean;
  iconBg: string;
  iconColor: string;
  icon: string;
}) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 10,
      border: "1px solid #e5e5e5",
      padding: 16,
      flex: 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>{label}</span>
        <div style={{
          width: 30, height: 30,
          borderRadius: 7,
          background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, color: iconColor,
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#111", letterSpacing: "-0.5px" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, marginTop: 4, color: isUp ? "#2d6a0a" : "#A32D2D", display: "flex", alignItems: "center", gap: 3 }}>
        <span>{isUp ? "▲" : "▼"}</span>
        <span>{change} so với kỳ trước</span>
      </div>
    </div>
  );
}

// ── Doughnut Chart ─────────────────────────────────────────────────────────
function DoughnutChart({
  id,
  labels,
  data,
  colors,
  vals,
  title,
  subtitle,
}: {
  id: string;
  labels: string[];
  data: number[];
  colors: string[];
  vals: string[];
  title: string;
  subtitle: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: "#fff",
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`,
            },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, [data, labels, colors]);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 10,
      border: "1px solid #e5e5e5",
      overflow: "hidden",
      flex: 1,
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #efefef" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{title}</div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{subtitle}</div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px" }}>
        {/* Canvas */}
        <div style={{ position: "relative", width: "100%", height: 200 }}>
          <canvas ref={canvasRef} id={id} />
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {labels.map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: colors[i], flexShrink: 0, display: "inline-block" }} />
                <span style={{ color: "#555", fontWeight: 500 }}>{label}</span>
              </div>
              <span style={{ fontWeight: 700, color: "#111" }}>{vals[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [period, setPeriod] = useState<Period>("day");
  const d = PERIOD_DATA[period];

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: 0 }}>Thống kê tổng quan</h1>
          <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{d.label}</p>
        </div>
        <button style={{
          background: "#C0121C",
          color: "#fff",
          border: "none",
          padding: "9px 16px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "inherit",
        }}>
          + Thêm sản phẩm
        </button>
      </div>

      {/* Period Filter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Lọc theo thời gian:</span>
        <div style={{
          display: "flex",
          gap: 3,
          background: "#e8e8e8",
          borderRadius: 8,
          padding: 3,
        }}>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: period === p.key ? 700 : 500,
                cursor: "pointer",
                border: period === p.key ? "1px solid #ddd" : "none",
                background: period === p.key ? "#fff" : "transparent",
                color: period === p.key ? "#C0121C" : "#555",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <StatCard
          label="Doanh thu"
          value={d.stats.revenue}
          change={d.chg.revenue}
          isUp={d.chgUp.revenue}
          iconBg="#FCEBEB"
          iconColor="#C0121C"
          icon="📈"
        />
        <StatCard
          label="Đơn hàng"
          value={d.stats.orders}
          change={d.chg.orders}
          isUp={d.chgUp.orders}
          iconBg="#E6F1FB"
          iconColor="#185FA5"
          icon="🛒"
        />
        <StatCard
          label="Người dùng"
          value={d.stats.users}
          change={d.chg.users}
          isUp={d.chgUp.users}
          iconBg="#EAF3DE"
          iconColor="#2d6a0a"
          icon="👥"
        />
        <StatCard
          label="Hủy đơn"
          value={d.stats.cancel}
          change={d.chg.cancel}
          isUp={d.chgUp.cancel}
          iconBg="#FAEEDA"
          iconColor="#7a4a00"
          icon="⚠️"
        />
      </div>

      {/* Charts */}
      <div style={{ display: "flex", gap: 16 }}>
        <DoughnutChart
          id="chart-revenue"
          title="Doanh thu theo danh mục"
          subtitle={d.label}
          labels={LABELS1}
          data={d.chart1.data}
          colors={COLORS1}
          vals={d.chart1.vals}
        />
        <DoughnutChart
          id="chart-orders"
          title="Trạng thái đơn hàng"
          subtitle={d.label}
          labels={LABELS2}
          data={d.chart2.data}
          colors={COLORS2}
          vals={d.chart2.vals}
        />
      </div>
    </div>
  );
}