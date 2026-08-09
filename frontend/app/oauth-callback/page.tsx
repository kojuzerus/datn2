'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mergeGuestCartToServer } from '../lib/guestCart';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function OAuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const user  = searchParams.get('user');
    const error = searchParams.get('error');

    if (error || !token || !user) {
      router.push('/dang-nhap?error=oauth_failed');
      return;
    }

    try {
      localStorage.setItem('smarthub_token', token);
      localStorage.setItem('smarthub_user', decodeURIComponent(user));
      // Gộp giỏ hàng đã thêm khi chưa đăng nhập vào giỏ trên server
      mergeGuestCartToServer(API_URL, token).finally(() => router.push('/'));
    } catch {
      router.push('/dang-nhap?error=oauth_failed');
    }
  }, [router, searchParams]);

  return null;
}

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-500 text-sm">Đang đăng nhập...</p>
    </div>
  </div>
);

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <OAuthHandler />
      <Spinner />
    </Suspense>
  );
}
