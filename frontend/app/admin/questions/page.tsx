"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  CheckCircle,
  Clock,
  Trash2,
  Edit3,
  ExternalLink,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Question {
  _id: string;
  sanPhamId?: any;
  userName: string;
  questionText: string;
  createdAt: string;
  isReplied?: boolean;
  reply?: {
    replyText: string;
    repliedAt: string;
  };

  productInfo?: {
    product_id: number;
    product_name: string;
    slug: string;
    thumbnail: string;
  } | null;
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "replied">(
    "all",
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");

  // Hàm định dạng ngày tháng sang DD/MM/YYYY HH:mm
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Không rõ thời gian";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr; // Nếu không parse được thì trả về chuỗi gốc
      return d.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // 🚀 ĐỒNG BỘ 1: Fetch dữ liệu từ API Admin đã sửa ở backend
  const fetchAllQuestions = async () => {
    setLoading(true);
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("smarthub_token");

      const res = await fetch(`${API_URL}/api/questions/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Không thể tải danh sách câu hỏi");
      const data = await res.json();

      // Đọc dữ liệu thô từ MongoDB và map sang cấu trúc giao diện cũ của bạn
      if (Array.isArray(data)) {
        const mappedData = data.map((q: any) => ({
          _id: q._id,
          userName: q.userName || "Khách ẩn danh",
          questionText: q.content || q.questionText || "", // Đọc trường content của Model chuyển thành questionText
          createdAt: q.createdAt,
          sanPhamId: q.product || q.sanPhamId || "",
          productInfo: q.productInfo || null, // Đọc trường product lưu dạng String của bạn
          isReplied: q.replies && q.replies.length > 0,
          reply:
            q.replies && q.replies.length > 0
              ? {
                  replyText: q.replies[0].content, // Lấy câu trả lời đầu tiên đưa lên giao diện
                  repliedAt: q.replies[0].createdAt,
                }
              : undefined,
        }));
        setQuestions(mappedData);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error("Lỗi Fetch API:", err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllQuestions();
  }, []);

  const checkIsReplied = (q: Question) => {
    if (q.isReplied !== undefined) return q.isReplied;
    return !!(q.reply && q.reply.replyText && q.reply.replyText.trim() !== "");
  };

  const filteredQuestions = questions.filter((q) => {
    const isReplied = checkIsReplied(q);
    if (activeTab === "pending") return !isReplied;
    if (activeTab === "replied") return isReplied;
    return true;
  });

  const countPending = questions.filter((q) => !checkIsReplied(q)).length;
  const countReplied = questions.filter((q) => checkIsReplied(q)).length;

  // 🚀 ĐỒNG BỘ 2: Sửa lại route DELETE theo đúng router gốc của bạn (Bỏ tiền tố /api)
  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?")) return;
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("smarthub_token");

      const res = await fetch(`${API_URL}/api/questions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Xóa câu hỏi thất bại");
      setQuestions(questions.filter((q) => q._id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEdit = (id: string, currentText: string) => {
    setEditingId(id);
    setEditText(currentText);
  };

  // 🚀 ĐỒNG BỘ 3: Sửa lại route POST tạo câu trả lời và truyền param 'content' chuẩn schema mảng replies
  const handleSaveReply = async (id: string) => {
    if (!editText.trim()) return;
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("smarthub_token");

      const res = await fetch(`${API_URL}/api/questions/${id}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editText.trim() }), // Đổi sang gửi trường content
      });

      if (!res.ok) throw new Error("Gửi câu trả lời thất bại");

      alert("Xử lý phản hồi thành công!");
      fetchAllQuestions(); // Tải lại để đồng bộ state mới nhất từ database
      setEditingId(null);
      setEditText("");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans">
      {/* Tiêu đề */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="text-red-600" /> Quản lý hỏi đáp & bình luận
        </h1>
        <p className="text-sm text-gray-400 mt-1">Trang chủ / Bình luận</p>
      </div>

      {/* THANH BỘ LỌC TABS */}
      <div className="flex gap-2 border-b border-gray-100 pb-3 mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm rounded-xl cursor-pointer font-medium transition-all ${
            activeTab === "all"
              ? "bg-red-50 text-red-600 font-semibold"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Tất cả ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-sm rounded-xl cursor-pointer font-medium transition-all ${
            activeTab === "pending"
              ? "bg-amber-50 text-amber-600 font-semibold"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Chờ trả lời ({countPending})
        </button>
        <button
          onClick={() => setActiveTab("replied")}
          className={`px-4 py-2 text-sm rounded-xl cursor-pointer font-medium transition-all ${
            activeTab === "replied"
              ? "bg-emerald-50 text-emerald-600 font-semibold"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Đã trả lời ({countReplied})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400 animate-pulse">
          Đang kết nối API và đồng bộ danh sách câu hỏi...
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q: any) => {
            // Hiển thị mã sản phẩm hoặc tên sản phẩm phẳng từ Model String của bạn

            const hasReplied = checkIsReplied(q);

            return (
              <div
                key={q._id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative group text-left"
              >
                {/* Nút hành động Xóa */}
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(q._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border-none bg-transparent cursor-pointer"
                    title="Xóa bình luận"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Thông tin User & Link sản phẩm */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-rose-50 text-red-600 font-bold flex items-center justify-center text-sm shrink-0">
                      {q.userName ? q.userName.charAt(0).toUpperCase() : "K"}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 m-0">
                        {q.userName || "Khách ẩn danh"}
                      </h3>

                      {q.productInfo ? (
                        <Link
                          href={`/sanpham/${q.productInfo.slug}`}
                          target="_blank"
                          className="flex items-center gap-2 mt-1.5 group/prod no-underline"
                        >
                          <img
                            src={
                              q.productInfo.thumbnail?.startsWith("http")
                                ? q.productInfo.thumbnail
                                : `${API_URL}${q.productInfo.thumbnail}`
                            }
                            alt={q.productInfo.product_name}
                            className="w-9 h-9 rounded-lg object-cover border border-gray-200 bg-white shrink-0"
                          />
                          <span className="text-xs font-medium text-gray-700 group-hover/prod:text-red-600 inline-flex items-center gap-1 max-w-[280px] truncate">
                            {q.productInfo.product_name}
                            <ExternalLink size={10} className="shrink-0" />
                          </span>
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400 mt-0.5 block">
                          Sản phẩm #{q.sanPhamId || "?"} (không tìm thấy)
                        </span>
                      )}
                    </div>
                  </div>

                  {hasReplied ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <CheckCircle size={12} /> Đã phản hồi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
                      <Clock size={12} /> Chờ trả lời
                    </span>
                  )}
                </div>

                {/* Nội dung câu hỏi */}
                <div className="bg-gray-50 rounded-xl p-3.5 text-sm text-gray-700 mb-3 border border-gray-100">
                  <span className="font-semibold text-gray-500 mr-1">Hỏi:</span>{" "}
                  {q.questionText}
                  <span className="block text-[10px] text-gray-400 mt-1">
                    Đăng ngày: {formatDate(q.createdAt)}
                  </span>
                </div>

                {/* Ô NHẬP / SỬA CÂU TRẢ LỜI */}
                {editingId === q._id ? (
                  <div className="mt-3 flex flex-col gap-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 resize-none font-sans"
                      rows={2}
                      placeholder="Nhập nội dung phản hồi khách hàng..."
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 border-none rounded-lg cursor-pointer font-medium"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => handleSaveReply(q._id)}
                        className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 border-none rounded-lg cursor-pointer font-medium"
                      >
                        Lưu câu trả lời
                      </button>
                    </div>
                  </div>
                ) : q.reply?.replyText ? (
                  <div className="bg-rose-50/40 rounded-xl p-3.5 text-sm text-gray-700 border border-rose-100/60 flex items-start justify-between group/reply">
                    <div>
                      <span className="font-bold text-red-600 mr-1">
                        SmartHub trả lời:
                      </span>
                      <span>{q.reply.replyText}</span>
                      <span className="block text-[10px] text-gray-400 mt-1.5 tracking-tight">
                        Phản hồi lúc:{" "}
                        {formatDate(q.reply.repliedAt || q.createdAt)}
                      </span>
                    </div>
                    <button
                      onClick={() => startEdit(q._id, q.reply!.replyText)}
                      className="p-1 text-gray-400 hover:text-blue-600 border-none bg-transparent cursor-pointer opacity-0 group-hover/reply:opacity-100 transition-opacity"
                      title="Sửa câu trả lời"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(q._id, "")}
                    className="text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
                  >
                    Viết câu trả lời ngay
                  </button>
                )}
              </div>
            );
          })}

          {filteredQuestions.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Không tìm thấy bình luận nào trong mục này.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
