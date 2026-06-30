'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, X, UserCircle2 } from 'lucide-react';
import { REQUEST_LOGIN_EVENT } from '../lib/authPrompt';

export default function LoginPromptModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('Bạn cần đăng nhập để sử dụng tính năng này.');

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      setMessage(detail?.message || 'Bạn cần đăng nhập để sử dụng tính năng này.');
      setOpen(true);
    };
    window.addEventListener(REQUEST_LOGIN_EVENT, handler);
    return () => window.removeEventListener(REQUEST_LOGIN_EVENT, handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <UserCircle2 className="w-7 h-7 text-red-500" />
        </div>

        <h2 className="text-base font-bold text-gray-900">Yêu cầu đăng nhập</h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">{message}</p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={() => {
              setOpen(false);
              router.push('/login');
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Đăng nhập ngay
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
