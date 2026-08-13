"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ThumbsUp,
  MessageSquare,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Reply {
  replyText: string;
  repliedAt: string;
}

interface CustomerQuestion {
  _id: string | number;
  userName: string;
  isPurchased: boolean;
  questionText: string;
  createdAt: string;
  likes: number;
  likedByMe?: boolean;
  reply?: Reply;
}

export default function ProductQuestionsCustomer({
  sanPhamId,
}: {
  sanPhamId: string | number;
}) {
  const [questions, setQuestions] = useState<CustomerQuestion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(2);

  const [questionText, setQuestionText] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // Trạng thái đang tải dữ liệu ban đầu

  // 1. Kiểm tra trạng thái đăng nhập để hiển thị giao diện chào mừng
  useEffect(() => {
    const token =
      localStorage.getItem("smarthub_token") || localStorage.getItem("token");

    // Lấy tên người dùng TRỰC TIẾP từ object user đã lưu lúc đăng nhập
    // (đồng bộ đúng với trang đăng nhập: localStorage.setItem('smarthub_user', JSON.stringify(data.user)))
    let savedName = "";
    const userStr = localStorage.getItem("smarthub_user");
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        savedName = userObj?.hoTen || userObj?.name || userObj?.userName || "";
      } catch {
        savedName = "";
      }
    }

    if (token) {
      setIsLoggedIn(true);
      setUsername(savedName || "Thành viên SmartHub");
    } else {
      setIsLoggedIn(false);
      setUsername("");
    }
  }, []);

  // 🌟 HÀM TẢI CÂU HỎI TỰ ĐỘNG KHỚP BACKEND ROUTER
  const fetchQuestions = useCallback(async () => {
    if (!sanPhamId) return;
    try {
      // Đúng route thật của backend: /api/questions/products/:productId/questions
      const res = await fetch(
        `${API_URL}/api/questions/products/${sanPhamId}/questions`,
      );

      const data = await res.json();

      // Kiểm tra cấu trúc trả về (mảng trực tiếp hoặc bọc trong object)
      const rawList = Array.isArray(data)
        ? data
        : data.data || data.questions || [];

      const formattedQuestions = rawList.map((q: any) => ({
        _id: q._id,
        userName: q.userName || "Ẩn danh",
        isPurchased: q.isPurchased || false,
        questionText: q.content || q.questionText, // Đồng bộ trường 'content' từ database của bạn
        createdAt: q.createdAt
          ? new Date(q.createdAt).toLocaleDateString("vi-VN")
          : "Vừa xong",
        likes: q.likes || 0,
        reply:
          q.replies && q.replies.length > 0
            ? {
                replyText: q.replies[0].content,
                repliedAt: q.replies[0].createdAt
                  ? new Date(q.replies[0].createdAt).toLocaleString("vi-VN")
                  : "",
              }
            : undefined,
      }));

      setQuestions(formattedQuestions);
    } catch (err) {
      console.error("Lỗi lấy danh sách câu hỏi:", err);
      setQuestions([]);
    } finally {
      setFetching(false);
    }
  }, [sanPhamId]);
  // 3. Tự động kích hoạt tải câu hỏi khi truy cập hoặc đổi sản phẩm khác
  useEffect(() => {
    setFetching(true);
    fetchQuestions();
    setVisibleCount(2);
    setSearchTerm("");
  }, [sanPhamId, fetchQuestions]);

  const formatAnonymizedName = (name: string) => {
    if (!name) return "Ẩn danh";
    const words = name.trim().split(" ");
    if (words.length === 1) return name;
    return `${words[0]} * ${words[words.length - 1]}`;
  };

  const handleLike = (id: string | number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q._id === id) {
          const isLiked = !q.likedByMe;
          return {
            ...q,
            likedByMe: isLiked,
            likes: isLiked ? q.likes + 1 : q.likes - 1,
          };
        }
        return q;
      }),
    );
  };

  // 4. 🔥 HÀM GỬI CÂU HỎI ĐÃ ĐỒNG BỘ VÀ TỰ ĐỘNG RE-FETCH DATA THỰC TẾ
  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const token =
      localStorage.getItem("smarthub_token") || localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập để đặt câu hỏi!");
      return;
    }

    if (!sanPhamId) {
      alert("Không xác định được sản phẩm cần đặt câu hỏi!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/questions/products/${sanPhamId}/questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: questionText.trim(),
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gửi câu hỏi thất bại");

      setQuestionText(""); // Làm trống ô nhập liệu nhanh chóng

      // 🔄 GỌI LẠI HÀM FETCH: Tải lại toàn bộ dữ liệu mới nhất từ Database lên màn hình để đồng bộ
      await fetchQuestions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(
    (q) =>
      (q.questionText &&
        q.questionText.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.reply?.replyText &&
        q.reply.replyText.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const displayedQuestions = filteredQuestions.slice(0, visibleCount);

  return (
    <div className="max-w-7xl mx-auto p-8 bg-white rounded-2xl border border-gray-100 shadow-sm font-sans mt-8">
      {/* TIÊU ĐỀ KHỐI */}
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
        <MessageSquare className="text-red-600" size={24} />
        <h2 className="text-xl font-bold text-gray-800 m-0">
          Hỏi và đáp về sản phẩm ({filteredQuestions.length})
        </h2>
      </div>

      {/* KHUNG ĐẶT CÂU HỎI MỚI (STYLE GIỐNG ẢNH MẪU) */}
      <div className="bg-gray-50/60 rounded-xl p-5 mb-8 border border-gray-100">
        {isLoggedIn && (
          <p className="text-xs text-green-600 mb-3 font-medium flex items-center gap-1">
            ✍️ Tài khoản đặt câu hỏi:{" "}
            <strong className="text-gray-700">{username}</strong>
          </p>
        )}

        <form
          onSubmit={handleSendQuestion}
          className="relative bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-400 transition-all"
        >
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder={
              isLoggedIn
                ? "Xin mời để lại câu hỏi, SmartHub sẽ trả lời trong 1h từ khi nhận được câu hỏi (trừ các ngày lễ, tết)..."
                : "Bạn phải đăng nhập tài khoản để đặt câu hỏi cho sản phẩm này..."
            }
            disabled={!isLoggedIn || loading}
            rows={3}
            className="w-full bg-white px-4 py-3 pb-12 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
          />

          {/* NÚT GỬI NẰM GÓC PHẢI DƯỚI BÊN TRONG Ô INPUT */}
          <div className="absolute bottom-2 right-2 flex items-center gap-3">
            {!isLoggedIn && (
              <span className="text-red-500 text-xs font-medium hidden sm:inline">
                Vui lòng đăng nhập
              </span>
            )}
            <button
              type="submit"
              disabled={!isLoggedIn || !questionText.trim() || loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-medium px-5 py-2 rounded-lg text-xs transition shrink-0 shadow-sm cursor-pointer"
            >
              {loading ? "Đang gửi..." : "Gửi câu hỏi"}
            </button>
          </div>
        </form>
      </div>

      {/* THANH TÌM KIẾM CÂU HỎI */}
      <div className="relative mb-6">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm câu hỏi liên quan..."
          className="w-full text-sm p-3 pl-11 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 bg-white transition-all text-gray-800"
        />
      </div>

      {/* DANH SÁCH HIỂN THỊ CÂU HỎI */}
      <div className="space-y-4">
        {fetching ? (
          <div className="text-center py-8 text-sm text-gray-400 animate-pulse">
            Đang tải dữ liệu câu hỏi từ hệ thống...
          </div>
        ) : (
          displayedQuestions.map((q) => (
            <div
              key={q._id}
              className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm text-left transition-hover hover:border-gray-200"
            >
              {/* Người hỏi */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-red-50 text-red-600 font-bold flex items-center justify-center text-xs">
                  {q.userName ? q.userName.charAt(0).toUpperCase() : "K"}
                </div>
                <span className="text-sm font-bold text-gray-800">
                  {formatAnonymizedName(q.userName)}
                </span>
                {q.isPurchased && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium border border-emerald-100">
                    <CheckCircle2 size={10} /> Đã mua hàng
                  </span>
                )}
                <span className="text-[11px] text-gray-400 ml-auto">
                  {q.createdAt}
                </span>
              </div>

              {/* Nội dung câu hỏi */}
              <p className="text-sm text-gray-700 pl-8 m-0 font-normal leading-relaxed">
                {q.questionText}
              </p>

              {/* Khối phản hồi của QTV (Nếu có) */}
              {q.reply && (
                <div className="mt-4 ml-8 bg-gray-50 border border-gray-200/60 rounded-xl p-4 relative text-left before:content-[''] before:absolute before:-top-2 before:left-4 before:w-4 before:h-4 before:bg-gray-50 before:border-l before:border-t before:border-gray-200/60 before:rotate-45">
                  <div className="flex items-center gap-1.5 mb-1.5 relative z-10">
                    <span className="text-xs font-bold text-red-600">
                      SmartHub trả lời
                    </span>
                    <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold tracking-wide">
                      QTV
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 m-0 leading-relaxed relative z-10">
                    {q.reply.replyText}
                  </p>

                  {/* Nút thích hữu ích */}
                  <div className="mt-3 flex items-center border-t border-gray-200/60 pt-2.5 relative z-10">
                    <button
                      onClick={() => handleLike(q._id)}
                      className={`inline-flex items-center gap-1 text-xs font-medium bg-transparent border-none cursor-pointer p-0 transition-colors ${
                        q.likedByMe
                          ? "text-red-600 font-semibold"
                          : "text-gray-400 hover:text-red-600"
                      }`}
                    >
                      <ThumbsUp
                        size={12}
                        className={q.likedByMe ? "fill-red-600/10" : ""}
                      />
                      {q.likedByMe ? "Đã đánh giá hữu ích" : "Hữu ích"}
                      {q.likes > 0 && (
                        <span className="text-gray-500 font-normal">
                          ({q.likes})
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {!fetching && filteredQuestions.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            Chưa có câu hỏi nào cho sản phẩm này. Hãy để lại thắc mắc đầu tiên
            của bạn!
          </div>
        )}
      </div>

      {/* NÚT XEM THÊM */}
      {!searchTerm.trim() && filteredQuestions.length > visibleCount && (
        <div className="mt-5 text-center pt-2">
          <button
            onClick={() => setVisibleCount((prev) => prev + 2)}
            className="inline-flex items-center gap-1 text-xs text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 px-6 py-2 rounded-xl font-medium cursor-pointer transition-colors shadow-sm"
          >
            Xem thêm câu hỏi khác <ChevronDown size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
