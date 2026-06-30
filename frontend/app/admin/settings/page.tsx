import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#FFF5F5] flex items-center justify-center mb-4">
        <Settings size={24} className="text-[#D32F2F]" />
      </div>
      <h1 className="text-[17px] font-bold text-gray-900 mb-1.5">Cài đặt</h1>
      <p className="text-[13.5px] text-gray-400 max-w-[360px]">
        Trang cài đặt hệ thống (thông tin shop, vận chuyển, thanh toán...) đang được phát triển.
      </p>
    </div>
  );
}
