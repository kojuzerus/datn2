'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function Mascot() {
  return (
    <svg viewBox="0 0 80 80" width="90" height="90">
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

export default function DangNhapPage() {
  const router = useRouter();
  const [soDienThoai, setSoDienThoai] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soDienThoai, matKhau }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');
      localStorage.setItem('smarthub_token', data.token);
      localStorage.setItem('smarthub_user', JSON.stringify(data.user));
      router.push(data.user?.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-sm shadow-xl w-full max-w-sm p-8 text-center relative">

        {/* Nút đóng */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg"
        >
          ✕
        </button>

        {/* Logo */}
        <h2 className="text-2xl font-bold text-red-500 mb-2">SMARTHUB</h2>
        <div className="flex justify-center mb-3">
          <Mascot />
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Vui lòng đăng nhập tài khoản Smarthub để xem<br />
          ưu đãi và thanh toán dễ dàng hơn.
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3 text-left">
          <input
            type="text"
            placeholder="Số điện thoại hoặc email"
            value={soDienThoai}
            onChange={e => setSoDienThoai(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 transition"
          />

          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Mật khẩu"
              value={matKhau}
              onChange={e => setMatKhau(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 transition pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPass ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center bg-red-50 py-2 rounded-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60 text-sm"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-xs text-right mt-2">
          <span className="text-red-400 hover:underline cursor-pointer">Quên mật khẩu?</span>
        </p>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">hoặc</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Nút đăng ký */}
        <div className="flex gap-3">
          <Link
            href="/dangky"
            className="flex-1 border-2 border-red-400 text-red-500 font-semibold py-3 rounded-xl text-sm hover:bg-red-50 transition text-center"
          >
            Đăng ký
          </Link>
        </div>
      </div>
    </div>
  );
}
