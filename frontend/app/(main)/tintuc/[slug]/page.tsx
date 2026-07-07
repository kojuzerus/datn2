"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Newspaper, Eye, Calendar, User, Home, ChevronRight, ArrowLeft, ImageIcon,
  Heart, MessageSquare, Send, Loader2, CornerDownRight, Trash2, ShieldCheck,
} from "lucide-react";
import { requireLogin } from "../../../lib/authPrompt";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface NewsDetail {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string;
  summary: string;
  content: string;
  author: string;
  views: number;
  likeCount: number;
  liked: boolean;
  createdAt: string;
}

interface RelatedNews {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string;
  summary: string;
  createdAt: string;
}

interface Comment {
  _id: string;
  userName: string;
  content: string;
  createdAt: string;
  reply: { content: string; adminName: string; createdAt: string | null };
}

function fmtDate(s: string) {
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function fmtDateTime(s: string) {
  const d = new Date(s);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${fmtDate(s)}`;
}

export default function TinTucChiTietPage() {
  const params = useParams();
  const slug   = params?.slug as string;

  const [news, setNews]       = useState<NewsDetail | null>(null);
  const [related, setRelated] = useState<RelatedNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Like + bình luận
  const [liking, setLiking]     = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [sending, setSending]   = useState(false);
  const [isAdmin, setIsAdmin]   = useState(false);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [replySending, setReplySending] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("smarthub_token") : null;

  useEffect(() => {
    const raw = localStorage.getItem("smarthub_user");
    if (raw) {
      try { setIsAdmin(JSON.parse(raw)?.role === "admin"); } catch {}
    }
  }, []);

  const fetchComments = useCallback(async (newsId: string) => {
    try {
      const res  = await fetch(`${API_BASE}/api/news/${newsId}/comments`);
      const json = await res.json();
      if (json.success) setComments(json.data);
    } catch {}
  }, []);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      try {
        const headers: Record<string, string> = {};
        const t = localStorage.getItem("smarthub_token");
        if (t) headers.Authorization = `Bearer ${t}`;
        const res  = await fetch(`${API_BASE}/api/news/${slug}`, { headers });
        const json = await res.json();
        if (json.success) {
          setNews(json.data);
          setRelated(json.related || []);
          fetchComments(json.data._id);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, fetchComments]);

  const handleToggleLike = async () => {
    if (!news || liking) return;
    if (!requireLogin("Đăng nhập để thích bài viết")) return;
    setLiking(true);
    try {
      const res = await fetch(`${API_BASE}/api/news/${news._id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("smarthub_token")}` },
      });
      const json = await res.json();
      if (json.success) {
        setNews((n) => n ? { ...n, liked: json.liked, likeCount: json.likeCount } : n);
      }
    } finally {
      setLiking(false);
    }
  };

  const handleSendComment = async () => {
    if (!news || !commentInput.trim() || sending) return;
    if (!requireLogin("Đăng nhập để bình luận")) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/news/${news._id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("smarthub_token")}`,
        },
        body: JSON.stringify({ content: commentInput.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setComments((prev) => [json.data, ...prev]);
        setCommentInput("");
      } else {
        alert(json.message || "Không gửi được bình luận");
      }
    } finally {
      setSending(false);
    }
  };

  const handleSendReply = async (commentId: string) => {
    if (!replyInput.trim() || replySending) return;
    setReplySending(true);
    try {
      const res = await fetch(`${API_BASE}/api/news/comments/${commentId}/reply`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("smarthub_token")}`,
        },
        body: JSON.stringify({ content: replyInput.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setComments((prev) => prev.map((c) => (c._id === commentId ? json.data : c)));
        setReplyingId(null);
        setReplyInput("");
      } else {
        alert(json.message || "Không gửi được trả lời");
      }
    } finally {
      setReplySending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Xóa bình luận này?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/news/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("smarthub_token")}` },
      });
      const json = await res.json();
      if (json.success) setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-4">
          <div className="h-3 w-40 bg-gray-200 rounded" />
          <div className="h-8 w-full bg-gray-200 rounded" />
          <div className="h-8 w-2/3 bg-gray-200 rounded" />
          <div className="h-3 w-52 bg-gray-200 rounded" />
          <div className="aspect-[16/9] bg-gray-200 rounded-sm" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (notFound || !news) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-gray-800 mb-1.5">Không tìm thấy bài viết</h1>
          <p className="text-sm text-gray-400 mb-6">Bài viết không tồn tại hoặc đã bị gỡ.</p>
          <Link
            href="/tintuc"
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-sm text-sm font-semibold transition no-underline"
          >
            <ArrowLeft className="w-4 h-4" /> Về trang tin tức
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-1.5 text-[12.5px] text-gray-400">
            <Link href="/" className="hover:text-red-500 transition flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> Trang chủ
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <Link href="/tintuc" className="hover:text-red-500 transition">Tin tức</Link>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="text-gray-700 font-medium truncate max-w-[280px]">{news.title}</span>
          </div>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-100 rounded-sm p-6 sm:p-8">
          <h1 className="text-2xl sm:text-[28px] font-bold text-gray-800 leading-snug mb-4">
            {news.title}
          </h1>

          <div className="flex items-center gap-4 text-[12.5px] text-gray-400 pb-5 border-b border-gray-100 flex-wrap">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> {news.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {fmtDate(news.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> {news.views} lượt xem
            </span>
          </div>

          {news.summary && (
            <p className="text-[15px] text-gray-600 font-medium leading-relaxed mt-5 pl-4 border-l-[3px] border-red-400">
              {news.summary}
            </p>
          )}

          {news.thumbnail && (
            <div className="mt-6 rounded-sm overflow-hidden bg-gray-100">
              <img src={news.thumbnail} alt={news.title} className="w-full object-cover" />
            </div>
          )}

          <div
            className="news-content mt-6 text-[15px] text-gray-700 leading-relaxed
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-800 [&_h2]:mt-8 [&_h2]:mb-3
              [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gray-800 [&_h3]:mt-6 [&_h3]:mb-2
              [&_p]:mb-4 [&_a]:text-red-500 [&_a]:underline
              [&_img]:rounded-sm [&_img]:my-4 [&_img]:max-w-full
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
              [&_li]:mb-1.5 [&_blockquote]:border-l-[3px] [&_blockquote]:border-gray-200 [&_blockquote]:pl-4 [&_blockquote]:text-gray-500 [&_blockquote]:italic"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />

          {/* Like */}
          <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <button
              onClick={handleToggleLike}
              disabled={liking}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 text-sm font-semibold transition active:scale-[0.97] ${
                news.liked
                  ? "border-red-400 bg-red-50 text-red-600"
                  : "border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:text-red-500"
              }`}
            >
              <Heart className={`w-4.5 h-4.5 ${news.liked ? "fill-red-500 text-red-500" : ""}`} />
              {news.liked ? "Đã thích" : "Thích bài viết"}
              <span className="tabular-nums">({news.likeCount})</span>
            </button>
            <span className="flex items-center gap-1.5 text-[13px] text-gray-400">
              <MessageSquare className="w-4 h-4" /> {comments.length} bình luận
            </span>
          </div>
        </div>

        {/* Bình luận */}
        <div className="mt-6 bg-white border border-gray-100 rounded-sm p-6 sm:p-8">
          <h2 className="text-[17px] font-bold text-gray-800 mb-5 flex items-center gap-2">
            <MessageSquare className="w-[18px] h-[18px] text-red-500" />
            Bình luận ({comments.length})
          </h2>

          {/* Form bình luận */}
          <div className="flex gap-3 mb-7">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <textarea
                rows={2}
                maxLength={1000}
                placeholder={token ? "Chia sẻ cảm nghĩ của bạn về bài viết..." : "Đăng nhập để bình luận..."}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onFocus={() => { if (!token) requireLogin("Đăng nhập để bình luận"); }}
                className="w-full border border-gray-200 rounded-sm px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-gray-400"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSendComment}
                  disabled={sending || !commentInput.trim()}
                  className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-sm text-sm font-medium transition disabled:bg-gray-200 disabled:text-gray-400"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Gửi bình luận
                </button>
              </div>
            </div>
          </div>

          {/* Danh sách bình luận */}
          {comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ!
            </p>
          ) : (
            <div className="space-y-5">
              {comments.map((c) => (
                <div key={c._id}>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-[13px] font-bold text-gray-500">
                      {(c.userName || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-xl px-4 py-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[13.5px] font-semibold text-gray-800">{c.userName}</span>
                          <span className="text-[11.5px] text-gray-400">{fmtDateTime(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed whitespace-pre-line">{c.content}</p>
                      </div>

                      {/* Hành động của admin */}
                      {isAdmin && (
                        <div className="flex items-center gap-3 mt-1.5 pl-1">
                          {!c.reply?.content && replyingId !== c._id && (
                            <button
                              onClick={() => { setReplyingId(c._id); setReplyInput(""); }}
                              className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-red-500 transition"
                            >
                              <CornerDownRight className="w-3 h-3" /> Trả lời
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-3 h-3" /> Xóa
                          </button>
                        </div>
                      )}

                      {/* Form trả lời của admin */}
                      {isAdmin && replyingId === c._id && (
                        <div className="flex gap-2 mt-2.5">
                          <textarea
                            rows={2}
                            autoFocus
                            placeholder="Nhập nội dung trả lời..."
                            value={replyInput}
                            onChange={(e) => setReplyInput(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-sm px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                          />
                          <div className="flex flex-col gap-1.5">
                            <button
                              onClick={() => handleSendReply(c._id)}
                              disabled={replySending || !replyInput.trim()}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-sm text-[12.5px] font-medium transition disabled:bg-gray-200 disabled:text-gray-400"
                            >
                              {replySending ? "..." : "Gửi"}
                            </button>
                            <button
                              onClick={() => setReplyingId(null)}
                              className="border border-gray-200 text-gray-500 px-3 py-1.5 rounded-sm text-[12.5px] hover:bg-gray-50 transition"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Phản hồi của quản trị viên */}
                      {c.reply?.content && (
                        <div className="flex gap-2.5 mt-2.5 ml-4">
                          <CornerDownRight className="w-4 h-4 text-gray-300 shrink-0 mt-2" />
                          <div className="flex-1 bg-red-50/60 border border-red-100 rounded-xl px-4 py-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-red-600">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {c.reply.adminName}
                                <span className="text-[10.5px] font-medium bg-red-100 text-red-500 px-1.5 py-0.5 rounded">
                                  Quản trị viên
                                </span>
                              </span>
                              {c.reply.createdAt && (
                                <span className="text-[11.5px] text-gray-400">{fmtDateTime(c.reply.createdAt)}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mt-1 leading-relaxed whitespace-pre-line">{c.reply.content}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bài viết khác */}
        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="text-[17px] font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Newspaper className="w-4.5 h-4.5 text-red-500" />
              Bài viết khác
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((r) => (
                <Link
                  key={r._id}
                  href={`/tintuc/${r.slug}`}
                  className="group bg-white border border-gray-100 rounded-sm overflow-hidden hover:shadow-md hover:border-gray-200 transition-all flex no-underline"
                >
                  <div className="w-[110px] shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {r.thumbnail ? (
                      <img src={r.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <div className="p-3.5 min-w-0">
                    <h3 className="text-[13.5px] font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-[11.5px] text-gray-400 mt-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {fmtDate(r.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/tintuc"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition no-underline"
          >
            <ArrowLeft className="w-4 h-4" /> Xem tất cả tin tức
          </Link>
        </div>
      </article>
    </div>
  );
}
