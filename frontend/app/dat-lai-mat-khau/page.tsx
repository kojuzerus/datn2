'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

const eyeOpen = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const eyeOff  = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

const SuccessIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#dcfce7" />
    <path d="M7 12.5l3 3 7-7" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#fee2e2" />
    <path d="M9 9l6 6M15 9l-6 6" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Đo độ mạnh mật khẩu đơn giản: độ dài + đa dạng ký tự
function getStrength(pw: string) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LABEL = ['Rất yếu', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];
const STRENGTH_COLOR = ['bg-gray-200', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [matKhau, setMatKhau]   = useState('');
  const [xacNhan, setXacNhan]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const strength = useMemo(() => getStrength(matKhau), [matKhau]);

  if (!token) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-4 mt-1"><ErrorIcon /></div>
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Liên kết không hợp lệ</h1>
        <p className="text-gray-500 text-sm mb-6">
          Đường dẫn đặt lại mật khẩu bị thiếu hoặc không đúng định dạng.
        </p>
        <Link href="/quen-mat-khau"
          className="inline-block w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition text-sm">
          Gửi lại yêu cầu mới
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-4 mt-1"><SuccessIcon /></div>
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Đặt lại mật khẩu thành công</h1>
        <p className="text-gray-500 text-sm mb-6">
          Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại bằng mật khẩu mới.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition text-sm"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  if (invalidToken) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-4 mt-1"><ErrorIcon /></div>
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Liên kết đã hết hạn</h1>
        <p className="text-gray-500 text-sm mb-6">
          Liên kết đặt lại mật khẩu này không còn hợp lệ hoặc đã hết hạn sử dụng (15 phút).
        </p>
        <Link href="/quen-mat-khau"
          className="inline-block w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition text-sm">
          Gửi lại yêu cầu mới
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (matKhau.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự');
    if (matKhau !== xacNhan) return setError('Mật khẩu xác nhận không khớp');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, matKhauMoi: matKhau }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 && /hết hạn|không hợp lệ/i.test(data.message || '')) {
          setInvalidToken(true);
          return;
        }
        throw new Error(data.message || 'Đặt lại mật khẩu thất bại');
      }
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-lg font-semibold text-gray-800 mb-1">Tạo mật khẩu mới</h1>
      <p className="text-gray-500 text-sm mb-6">
        Mật khẩu mới cần khác với mật khẩu đã dùng trước đó.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 text-left">
        <div>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Mật khẩu mới"
              value={matKhau}
              onChange={e => setMatKhau(e.target.value)}
              required
              autoFocus
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 transition pr-10"
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? eyeOff : eyeOpen}
            </button>
          </div>
          {matKhau && (
            <div className="mt-1.5">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? STRENGTH_COLOR[strength] : 'bg-gray-200'}`} />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Độ mạnh: {STRENGTH_LABEL[strength]}</p>
            </div>
          )}
        </div>

        <div className="relative">
          <input
            type={showPass2 ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu mới"
            value={xacNhan}
            onChange={e => setXacNhan(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 transition pr-10"
          />
          <button type="button" onClick={() => setShowPass2(!showPass2)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPass2 ? eyeOff : eyeOpen}
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
          {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
        </button>
      </form>
    </>
  );
}

export default function DatLaiMatKhauPage() {
  const router = useRouter();
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

        <Suspense fallback={null}>
          <ResetForm />
        </Suspense>

        <p className="text-sm mt-6">
          <Link href="/login" className="text-red-400 hover:underline">← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
