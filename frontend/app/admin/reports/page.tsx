import { BarChart2 } from "lucide-react";

export default function AdminReportsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#FFF5F5] flex items-center justify-center mb-4">
        <BarChart2 size={24} className="text-[#D32F2F]" />
      </div>
      <h1 className="text-[17px] font-bold text-gray-900 mb-1.5">Báo cáo thống kê</h1>
      <p className="text-[13.5px] text-gray-400 max-w-[360px]">
        Báo cáo chi tiết theo thời gian, sản phẩm, khách hàng đang được phát triển. Xem nhanh số liệu tổng quan tại trang Dashboard.
      </p>
    </div>
  );
}
