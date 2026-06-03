"use client";

import { useState, useEffect, useRef } from "react";
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from "chart.js";

Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

// ── Types ──────────────────────────────────────────────────────────────────
type Period = "day" | "week" | "month" | "year";

interface PeriodData {
  label: string;
  stats: { revenue: string; orders: string; users: string; cancel: string };
  chg:   { revenue: string; orders: string; users: string; cancel: string };
  chgUp: { revenue: boolean; orders: boolean; users: boolean; cancel: boolean };
  chart1: { data: number[]; vals: string[] };
  chart2: { data: number[]; vals: string[] };
}

// ── Data ───────────────────────────────────────────────────────────────────
const PERIOD_DATA: Record<Period, PeriodData> = {
  day: {
    label: "Hôm nay — 27/05/2026",
    stats: { revenue: "12.4M", orders: "183", users: "94",    cancel: "7"   },
    chg:   { revenue: "+8.2%", orders: "+5.4%", users: "+3.1%", cancel: "-1.2%" },
    chgUp: { revenue: true, orders: true, users: true, cancel: false },
    chart1: { data: [48, 27, 16, 9],  vals: ["5.9M₫", "3.4M₫", "2.0M₫", "1.1M₫"] },
    chart2: { data: [55, 24, 14, 7],  vals: ["101", "44", "26", "12"] },
  },
  week: {
    label: "Tuần này — 21/05 – 27/05/2026",
    stats: { revenue: "68.7M", orders: "921", users: "412",   cancel: "34"  },
    chg:   { revenue: "+11.3%", orders: "+7.8%", users: "+4.5%", cancel: "-2.1%" },
    chgUp: { revenue: true, orders: true, users: true, cancel: false },
    chart1: { data: [44, 29, 18, 9],  vals: ["30.2M₫", "19.9M₫", "12.4M₫", "6.2M₫"] },
    chart2: { data: [58, 22, 13, 7],  vals: ["534", "203", "120", "64"] },
  },
  month: {
    label: "Tháng 5/2026",
    stats: { revenue: "284M", orders: "3.841", users: "1.623", cancel: "127" },
    chg:   { revenue: "+14.6%", orders: "+9.2%", users: "+6.3%", cancel: "-3.4%" },
    chgUp: { revenue: true, orders: true, users: true, cancel: false },
    chart1: { data: [45, 28, 17, 10], vals: ["127.8M₫", "79.5M₫", "48.3M₫", "28.4M₫"] },
    chart2: { data: [60, 21, 12, 7],  vals: ["2.305", "807", "461", "268"] },
  },
  year: {
    label: "Năm 2026 (đến nay)",
    stats: { revenue: "1.42T", orders: "19.284", users: "5.631", cancel: "614" },
    chg:   { revenue: "+22.1%", orders: "+18.4%", users: "+15.7%", cancel: "-5.2%" },
    chgUp: { revenue: true, orders: true, users: true, cancel: false },
    chart1: { data: [43, 30, 17, 10], vals: ["610M₫", "426M₫", "241M₫", "143M₫"] },
    chart2: { data: [61, 20, 12, 7],  vals: ["11.763", "3.857", "2.314", "1.350"] },
  },
};

const COLORS1 = ["#D32F2F", "#378ADD", "#1D9E75", "#BA7517"];
const COLORS2 = ["#3B6D11", "#185FA5", "#854F0B", "#A32D2D"];
const LABELS1 = ["Điện thoại", "Laptop", "Phụ kiện", "Tivi"];
const LABELS2 = ["Hoàn thành", "Đang giao", "Chờ xử lý", "Đã hủy"];

const PERIODS: { key: Period; label: string }[] = [
  { key: "day",   label: "Ngày"  },
  { key: "week",  label: "Tuần"  },
  { key: "month", label: "Tháng" },
  { key: "year",  label: "Năm"   },
];

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  label, value, change, isUp, iconBg, iconColor, icon,
}: {
  label: string; value: string; change: string;
  isUp: boolean; iconBg: string; iconColor: string; icon: string;
}) {
  return (
    <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-4 py-4">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[12.5px] text-gray-500 font-medium">{label}</span>
        <div
          className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-base"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
      <div className="text-[26px] font-bold text-gray-900 leading-none tracking-tight">
        {value}
      </div>
      <div className={`text-[11.5px] mt-1.5 flex items-center gap-1 ${isUp ? "text-green-700" : "text-red-700"}`}>
        <span>{isUp ? "▲" : "▼"}</span>
        <span>{change} so với kỳ trước</span>
      </div>
    </div>
  );
}

// ── Quick Strip ────────────────────────────────────────────────────────────
function QuickStrip() {
  const items = [
    { label: "Sản phẩm đang bán", value: "48",  icon: "📦", bg: "#FFF5F5", color: "#D32F2F" },
    { label: "Đơn chờ xử lý",     value: "26",  icon: "⏳", bg: "#FFFBEB", color: "#D97706" },
    { label: "Hết hàng",          value: "2",   icon: "⚠️",  bg: "#FEF2F2", color: "#B91C1C" },
    { label: "Khách mới hôm nay", value: "12",  icon: "👤", bg: "#F0FDF4", color: "#15803D" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {items.map((it) => (
        <div key={it.label} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[9px] flex items-center justify-center text-lg shrink-0"
            style={{ background: it.bg, color: it.color }}
          >
            {it.icon}
          </div>
          <div>
            <div className="text-[22px] font-bold text-gray-900 leading-none">{it.value}</div>
            <div className="text-[11.5px] text-gray-500 mt-1">{it.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Doughnut Chart ─────────────────────────────────────────────────────────
function DoughnutChart({
  id, labels, data, colors, vals, title, subtitle,
}: {
  id: string; labels: string[]; data: number[];
  colors: string[]; vals: string[]; title: string; subtitle: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 3,
          borderColor: "#fff",
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "64%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%` },
          },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [data, labels, colors]);

  return (
    <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <div>
          <div className="text-[14px] font-semibold text-gray-900">{title}</div>
          <div className="text-[11.5px] text-gray-400 mt-0.5">{subtitle}</div>
        </div>
        <div className="w-2 h-2 rounded-full bg-[#D32F2F] shrink-0" />
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        <div className="relative w-full h-[190px]">
          <canvas ref={canvasRef} id={id} />
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 mt-4">
          {labels.map((label, i) => (
            <div key={label} className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-[3px] shrink-0 inline-block"
                  style={{ background: colors[i] }}
                />
                <span className="text-gray-500 font-medium">{label}</span>
              </div>
              <span className="font-bold text-gray-900">{vals[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>("day");
  const d = PERIOD_DATA[period];

  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 m-0">Thống kê tổng quan</h1>
          <p className="text-[12.5px] text-gray-500 mt-1 mb-0">
            Trang chủ / <span className="text-gray-900">Dashboard</span>
          </p>
        </div>

        {/* Period filter */}
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-gray-500 font-medium whitespace-nowrap">
            Lọc theo thời gian:
          </span>
          <div className="flex gap-0.5 bg-gray-100 rounded-[9px] p-[3px]">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`
                  px-4 py-1.5 rounded-[7px] text-[13px] cursor-pointer border-none transition-all duration-150 whitespace-nowrap font-sans
                  ${period === p.key
                    ? "bg-white text-[#D32F2F] font-semibold border border-gray-200 shadow-sm"
                    : "bg-transparent text-gray-500 font-normal hover:text-gray-800"}
                `}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="flex gap-3 mb-4">
        <StatCard
          label="Doanh thu"  value={d.stats.revenue}
          change={d.chg.revenue} isUp={d.chgUp.revenue}
          iconBg="#FFF5F5" iconColor="#D32F2F" icon="📈"
        />
        <StatCard
          label="Đơn hàng"  value={d.stats.orders}
          change={d.chg.orders}  isUp={d.chgUp.orders}
          iconBg="#EFF6FF" iconColor="#1D4ED8" icon="🛒"
        />
        <StatCard
          label="Người dùng" value={d.stats.users}
          change={d.chg.users}   isUp={d.chgUp.users}
          iconBg="#F0FDF4" iconColor="#15803D" icon="👥"
        />
        <StatCard
          label="Hủy đơn"   value={d.stats.cancel}
          change={d.chg.cancel}  isUp={d.chgUp.cancel}
          iconBg="#FFFBEB" iconColor="#D97706" icon="⚠️"
        />
      </div>

      {/* ── Quick strip ── */}
      <QuickStrip />

      {/* ── Charts ── */}
      <div className="flex gap-4">
        <DoughnutChart
          id="chart-revenue"
          title="Doanh thu theo danh mục"
          subtitle={d.label}
          labels={LABELS1} data={d.chart1.data}
          colors={COLORS1} vals={d.chart1.vals}
        />
        <DoughnutChart
          id="chart-orders"
          title="Trạng thái đơn hàng"
          subtitle={d.label}
          labels={LABELS2} data={d.chart2.data}
          colors={COLORS2} vals={d.chart2.vals}
        />
      </div>
    </div>
  );
}