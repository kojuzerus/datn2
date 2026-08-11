'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const RESEND_COOLDOWN = 60; // giây

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

const MailSentIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.6">
    <circle cx="12" cy="12" r="10" fill="#dcfce7" stroke="none" />
    <path d="M7 12.5l3 3 7-7" stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function QuenMatKhauPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [sent, setSent]             = useState(false);
  const [cooldown, setCooldown]     = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) return setError('Vui lòng nhập số điện thoại hoặc email');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra, vui lòng thử lại');
      setSent(true);
      startCooldown();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra, vui lòng thử lại');
      startCooldown();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-sm shadow-xl w-full max-w-sm p-8 text-center relative">
        <button
          onClick={() => router.push('/')}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-red-500 mb-2">SMARTHUB</h2>
        <div className="flex justify-center mb-3">
          <Mascot />
        </div>

        {!sent ? (
          <>
            <h1 className="text-lg font-semibold text-gray-800 mb-1">Quên mật khẩu?</h1>
            <p className="text-gray-500 text-sm mb-6">
              Nhập số điện thoại hoặc email đã đăng ký, chúng tôi sẽ gửi liên kết
              đặt lại mật khẩu qua email của bạn.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 text-left">
              <input
                type="text"
                placeholder="Số điện thoại hoặc email"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
                autoFocus
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 transition"
              />

              {error && (
                <p className="text-red-500 text-xs text-center bg-red-50 py-2 rounded-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60 text-sm"
              >
                {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4 mt-1">
              <MailSentIcon />
            </div>
            <h1 className="text-lg font-semibold text-gray-800 mb-2">Kiểm tra email của bạn</h1>
            <p className="text-gray-500 text-sm mb-1 leading-relaxed">
              Nếu tài khoản tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu
              tới email đã đăng ký. Liên kết có hiệu lực trong <strong>15 phút</strong>.
            </p>
            <p className="text-gray-400 text-xs mb-6">
              Không thấy email? Kiểm tra thêm mục Spam / Quảng cáo.
            </p>

            {error && (
              <p className="text-red-500 text-xs text-center bg-red-50 py-2 rounded-sm mb-3">{error}</p>
            )}

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || loading}
              className="w-full border border-gray-300 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:hover:bg-white"
            >
              {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : (loading ? 'Đang gửi...' : 'Gửi lại email')}
            </button>
          </>
        )}

        <p className="text-sm mt-6">
          <Link href="/login" className="text-red-400 hover:underline">← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
