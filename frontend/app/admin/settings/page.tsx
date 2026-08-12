"use client";

import { useState, useEffect } from "react";
import {
  Settings, Globe, Phone, Mail, MapPin, FileText,
  Image, Save, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface SiteSettings {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  phone: string;
  email: string;
  address: string;
  description: string;
}

const EMPTY: SiteSettings = {
  siteName: "", logoUrl: "", faviconUrl: "",
  phone: "", email: "", address: "", description: "",
};

function Field({
  label, icon: Icon, name, value, onChange, placeholder, type = "text", rows,
}: {
  label: string;
  icon: React.ElementType;
  name: keyof SiteSettings;
  value: string;
  onChange: (name: keyof SiteSettings, val: string) => void;
  placeholder?: string;
  type?: string;
  rows?: number;
}) {
  const base =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[13.5px] text-gray-900 outline-none transition-all focus:border-[#D32F2F] focus:bg-white focus:ring-2 focus:ring-red-100 placeholder:text-gray-400";

  return (
    <div>
      <label className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        <Icon size={13} className="text-[#D32F2F]" />
        {label}
      </label>
      {rows ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </div>
  );
}

function PreviewCard({ label, url, fallback }: { label: string; url: string; fallback: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <span className="text-[10px] text-gray-400 text-center px-1">{fallback}</span>
        )}
      </div>
      <span className="text-[11px] text-gray-500">{label}</span>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [form, setForm]       = useState<SiteSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [status, setStatus]   = useState<"idle" | "success" | "error">("idle");
  const [errMsg, setErrMsg]   = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setForm({ ...EMPTY, ...j.data }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (name: keyof SiteSettings, val: string) => {
    setForm((prev) => ({ ...prev, [name]: val }));
    setStatus("idle");
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus("idle");
    try {
      const token = localStorage.getItem("smarthub_token");
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setErrMsg(json.message || "Lỗi lưu cài đặt");
        setStatus("error");
      }
    } catch {
      setErrMsg("Không thể kết nối server");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-[#D32F2F]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF5F5] flex items-center justify-center">
            <Settings size={20} className="text-[#D32F2F]" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-gray-900 leading-tight">Cài đặt website</h1>
            <p className="text-[12.5px] text-gray-400 mt-0.5">Thông tin hiển thị trên toàn website</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Lưu cài đặt
        </button>
      </div>

      {/* Status banner */}
      {status === "success" && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-[13px] font-medium px-4 py-3 rounded-xl mb-5">
          <CheckCircle2 size={16} /> Lưu cài đặt thành công!
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium px-4 py-3 rounded-xl mb-5">
          <AlertCircle size={16} /> {errMsg}
        </div>
      )}

      <div className="space-y-5">

        {/* ── Thông tin cơ bản ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <h2 className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Thông tin cơ bản</h2>
          </div>
          <div className="p-5 grid gap-4">
            <Field
              label="Tên website"
              icon={Globe}
              name="siteName"
              value={form.siteName}
              onChange={handleChange}
              placeholder="SmartHub"
            />
            <Field
              label="Mô tả website"
              icon={FileText}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Mô tả ngắn về website, hiển thị trên Google..."
              rows={3}
            />
          </div>
        </section>

        {/* ── Logo & Favicon ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <h2 className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Logo & Favicon</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex gap-6 items-start">
              <div className="flex gap-4 shrink-0">
                <PreviewCard label="Logo" url={form.logoUrl} fallback="Chưa có" />
                <PreviewCard label="Favicon" url={form.faviconUrl} fallback="Chưa có" />
              </div>
              <div className="flex-1 space-y-4">
                <Field
                  label="URL Logo"
                  icon={Image}
                  name="logoUrl"
                  value={form.logoUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                />
                <Field
                  label="URL Favicon"
                  icon={Image}
                  name="faviconUrl"
                  value={form.faviconUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
            </div>
            <p className="text-[11.5px] text-gray-400 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              💡 Upload ảnh lên <strong>Cloudinary</strong> hoặc bất kỳ host ảnh nào, sau đó dán URL vào đây.
            </p>
          </div>
        </section>

        {/* ── Liên hệ ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <h2 className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Thông tin liên hệ</h2>
          </div>
          <div className="p-5 grid gap-4">
            <Field
              label="Số điện thoại"
              icon={Phone}
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="1800 9999"
              type="tel"
            />
            <Field
              label="Email"
              icon={Mail}
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="support@smarthub.vn"
              type="email"
            />
            <Field
              label="Địa chỉ cửa hàng"
              icon={MapPin}
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="543 Nguyễn Trãi, Thanh Liệt, Hà Nội"
              rows={2}
            />
          </div>
        </section>

      </div>

      {/* Sticky save footer */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-gray-100 mt-6 -mx-6 px-6 py-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[13px] font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </div>
    </div>
  );
}
