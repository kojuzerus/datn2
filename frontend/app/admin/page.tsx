"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Chart,
  Tooltip,
  Legend,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  AlertCircle,
  Package,
  Clock,
  AlertTriangle,
  UserPlus,
  ArrowRight,
  CheckCircle,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

Chart.register(
  Tooltip, Legend,
  BarController, BarElement, CategoryScale, LinearScale,
);

// ── Types ──────────────────────────────────────────────────────────────────
type Period = "day" | "week" | "month" | "year";

interface PeriodData {
  label: string;
  stats: { revenue: string; orders: string; users: string; cancel: string };
  chg:   { revenue: string; orders: string; users: string; cancel: string };
  chgUp: { revenue: boolean; orders: boolean; users: boolean; cancel: boolean };
  chart1: { data: number[]; vals: string[] };
  chart2: { data: number[]; vals: string[] };
  bar:   { labels: string[]; data: number[] };
}

// ── Data ───────────────────────────────────────────────────────────────────
const PERIOD_DATA: Record<Period, PeriodData> = {
  day: {
    label: "Hôm nay, 04/06/2026",
    stats: { revenue: "12.4M", orders: "183", users: "94", cancel: "7" },
    chg:   { revenue: "+8.2%", orders: "+5.4%", users: "+3.1%", cancel: "-1.2%" },
    chgUp: { revenue: true, orders: true, users: true, cancel: false },
    chart1: { data: [48, 27, 16, 9],  vals: ["5.9M₫", "3.4M₫", "2.0M₫", "1.1M₫"] },
    chart2: { data: [55, 24, 14, 7],  vals: ["101", "44", "26", "12"] },
    bar: {
      labels: ["7h", "9h", "11h", "13h", "15h", "17h", "19h"],
      data:   [0.8,  1.4,  2.1,  1.9,  2.4,  2.2,  1.6],
    },
  },
  week: {
    label: "Tuần này, 28/05 - 03/06/2026",
    stats: { revenue: "68.7M", orders: "921", users: "412", cancel: "34" },
    chg:   { revenue: "+11.3%", orders: "+7.8%", users: "+4.5%", cancel: "-2.1%" },
    chgUp: { revenue: true, orders: true, users: true, cancel: false },
    chart1: { data: [44, 29, 18, 9],  vals: ["30.2M₫", "19.9M₫", "12.4M₫", "6.2M₫"] },
    chart2: { data: [58, 22, 13, 7],  vals: ["534", "203", "120", "64"] },
    bar: {
      labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
      data:   [8.4, 10.2, 9.8, 12.4, 11.6, 9.7, 6.6],
    },
  },
  month: {
    label: "Tháng 5/2026",
    stats: { revenue: "284M", orders: "3.841", users: "1.623", cancel: "127" },
    chg:   { revenue: "+14.6%", orders: "+9.2%", users: "+6.3%", cancel: "-3.4%" },
    chgUp: { revenue: true, orders: true, users: true, cancel: false },
    chart1: { data: [45, 28, 17, 10], vals: ["127.8M₫", "79.5M₫", "48.3M₫", "28.4M₫"] },
    chart2: { data: [60, 21, 12, 7],  vals: ["2.305", "807", "461", "268"] },
    bar: {
      labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"],
      data:   [62.4,    74.1,    81.3,    66.2],
    },
  },
  year: {
    label: "Năm 2026 (đến nay)",
    stats: { revenue: "1.42T", orders: "19.284", users: "5.631", cancel: "614" },
    chg:   { revenue: "+22.1%", orders: "+18.4%", users: "+15.7%", cancel: "-5.2%" },
    chgUp: { revenue: true, orders: true, users: true, cancel: false },
    chart1: { data: [43, 30, 17, 10], vals: ["610M₫", "426M₫", "241M₫", "143M₫"] },
    chart2: { data: [61, 20, 12, 7],  vals: ["11.763", "3.857", "2.314", "1.350"] },
    bar: {
      labels: ["T1",  "T2",  "T3",  "T4",  "T5",  "T6"],
      data:   [88,    102,   124,   108,   136,   130],
    },
  },
};

const COLORS1 = ["#D32F2F", "#378ADD", "#1D9E75", "#BA7517"];
const LABELS1 = ["Điện thoại", "Laptop", "Phụ kiện", "Tivi"];

const PERIODS: { key: Period; label: string }[] = [
  { key: "day",   label: "Ngày"  },
  { key: "week",  label: "Tuần"  },
  { key: "month", label: "Tháng" },
  { key: "year",  label: "Năm"   },
];

type OrderStatusType = "done" | "ship" | "pending" | "cancel";

const STATUS_STYLE: Record<OrderStatusType, { bg: string; color: string; border: string; dot: string; label: string }> = {
  done:    { bg: "#F0FDF4", color: "#166534", border: "#BBF7D0", dot: "#15803D", label: "Hoàn thành" },
  ship:    { bg: "#EFF6FF", color: "#1E40AF", border: "#BFDBFE", dot: "#2563EB", label: "Đang giao"  },
  pending: { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A", dot: "#D97706", label: "Chờ xử lý"  },
  cancel:  { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA", dot: "#DC2626", label: "Đã hủy"     },
};

const RECENT_ORDERS: {
  id: string; customer: string; product: string;
  amount: string; statusType: OrderStatusType; time: string;
}[] = [
  { id: "#2851", customer: "Nguyễn Văn An",    product: "iPhone 16 Pro Max 256GB",   amount: "34.9M₫", statusType: "done",    time: "5 phút trước"  },
  { id: "#2850", customer: "Trần Thị Bích",    product: "MacBook Air M3 15\"",        amount: "28.5M₫", statusType: "ship",    time: "18 phút trước" },
  { id: "#2849", customer: "Lê Minh Đức",      product: "Samsung Galaxy S25 Ultra",   amount: "22.4M₫", statusType: "pending", time: "1 giờ trước"   },
  { id: "#2848", customer: "Phạm Thu Hà",      product: "AirPods Pro 2",              amount: "5.7M₫",  statusType: "done",    time: "2 giờ trước"   },
  { id: "#2847", customer: "Hoàng Văn Long",   product: "Apple Watch Series 10",      amount: "9.2M₫",  statusType: "cancel",  time: "3 giờ trước"   },
];

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  label, value, change, isUp, accentColor, iconBg, iconColor, Icon,
}: {
  label: string; value: string; change: string;
  isUp: boolean; accentColor: string;
  iconBg: string; iconColor: string; Icon: LucideIcon;
}) {
  return (
    <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-sm overflow-hidden">
      <div className="h-[3px] w-full" style={{ background: accentColor }} />
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12.5px] text-gray-500 font-medium tracking-tight">{label}</span>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: iconBg }}
          >
            <Icon size={17} style={{ color: iconColor }} strokeWidth={2} />
          </div>
        </div>
        <div className="text-[28px] font-bold text-gray-900 leading-none tracking-tight">
          {value}
        </div>
        <div className={`text-[11.5px] mt-2 flex items-center gap-1.5 font-medium ${isUp ? "text-emerald-700" : "text-red-600"}`}>
          {isUp
            ? <TrendingUp size={12} className="shrink-0" strokeWidth={2.5} />
            : <TrendingDown size={12} className="shrink-0" strokeWidth={2.5} />}
          <span>{change} so với kỳ trước</span>
        </div>
      </div>
    </div>
  );
}

// ── Quick Strip ────────────────────────────────────────────────────────────
function QuickStrip() {
  const items: { label: string; value: string; Icon: LucideIcon; bg: string; color: string; border: string }[] = [
    { label: "Sản phẩm đang bán", value: "48", Icon: Package,       bg: "#FFF5F5", color: "#D32F2F", border: "#FECACA" },
    { label: "Đơn chờ xử lý",     value: "26", Icon: Clock,         bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
    { label: "Hết hàng",          value: "2",  Icon: AlertTriangle, bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA" },
    { label: "Khách mới hôm nay", value: "12", Icon: UserPlus,      bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="bg-white rounded-sm px-4 py-3.5 flex items-center gap-3.5 border"
          style={{ borderColor: it.border }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: it.bg }}
          >
            <it.Icon size={18} style={{ color: it.color }} strokeWidth={2} />
          </div>
          <div>
            <div className="text-[23px] font-bold leading-none tracking-tight" style={{ color: it.color }}>
              {it.value}
            </div>
            <div className="text-[11.5px] text-gray-500 mt-1 leading-tight">{it.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Bar Trend Chart ────────────────────────────────────────────────────────
function BarTrendChart({
  id, labels, data, title, subtitle,
}: {
  id: string; labels: string[]; data: number[]; title: string; subtitle: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);
  const maxIdx    = data.indexOf(Math.max(...data));

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: data.map((_, i) =>
            i === maxIdx ? "#D32F2F" : "rgba(211,47,47,0.12)"
          ),
          hoverBackgroundColor: data.map((_, i) =>
            i === maxIdx ? "#B71C1C" : "rgba(211,47,47,0.25)"
          ),
          borderRadius: 7,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1F2937",
            padding: 10,
            cornerRadius: 8,
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            callbacks: { label: (ctx) => ` ${ctx.parsed.y} M₫` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { size: 11.5 }, color: "#9CA3AF" },
          },
          y: {
            grid: { color: "#F3F4F6" },
            border: { display: false },
            ticks: {
              font: { size: 11 },
              color: "#9CA3AF",
              callback: (v) => v + "M",
            },
          },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [data, labels, maxIdx]);

  return (
    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden" style={{ flex: "2 1 0" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <div className="text-[14px] font-semibold text-gray-900 tracking-tight">{title}</div>
          <div className="text-[11.5px] text-gray-400 mt-0.5">{subtitle}</div>
        </div>
        <div className="flex items-center gap-1.5 text-[11.5px] text-[#D32F2F] font-semibold bg-[#FFF5F5] px-2.5 py-1 rounded-full border border-[#FECACA]">
          <TrendingUp size={12} strokeWidth={2.5} />
          Xu hướng
        </div>
      </div>
      <div className="px-5 py-4">
        <div className="relative w-full h-[195px]">
          <canvas ref={canvasRef} id={id} />
        </div>
      </div>
    </div>
  );
}

// ── Category Horizontal Bar Chart ─────────────────────────────────────────
function CategoryBarChart({
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
      type: "bar",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          hoverBackgroundColor: colors.map((c) => c + "cc"),
          borderRadius: 5,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1F2937",
            padding: 10,
            cornerRadius: 8,
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            callbacks: {
              label: (ctx) => {
                const idx = ctx.dataIndex;
                return ` ${ctx.parsed.x}%  (${vals[idx]})`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: "#F3F4F6" },
            border: { display: false },
            ticks: {
              font: { size: 11 },
              color: "#9CA3AF",
              callback: (v) => v + "%",
            },
            max: 60,
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { size: 12.5 }, color: "#374151" },
          },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [data, labels, colors, vals]);

  return (
    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden" style={{ flex: "1 1 0" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <div className="text-[14px] font-semibold text-gray-900 tracking-tight">{title}</div>
          <div className="text-[11.5px] text-gray-400 mt-0.5">{subtitle}</div>
        </div>
        <div className="w-2 h-2 rounded-full bg-[#D32F2F]" />
      </div>
      <div className="px-4 pt-4 pb-3">
        <div className="relative w-full h-[148px]">
          <canvas ref={canvasRef} id={id} />
        </div>
        <div className="flex flex-col gap-2 mt-3 border-t border-gray-50 pt-3">
          {labels.map((label, i) => (
            <div key={label} className="flex items-center justify-between text-[12.5px]">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                  style={{ background: colors[i] }}
                />
                <span className="text-gray-500">{label}</span>
              </div>
              <span className="font-bold text-gray-900 tabular-nums">{vals[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Order Status Stat Tiles ────────────────────────────────────────────────
const ORDER_STATUS_TILES: {
  label: string; Icon: LucideIcon; color: string; bg: string; border: string;
}[] = [
  { label: "Hoàn thành", Icon: CheckCircle, color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0" },
  { label: "Đang giao",  Icon: Truck,       color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" },
  { label: "Chờ xử lý", Icon: Clock,       color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  { label: "Đã hủy",    Icon: XCircle,     color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
];

function OrderStatusCard({ vals, subtitle }: { vals: string[]; subtitle: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden" style={{ flex: "1 1 0" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <div className="text-[14px] font-semibold text-gray-900 tracking-tight">
            Trạng thái đơn hàng
          </div>
          <div className="text-[11.5px] text-gray-400 mt-0.5">{subtitle}</div>
        </div>
        <div className="w-2 h-2 rounded-full bg-[#D32F2F]" />
      </div>
      <div className="grid grid-cols-2 gap-3 p-4">
        {ORDER_STATUS_TILES.map(({ label, Icon, color, bg, border }, i) => (
          <div
            key={label}
            className="rounded-xl px-3.5 py-3 flex flex-col gap-1.5 border"
            style={{ background: bg, borderColor: border }}
          >
            <div className="flex items-center gap-1.5">
              <Icon size={13} style={{ color }} strokeWidth={2.5} />
              <span className="text-[11px] font-semibold" style={{ color }}>{label}</span>
            </div>
            <div
              className="text-[24px] font-bold leading-none tracking-tight tabular-nums"
              style={{ color }}
            >
              {vals[i]}
            </div>
            <div className="text-[10.5px] text-gray-400">đơn hàng</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Recent Orders ──────────────────────────────────────────────────────────
function RecentOrdersCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden" style={{ flex: "2 1 0" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <div className="text-[14px] font-semibold text-gray-900 tracking-tight">Đơn hàng gần đây</div>
          <div className="text-[11.5px] text-gray-400 mt-0.5">5 đơn hàng mới nhất</div>
        </div>
        <Link
          href="/admin/orders"
          className="flex items-center gap-1 text-[12px] text-[#D32F2F] font-semibold hover:underline no-underline"
        >
          Xem tất cả <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </div>
      <div className="divide-y divide-gray-50">
        {RECENT_ORDERS.map((order) => {
          const s = STATUS_STYLE[order.statusType];
          return (
            <div
              key={order.id}
              className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/60 transition-colors"
            >
              <div className="text-[12px] font-bold text-[#D32F2F] w-[52px] shrink-0 tabular-nums">
                {order.id}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-gray-900 truncate leading-tight">
                  {order.customer}
                </div>
                <div className="text-[11.5px] text-gray-400 truncate mt-0.5">{order.product}</div>
              </div>
              <div className="text-[13px] font-bold text-gray-900 tabular-nums shrink-0">
                {order.amount}
              </div>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11.5px] font-medium shrink-0"
                style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
                {s.label}
              </span>
              <div className="text-[11px] text-gray-400 shrink-0 w-[90px] text-right tabular-nums">
                {order.time}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>("day");
  const d = PERIOD_DATA[period];

  return (
    <div className="flex flex-col gap-4">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 m-0 tracking-tight">
            Thống kê tổng quan
          </h1>
          <p className="text-[12.5px] text-gray-400 mt-1 mb-0">
            Trang chủ /{" "}
            <span className="text-gray-700 font-medium">Dashboard</span>
          </p>
        </div>

        {/* Period filter */}
        <div className="flex items-center gap-3">
          <span className="text-[12.5px] text-gray-500 font-medium whitespace-nowrap">
            Lọc theo:
          </span>
          <div className="flex gap-0.5 bg-gray-100 rounded-xl p-[3px]">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`
                  px-4 py-1.5 rounded-[9px] text-[13px] cursor-pointer border-none transition-all
                  duration-150 whitespace-nowrap font-sans
                  ${period === p.key
                    ? "bg-white text-[#D32F2F] font-semibold shadow-sm"
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
      <div className="flex gap-3">
        <StatCard
          label="Doanh thu"   value={d.stats.revenue}
          change={d.chg.revenue} isUp={d.chgUp.revenue}
          accentColor="#D32F2F" iconBg="#FFF5F5" iconColor="#D32F2F" Icon={TrendingUp}
        />
        <StatCard
          label="Đơn hàng"   value={d.stats.orders}
          change={d.chg.orders}  isUp={d.chgUp.orders}
          accentColor="#2563EB" iconBg="#EFF6FF" iconColor="#1D4ED8" Icon={ShoppingCart}
        />
        <StatCard
          label="Người dùng" value={d.stats.users}
          change={d.chg.users}   isUp={d.chgUp.users}
          accentColor="#15803D" iconBg="#F0FDF4" iconColor="#15803D" Icon={Users}
        />
        <StatCard
          label="Hủy đơn"    value={d.stats.cancel}
          change={d.chg.cancel}  isUp={d.chgUp.cancel}
          accentColor="#D97706" iconBg="#FFFBEB" iconColor="#D97706" Icon={AlertCircle}
        />
      </div>

      {/* ── Quick strip ── */}
      <QuickStrip />

      {/* ── Bar chart + Category bar chart ── */}
      <div className="flex gap-4">
        <BarTrendChart
          id="chart-bar-trend"
          title="Xu hướng doanh thu"
          subtitle={d.label}
          labels={d.bar.labels}
          data={d.bar.data}
        />
        <CategoryBarChart
          id="chart-revenue"
          title="Doanh thu theo danh mục"
          subtitle={d.label}
          labels={LABELS1} data={d.chart1.data}
          colors={COLORS1} vals={d.chart1.vals}
        />
      </div>

      {/* ── Recent orders + Order status tiles ── */}
      <div className="flex gap-4">
        <RecentOrdersCard />
        <OrderStatusCard
          vals={d.chart2.vals}
          subtitle={d.label}
        />
      </div>
    </div>
  );
}
