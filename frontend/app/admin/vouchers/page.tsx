"use client";

import { useState, useEffect } from "react";
import {
  Gift,
  Plus,
  Pencil,
  Trash2,
  Power,
  X,
  Loader2,
  Percent,
  Banknote,
  Truck,
  Users,
  RotateCcw,
  Search,
  Ban,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type VoucherType = "percent" | "fixed" | "freeship" | "none";

interface Voucher {
  _id: string;
  code: string;
  label: string;
  type: VoucherType;
  value: number;
  minOrderValue: number;
  maxDiscount: number | null;
  weight: number;
  expiredAt: string | null;
  isActive: boolean;
  daTrung: number;
  daDung: number;
  tiLeTrung: number;
}

interface Awarded {
  _id: string;
  code: string;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
  khachHang: { hoTen: string; soDienThoai: string; email: string } | null;
  phanThuong: { label: string; type: VoucherType; value: number } | null;
}

interface FormState {
  code: string;
  label: string;
  type: VoucherType;
  value: string;
  minOrderValue: string;
  maxDiscount: string;
  weight: string;
  expiredAt: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  code: "",
  label: "",
  type: "percent",
  value: "",
  minOrderValue: "0",
  maxDiscount: "",
  weight: "1",
  expiredAt: "",
  isActive: true,
};

const TYPE_META: Record<
  VoucherType,
  { label: string; Icon: typeof Percent; color: string; bg: string }
> = {
  percent: {
    label: "Giảm theo %",
    Icon: Percent,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  fixed: {
    label: "Giảm số tiền",
    Icon: Banknote,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  freeship: {
    label: "Miễn phí ship",
    Icon: Truck,
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
  none: {
    label: "Không trúng",
    Icon: Ban,
    color: "text-gray-500",
    bg: "bg-gray-100",
  },
};

function formatPrice(n: number) {
  return (n || 0).toLocaleString("vi-VN") + "₫";
}

function formatDate(s: string | null) {
  if (!s) return "Không giới hạn";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
}

function formatDateTime(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function moTaPhanThuong(v: {
  type: VoucherType;
  value: number;
  maxDiscount?: number | null;
}) {
  if (v.type === "none") return "Chúc may mắn lần sau";
  if (v.type === "freeship") return "Miễn phí giao hàng";
  if (v.type === "percent")
    return `Giảm ${v.value}%${
      v.maxDiscount ? ` (tối đa ${formatPrice(v.maxDiscount)})` : ""
    }`;
  return `Giảm ${formatPrice(v.value)}`;
}

export default function AdminVoucherPage() {
  const [tab, setTab] = useState<"prizes" | "awarded">("prizes");

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [awarded, setAwarded] = useState<Awarded[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [awardedSearch, setAwardedSearch] = useState("");
  const [awardedStatus, setAwardedStatus] = useState<"" | "used" | "unused">(
    "",
  );

  const getToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("token") || localStorage.getItem("smarthub_token")
      : null;

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  // ── Tải dữ liệu ──────────────────────────────────────────────────────────
  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/vouchers`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setVouchers(data.success ? data.data : []);
    } catch {
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAwarded = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (awardedSearch.trim()) params.set("search", awardedSearch.trim());
      if (awardedStatus) params.set("status", awardedStatus);

      const res = await fetch(
        `${API_URL}/api/admin/vouchers/awarded?${params.toString()}`,
        { headers: authHeaders() },
      );
      const data = await res.json();
      setAwarded(data.success ? data.data : []);
    } catch {
      setAwarded([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "prizes") fetchVouchers();
    else fetchAwarded();
  }, [tab]);

  useEffect(() => {
    if (tab !== "awarded") return;
    const t = setTimeout(fetchAwarded, 400);
    return () => clearTimeout(t);
  }, [awardedSearch, awardedStatus]);

  // ── Thao tác với ô phần thưởng ───────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (v: Voucher) => {
    setForm({
      code: v.code,
      label: v.label,
      type: v.type,
      value: String(v.value ?? ""),
      minOrderValue: String(v.minOrderValue ?? 0),
      maxDiscount: v.maxDiscount ? String(v.maxDiscount) : "",
      weight: String(v.weight ?? 1),
      expiredAt: v.expiredAt ? v.expiredAt.slice(0, 10) : "",
      isActive: v.isActive,
    });
    setEditingId(v._id);
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch(
        editingId
          ? `${API_URL}/api/admin/vouchers/${editingId}`
          : `${API_URL}/api/admin/vouchers`,
        {
          method: editingId ? "PUT" : "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            ...form,
            value: form.type === "freeship" ? 0 : Number(form.value),
            minOrderValue: Number(form.minOrderValue) || 0,
            maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
            weight: Number(form.weight) || 1,
            expiredAt: form.expiredAt || null,
          }),
        },
      );
      const data = await res.json();
      if (!data.success) {
        setFormError(data.message || "Lưu không thành công");
        return;
      }
      setShowForm(false);
      fetchVouchers();
    } catch {
      setFormError("Không kết nối được máy chủ");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    await fetch(`${API_URL}/api/admin/vouchers/${id}/toggle`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    fetchVouchers();
  };

  const handleDelete = async (v: Voucher) => {
    if (!confirm(`Xoá ô phần thưởng "${v.label}"?`)) return;
    const res = await fetch(`${API_URL}/api/admin/vouchers/${v._id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!data.success) alert(data.message);
    fetchVouchers();
  };

  const handleResetSpin = async (a: Awarded) => {
    if (!confirm(`Thu hồi mã ${a.code} để khách quay lại?`)) return;
    const res = await fetch(`${API_URL}/api/admin/vouchers/awarded/${a._id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!data.success) alert(data.message);
    fetchAwarded();
  };

  const tongDaPhat = vouchers.reduce((s, v) => s + v.daTrung, 0);
  const soODangBat = vouchers.filter((v) => v.isActive).length;

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans">
      {/* Tiêu đề */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center gap-2">
            <Gift className="text-red-600" /> Vòng quay may mắn
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Trang chủ / Vòng quay may mắn
          </p>
        </div>
        {tab === "prizes" && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shrink-0 border-none cursor-pointer"
          >
            <Plus size={16} /> Thêm ô phần thưởng
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 pb-3 mb-6">
        <button
          onClick={() => setTab("prizes")}
          className={`px-4 py-2 text-sm rounded-xl cursor-pointer font-medium transition-all border-none ${
            tab === "prizes"
              ? "bg-red-50 text-red-600 font-semibold"
              : "text-gray-600 hover:bg-gray-50 bg-transparent"
          }`}
        >
          Ô phần thưởng ({vouchers.length})
        </button>
        <button
          onClick={() => setTab("awarded")}
          className={`px-4 py-2 text-sm rounded-xl cursor-pointer font-medium transition-all border-none ${
            tab === "awarded"
              ? "bg-red-50 text-red-600 font-semibold"
              : "text-gray-600 hover:bg-gray-50 bg-transparent"
          }`}
        >
          Khách đã trúng
        </button>
      </div>

      {/* Thống kê nhanh */}
      {tab === "prizes" && !loading && vouchers.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500">Ô đang bật</p>
            <p className="text-xl font-bold text-black mt-0.5">
              {soODangBat}
              <span className="text-sm font-normal text-gray-500">
                /{vouchers.length}
              </span>
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500">Lượt đã quay</p>
            <p className="text-xl font-bold text-black mt-0.5">{tongDaPhat}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500">Mã đã dùng</p>
            <p className="text-xl font-bold text-black mt-0.5">
              {vouchers.reduce((s, v) => s + v.daDung, 0)}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-500 animate-pulse">
          Đang tải dữ liệu...
        </div>
      ) : tab === "prizes" ? (
        /* ── Danh sách ô phần thưởng ── */
        <div className="space-y-3">
          {vouchers.map((v) => {
            const meta = TYPE_META[v.type];
            const hetHan = v.expiredAt && new Date(v.expiredAt) < new Date();
            return (
              <div
                key={v._id}
                className={`bg-white border rounded-2xl p-5 transition ${
                  v.isActive ? "border-gray-200" : "border-gray-100 opacity-60"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center shrink-0`}
                  >
                    <meta.Icon size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-black m-0">
                        {v.label}
                      </h3>
                      <span className="text-xs font-mono font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        {v.code}
                      </span>
                      {!v.isActive && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          Đang tắt
                        </span>
                      )}
                      {hetHan && (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          Hết hạn
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-black mt-1">
                      {moTaPhanThuong(v)}
                      {v.minOrderValue > 0 && (
                        <span className="text-gray-600">
                          {" "}
                          · đơn từ {formatPrice(v.minOrderValue)}
                        </span>
                      )}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 flex-wrap">
                      <span>
                        Tỉ lệ trúng <b className="text-black">{v.tiLeTrung}%</b>{" "}
                        <span className="text-gray-400">
                          (trọng số {v.weight})
                        </span>
                      </span>
                      <span>
                        Đã trúng <b className="text-black">{v.daTrung}</b>
                      </span>
                      <span>
                        Đã dùng <b className="text-black">{v.daDung}</b>
                      </span>
                      <span>HSD {formatDate(v.expiredAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggle(v._id)}
                      title={v.isActive ? "Tắt ô này" : "Bật ô này"}
                      className={`p-2 rounded-lg border-none bg-transparent cursor-pointer transition ${
                        v.isActive
                          ? "text-emerald-600 hover:bg-emerald-50"
                          : "text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      <Power size={16} />
                    </button>
                    <button
                      onClick={() => openEdit(v)}
                      title="Sửa"
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border-none bg-transparent cursor-pointer transition"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(v)}
                      title="Xoá"
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg border-none bg-transparent cursor-pointer transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {vouchers.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Gift className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-sm text-black font-medium">
                Vòng quay chưa có ô phần thưởng nào
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Thêm ít nhất một ô để khách có thể quay.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ── Lịch sử khách trúng ── */
        <div>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={awardedSearch}
                onChange={(e) => setAwardedSearch(e.target.value)}
                placeholder="Tìm theo mã voucher"
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-500"
              />
            </div>
            <select
              value={awardedStatus}
              onChange={(e) => setAwardedStatus(e.target.value as any)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
            >
              <option value="">Tất cả</option>
              <option value="unused">Chưa dùng</option>
              <option value="used">Đã dùng</option>
            </select>
          </div>

          <div className="space-y-3">
            {awarded.map((a) => (
              <div
                key={a._id}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-rose-50 text-red-600 font-bold flex items-center justify-center text-sm shrink-0">
                  {a.khachHang?.hoTen?.charAt(0).toUpperCase() || "K"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-black m-0">
                      {a.khachHang?.hoTen || "Khách đã xoá tài khoản"}
                    </h3>
                    <span className="text-xs font-mono font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      {a.code}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        a.isUsed
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {a.isUsed ? "Đã dùng" : "Chưa dùng"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-0.5">
                    {a.khachHang?.soDienThoai || a.khachHang?.email || "—"}
                  </p>

                  <p className="text-sm text-black mt-1">
                    {a.phanThuong
                      ? `${a.phanThuong.label} · ${moTaPhanThuong(a.phanThuong)}`
                      : "Phần thưởng đã bị xoá"}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Quay lúc {formatDateTime(a.createdAt)}
                    {a.isUsed && ` · Dùng lúc ${formatDateTime(a.usedAt)}`}
                  </p>
                </div>

                {!a.isUsed && (
                  <button
                    onClick={() => handleResetSpin(a)}
                    title="Thu hồi để khách quay lại"
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg border-none bg-transparent cursor-pointer shrink-0 transition"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
            ))}

            {awarded.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Users className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-sm text-black font-medium">
                  Chưa có khách nào trúng mã
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Form thêm/sửa ── */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-base font-bold text-black m-0">
                {editingId ? "Sửa ô phần thưởng" : "Thêm ô phần thưởng"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 text-gray-400 hover:text-black border-none bg-transparent cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">
                    Mã voucher
                  </label>
                  <input
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="SPIN50K"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono text-black focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400 placeholder:font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">
                    Nhãn trên vòng quay
                  </label>
                  <input
                    value={form.label}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, label: e.target.value }))
                    }
                    placeholder="Giảm 50K"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">
                  Loại phần thưởng
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TYPE_META) as VoucherType[]).map((t) => {
                    const meta = TYPE_META[t];
                    const active = form.type === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setForm((f) => ({ ...f, type: t }))}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium cursor-pointer transition border ${
                          active
                            ? "border-red-400 bg-red-50 text-red-600"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <meta.Icon size={16} />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.type !== "freeship" && form.type !== "none" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5">
                      {form.type === "percent"
                        ? "Phần trăm giảm (%)"
                        : "Số tiền giảm (đ)"}
                    </label>
                    <input
                      type="number"
                      value={form.value}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, value: e.target.value }))
                      }
                      placeholder={form.type === "percent" ? "10" : "50000"}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400"
                    />
                  </div>
                  {form.type === "percent" && (
                    <div>
                      <label className="block text-xs font-semibold text-black mb-1.5">
                        Giảm tối đa (đ)
                      </label>
                      <input
                        type="number"
                        value={form.maxDiscount}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            maxDiscount: e.target.value,
                          }))
                        }
                        placeholder="Bỏ trống nếu không giới hạn"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">
                    Đơn tối thiểu (đ)
                  </label>
                  <input
                    type="number"
                    value={form.minOrderValue}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, minOrderValue: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">
                    Trọng số trúng
                  </label>
                  <input
                    type="number"
                    value={form.weight}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, weight: e.target.value }))
                    }
                    placeholder="1"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Số càng lớn càng dễ trúng
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">
                  Hạn sử dụng
                </label>
                <input
                  type="date"
                  value={form.expiredAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, expiredAt: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Bỏ trống nếu mã không hết hạn
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="w-4 h-4 accent-red-600 cursor-pointer"
                />
                <span className="text-sm text-black">
                  Bật ô này trên vòng quay
                </span>
              </label>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2.5 m-0">
                  {formError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 border-none rounded-xl cursor-pointer font-medium"
              >
                Huỷ
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-700 border-none rounded-xl cursor-pointer font-semibold disabled:bg-gray-300 flex items-center gap-1.5"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editingId ? "Lưu thay đổi" : "Thêm ô phần thưởng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
