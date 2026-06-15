'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { CheckCircle2, ShoppingBag, ClipboardList, Hash } from 'lucide-react';

function SuccessContent() {
  const params  = useSearchParams();
  const orderId = params.get('orderId');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        {/* Icon thành công */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-11 h-11 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Đặt hàng thành công!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Cảm ơn bạn đã mua sắm tại SmartHub. Chúng tôi sẽ xử lý và giao hàng sớm nhất có thể.
        </p>

        {orderId && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Hash className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">Mã đơn hàng</p>
              <p className="font-mono font-bold text-gray-700 text-sm truncate">{orderId}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition"
          >
            <ShoppingBag className="w-4 h-4" />
            Tiếp tục mua sắm
          </Link>
          <Link
            href="/don-hang"
            className="flex items-center justify-center gap-2 w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition text-sm"
          >
            <ClipboardList className="w-4 h-4" />
            Xem đơn hàng của tôi
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DatHangThanhCongPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
