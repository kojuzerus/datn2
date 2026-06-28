'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function Mascot() {
  return (
    <svg viewBox="0 0 80 80" width="100" height="100">
      <ellipse cx="40" cy="56" rx="21" ry="17" fill="#fff" stroke="#e53e3e" strokeWidth="2" />
      <ellipse cx="40" cy="35" rx="15" ry="14" fill="#fff" stroke="#e53e3e" strokeWidth="2" />
      <ellipse cx="30" cy="17" rx="5.5" ry="11" fill="#fff" stroke="#e53e3e" strokeWidth="2" />
      <ellipse cx="50" cy="17" rx="5.5" ry="11" fill="#fff" stroke="#e53e3e" strokeWidth="2" />
      <ellipse cx="30" cy="17" rx="3" ry="8" fill="#fca5a5" />
      <ellipse cx="50" cy="17" rx="3" ry="8" fill="#fca5a5" />
      <circle cx="35" cy="33" r="2.2" fill="#1a1a1a" />
      <circle cx="45" cy="33" r="2.2" fill="#1a1a1a" />
      <ellipse cx="40" cy="38.5" rx="2.5" ry="1.8" fill="#fca5a5" />
      <rect x="28" y="47" width="24" height="18" rx="5" fill="#e53e3e" />
      <text x="40" y="59" textAnchor="middle" fill="#fff" fontWeight="bold" fontSize="13" fontFamily="sans-serif">S</text>
    </svg>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={"relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors " + (checked ? 'bg-red-500' : 'bg-gray-200')}>
      <span className={"inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform " + (checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  );
}

export default function DangKyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    hoTen: '', ngaySinh: '', soDienThoai: '', email: '',
    matKhau: '', xacNhan: '',
    isStudent: false, isEnterprise: false, subscribeNews: false,
  });
  const [showPass, setShowPass]   = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showZaloNote, setShowZaloNote] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[0-9]{9,11}$/.test(form.soDienThoai.trim())) return setError('Số điện thoại phải là số, từ 9-11 chữ số');
    if (form.matKhau !== form.xacNhan) return setError('Mật khẩu xác nhận không khớp');
    if (form.matKhau.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoTen: form.hoTen, ngaySinh: form.ngaySinh || undefined,
          soDienThoai: form.soDienThoai, email: form.email || undefined,
          matKhau: form.matKhau,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Đăng ký thất bại');
      localStorage.setItem('smarthub_token', data.token);
      localStorage.setItem('smarthub_user', JSON.stringify(data.user));
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const eyeOpen = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
  const eyeOff  = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Đăng ký trở thành SMARTHUB</h1>
          <div className="flex justify-center mb-3"><Mascot /></div>
          <p className="text-sm text-gray-500 mb-3">Đăng ký bằng tài khoản mạng xã hội</p>

          <div className="flex gap-3 justify-center mb-2">
            {/* Google OAuth - hoạt động */}
            <a href={`${API_URL}/api/auth/google`}
              className="flex items-center gap-2 border border-gray-300 rounded-xl px-5 py-2.5 text-sm hover:bg-gray-50 transition">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </a>

            {/* Zalo - tooltip "Sắp ra mắt" */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowZaloNote(!showZaloNote)}
                className="flex items-center gap-2 border border-gray-200 rounded-xl px-5 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
              >
                <svg className="w-4 h-4" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="25" fill="#0068FF" opacity="0.4"/>
                  <text x="25" y="31" textAnchor="middle" fill="#fff" fontWeight="bold" fontSize="16" fontFamily="sans-serif">Z</text>
                </svg>
                Zalo
              </button>
              {showZaloNote && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-sm px-3 py-2 whitespace-nowrap z-10">
                  Tính năng sắp ra mắt 🚀
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"/>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">Hoặc điền thông tin sau</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-sm shadow-sm p-8 space-y-4">
          <h2 className="font-semibold text-gray-800">Thông tin cá nhân</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Họ và tên</label>
              <input name="hoTen" type="text" placeholder="Nhập họ và tên" value={form.hoTen} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 transition"/>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Ngày sinh</label>
              <input name="ngaySinh" type="date" value={form.ngaySinh} onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 transition"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Số điện thoại</label>
              <input name="soDienThoai" type="tel" placeholder="Nhập số điện thoại" value={form.soDienThoai} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 transition"/>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email <span className="text-gray-400 text-xs">(Không bắt buộc)</span></label>
              <input name="email" type="email" placeholder="Nhập email" value={form.email} onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 transition"/>
              {form.email && <p className="text-xs text-green-600 mt-1">✓ Hóa đơn VAT sẽ gửi qua email này</p>}
            </div>
          </div>

          <h2 className="font-semibold text-gray-800 pt-1">Tạo mật khẩu</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Mật khẩu</label>
              <div className="relative">
                <input name="matKhau" type={showPass ? 'text' : 'password'} placeholder="Nhập mật khẩu" value={form.matKhau} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 transition pr-10"/>
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? eyeOff : eyeOpen}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nhập lại mật khẩu</label>
              <div className="relative">
                <input name="xacNhan" type={showPass2 ? 'text' : 'password'} placeholder="Nhập lại mật khẩu" value={form.xacNhan} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 transition pr-10"/>
                <button type="button" onClick={() => setShowPass2(!showPass2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass2 ? eyeOff : eyeOpen}</button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400">ℹ️ Mật khẩu tối thiểu 6 ký tự, có ít nhất 1 chữ số và 1 số</p>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="subscribeNews" checked={form.subscribeNews} onChange={handleChange} className="w-4 h-4 accent-red-500"/>
            <span className="text-sm text-gray-600">Đăng ký nhận tin khuyến mãi từ SmartHub</span>
          </label>

          <p className="text-xs text-gray-500">
            Bằng việc Đăng ký, bạn đã đọc và đồng ý với <a href="#" className="text-red-500 hover:underline">Điều khoản sử dụng</a> và <a href="#" className="text-red-500 hover:underline">Chính sách bảo mật của SmartHub</a>.
          </p>

          <hr className="border-dashed border-gray-200"/>

          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Tôi là Học sinh - sinh viên / Giáo viên - giảng viên</p>
                <p className="text-xs text-gray-400 mt-0.5">🎁 Nhận thêm ưu đãi tới <span className="text-red-500 font-medium">700k/sản phẩm</span></p>
              </div>
              <Toggle checked={form.isStudent} onChange={() => setForm(p => ({ ...p, isStudent: !p.isStudent }))}/>
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Tôi là Khách hàng Doanh nghiệp</p>
                <p className="text-xs text-gray-400 mt-0.5">🎁 Nhận quyền lợi hấp dẫn lên đến <span className="text-red-500 font-medium">1 triệu/đơn hàng</span></p>
              </div>
              <Toggle checked={form.isEnterprise} onChange={() => setForm(p => ({ ...p, isEnterprise: !p.isEnterprise }))}/>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-red-600 text-sm text-center">{error}</p></div>}

          <div className="flex gap-3 pt-1">
            <Link href="/login" className="flex-1 border border-gray-300 text-gray-600 font-medium py-3 rounded-xl text-sm hover:bg-gray-50 transition text-center">
              ← Quay lại đăng nhập
            </Link>
            <button type="submit" disabled={loading}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60 text-sm">
              {loading ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
