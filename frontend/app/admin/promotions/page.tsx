import { Tag } from "lucide-react";

export default function AdminPromotionsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#FFF5F5] flex items-center justify-center mb-4">
        <Tag size={24} className="text-[#D32F2F]" />
      </div>
      <h1 className="text-[17px] font-bold text-gray-900 mb-1.5">Mã giảm giá</h1>
      <p className="text-[13.5px] text-gray-400 max-w-[360px]">
        Tính năng quản lý mã giảm giá đang được phát triển và sẽ sớm ra mắt.
      </p>
    </div>
  );
}
