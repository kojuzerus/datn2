'use client';

import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  open: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Xác nhận trước khi khách bấm "Ghi Nhận Hàng" — hành động này KHÔNG thể tự
// hoàn tác (đơn chuyển thẳng sang "đã giao", chỉ admin mới sửa lại được nếu
// khách bấm nhầm lúc shipper chưa thực sự giao) nên cần 1 bước xác nhận rõ
// ràng, tránh bấm nhầm rồi phải liên hệ hỗ trợ để sửa lại.
export default function ConfirmReceivedModal({ open, loading = false, onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!loading ? onCancel : undefined}
      />

      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col animate-[fadeInUp_0.22s_ease-out]">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Xác nhận đã nhận hàng?</h3>
              <p className="text-xs text-gray-400 mt-0.5">Chỉ bấm khi bạn thực sự đã cầm được hàng</p>
            </div>
          </div>
          {!loading && (
            <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Sau khi xác nhận, đơn hàng sẽ chuyển sang trạng thái <strong className="text-gray-800">Đã giao</strong> và không tự hoàn tác được.
            Nếu shipper <strong className="text-gray-800">chưa thực sự giao hàng</strong> mà bạn bấm nhầm, vui lòng liên hệ bộ phận hỗ trợ để được xử lý lại.
          </p>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Chưa nhận được
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? 'Đang xác nhận...' : 'Đã nhận được hàng'}
          </button>
        </div>
      </div>
    </div>
  );
}
