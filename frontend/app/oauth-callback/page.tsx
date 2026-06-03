'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OAuthCallbackPage() {
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
      router.push('/');
    } catch {
      router.push('/dang-nhap?error=oauth_failed');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Đang đăng nhập...</p>
      </div>
    </div>
  );
}
