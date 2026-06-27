"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

interface DashboardData {
  label: string;
  stats: { revenue: string; orders: string; users: string; cancel: string };
  chg:   { revenue: string; orders: string; users: string; cancel: string };
  chgUp: { revenue: boolean; orders: boolean; users: boolean; cancel: boolean };
  quickStrip: { productsActive: number; pendingOrders: number; outOfStock: number; newUsersToday: number };
  chart1: { labels: string[]; data: number[]; vals: string[]; colors: string[] };
  chart2: { vals: string[] };
  bar:   { labels: string[]; data: number[] };
}

interface RecentOrder {
  id: string; orderId: string; customer: string; product: string;
  amount: string; statusType: OrderStatusType; time: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
function QuickStrip({ data }: { data: DashboardData["quickStrip"] }) {
  const items: { label: string; value: string; Icon: LucideIcon; bg: string; color: string; border: string }[] = [
    { label: "Sản phẩm đang bán", value: String(data.productsActive), Icon: Package,       bg: "#FFF5F5", color: "#D32F2F", border: "#FECACA" },
    { label: "Đơn chờ xử lý",     value: String(data.pendingOrders),  Icon: Clock,         bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
    { label: "Hết hàng",          value: String(data.outOfStock),     Icon: AlertTriangle, bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA" },
    { label: "Khách mới hôm nay", value: String(data.newUsersToday),  Icon: UserPlus,      bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
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
function RecentOrdersCard({ orders }: { orders: RecentOrder[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden" style={{ flex: "2 1 0" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <div className="text-[14px] font-semibold text-gray-900 tracking-tight">Đơn hàng gần đây</div>
          <div className="text-[11.5px] text-gray-400 mt-0.5">{orders.length} đơn hàng mới nhất</div>
        </div>
        <Link
          href="/admin/orders"
          className="flex items-center gap-1 text-[12px] text-[#D32F2F] font-semibold hover:underline no-underline"
        >
          Xem tất cả <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="px-5 py-10 text-center text-[13px] text-gray-400">Chưa có đơn hàng nào</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {orders.map((order) => {
            const s = STATUS_STYLE[order.statusType];
            return (
              <Link
                key={order.orderId}
                href="/admin/orders"
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/60 transition-colors no-underline"
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [period, setPeriod]             = useState<Period>("day");
  const [data, setData]                 = useState<DashboardData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading]           = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/stats/dashboard?period=${period}`),
        fetch(`${API_BASE}/api/admin/stats/recent-orders?limit=5`),
      ]);
      const statsJson  = await statsRes.json();
      const ordersJson = await ordersRes.json();
      if (statsJson.success)  setData(statsJson.data);
      if (ordersJson.success) setRecentOrders(ordersJson.data);
    } catch (err) {
      console.error("[AdminDashboard] fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

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

      {!data || loading ? (
        <div className="flex items-center justify-center py-24 text-[13px] text-gray-400">
          Đang tải dữ liệu thống kê...
        </div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div className="flex gap-3">
            <StatCard
              label="Doanh thu"   value={data.stats.revenue}
              change={data.chg.revenue} isUp={data.chgUp.revenue}
              accentColor="#D32F2F" iconBg="#FFF5F5" iconColor="#D32F2F" Icon={TrendingUp}
            />
            <StatCard
              label="Đơn hàng"   value={data.stats.orders}
              change={data.chg.orders}  isUp={data.chgUp.orders}
              accentColor="#2563EB" iconBg="#EFF6FF" iconColor="#1D4ED8" Icon={ShoppingCart}
            />
            <StatCard
              label="Người dùng" value={data.stats.users}
              change={data.chg.users}   isUp={data.chgUp.users}
              accentColor="#15803D" iconBg="#F0FDF4" iconColor="#15803D" Icon={Users}
            />
            <StatCard
              label="Hủy đơn"    value={data.stats.cancel}
              change={data.chg.cancel}  isUp={data.chgUp.cancel}
              accentColor="#D97706" iconBg="#FFFBEB" iconColor="#D97706" Icon={AlertCircle}
            />
          </div>

          {/* ── Quick strip ── */}
          <QuickStrip data={data.quickStrip} />

          {/* ── Bar chart + Category bar chart ── */}
          <div className="flex gap-4">
            <BarTrendChart
              id="chart-bar-trend"
              title="Xu hướng doanh thu"
              subtitle={data.label}
              labels={data.bar.labels}
              data={data.bar.data}
            />
            <CategoryBarChart
              id="chart-revenue"
              title="Doanh thu theo danh mục"
              subtitle={data.label}
              labels={data.chart1.labels} data={data.chart1.data}
              colors={data.chart1.colors} vals={data.chart1.vals}
            />
          </div>

          {/* ── Recent orders + Order status tiles ── */}
          <div className="flex gap-4">
            <RecentOrdersCard orders={recentOrders} />
            <OrderStatusCard
              vals={data.chart2.vals}
              subtitle={data.label}
            />
          </div>
        </>
      )}
    </div>
  );
}
