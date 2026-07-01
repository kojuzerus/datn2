'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CANCEL_REASONS = [
  'Tôi muốn thay đổi địa chỉ giao hàng',
  'Tôi muốn thay đổi sản phẩm hoặc số lượng',
  'Tôi tìm được nơi mua rẻ hơn',
  'Tôi đặt nhầm sản phẩm',
  'Thời gian giao hàng quá lâu',
  'Tôi không còn nhu cầu mua nữa',
  'Lý do khác',
];

interface Props {
  open: boolean;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function CancelOrderModal({ open, loading = false, onConfirm, onCancel }: Props) {
  const [selected, setSelected] = useState('');
  const [other, setOther] = useState('');

  useEffect(() => {
    if (open) {
      setSelected('');
      setOther('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const isOther = selected === 'Lý do khác';
  const finalReason = isOther ? other.trim() : selected;
  const canSubmit = selected !== '' && (!isOther || other.trim() !== '');

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!loading ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col animate-[fadeInUp_0.22s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-800">Lý do hủy đơn</h3>
            <p className="text-xs text-gray-400 mt-0.5">Vui lòng chọn lý do để chúng tôi cải thiện dịch vụ</p>
          </div>
          {!loading && (
            <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Reasons list */}
        <div className="px-5 py-3 space-y-1 overflow-y-auto max-h-[55vh]">
          {CANCEL_REASONS.map((reason) => (
            <label
              key={reason}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl cursor-pointer border transition-colors ${
                selected === reason
                  ? 'border-red-400 bg-red-50'
                  : 'border-transparent hover:bg-gray-50'
              }`}
            >
              {/* Custom radio */}
              <span className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                selected === reason ? 'border-red-500' : 'border-gray-300'
              }`}>
                {selected === reason && (
                  <span className="w-2 h-2 rounded-full bg-red-500 block" />
                )}
              </span>
              <span className={`text-sm ${selected === reason ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                {reason}
              </span>
              <input
                type="radio"
                className="sr-only"
                name="cancel-reason"
                value={reason}
                checked={selected === reason}
                onChange={() => setSelected(reason)}
              />
            </label>
          ))}

          {/* Other reason textarea */}
          {isOther && (
            <div className="pt-1 pb-2 px-1">
              <textarea
                value={other}
                onChange={e => setOther(e.target.value)}
                placeholder="Nhập lý do của bạn..."
                maxLength={200}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 resize-none transition"
              />
              <p className="text-right text-[11px] text-gray-400 mt-1">{other.length}/200</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Giữ đơn hàng
          </button>
          <button
            onClick={() => canSubmit && onConfirm(finalReason)}
            disabled={!canSubmit || loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? 'Đang hủy...' : 'Xác nhận hủy'}
          </button>
        </div>
      </div>
    </div>
  );
}
