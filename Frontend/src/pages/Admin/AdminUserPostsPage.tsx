import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  Heart,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import apiClient from "@/utils/api.service";
import Pagination from "@/components/common/Pagination";

type Author = {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

type BlogListItem = {
  _id: string;
  title: string;
  category: string;
  status: string;
  views: number;
  likeCount: number;
  commentCount: number;
  author: Author;
  image?: string;
  images?: string[];
  createdAt: string;
};

type CommentUser = {
  _id: string;
  name: string;
  avatarUrl?: string;
};

type BlogComment = {
  _id: string;
  text: string;
  createdAt: string;
  user: CommentUser;
  replies?: {
    _id: string;
    text: string;
    createdAt: string;
    user: CommentUser;
  }[];
};

type BlogDetail = {
  _id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  views: number;
  image?: string;
  images?: string[];
  author: Author;
  comments: BlogComment[];
  likes?: string[];
  createdAt: string;
};

const statusOptions = ["", "draft", "pending", "approved", "rejected", "hidden"];

type PostStatusSummary = {
  total: number;
  approved: number;
  pending: number;
  draft: number;
  rejected: number;
  hidden: number;
  inactive: number;
};

const defaultStatusSummary: PostStatusSummary = {
  total: 0,
  approved: 0,
  pending: 0,
  draft: 0,
  rejected: 0,
  hidden: 0,
  inactive: 0,
};

const statusClasses: Record<string, string> = {
  draft: "bg-slate-50 text-slate-600 border-slate-100",
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rejected: "bg-rose-50 text-rose-700 border-rose-100",
  hidden: "bg-ink/5 text-muted border-sand",
};

const normalizeBlogText = (html: string) =>
  html
    .replace(/\r\n|\r/g, "\n")
    .replace(/<p>\s*(?:<br\s*\/?>)?\s*<\/p>/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/li>|<\/blockquote>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\u00A0/g, " ")
    .trim();

const countPostComments = (comments: BlogComment[] = []) =>
  comments.reduce((sum, comment) => sum + 1 + (comment.replies?.length || 0), 0);

const renderCollage = (post: BlogDetail, onImageOpen: (images: string[], index: number) => void) => {
  const allImages: string[] = [];
  if (post.image) allImages.push(post.image);
  if (post.images) {
    post.images.forEach((img) => {
      if (img && img !== post.image) allImages.push(img);
    });
  }

  const count = allImages.length;
  if (count === 0) return null;

  if (count === 1) {
    return (
      <button
        type="button"
        onClick={() => onImageOpen(allImages, 0)}
        className="group relative block aspect-[16/10] w-full overflow-hidden bg-sand/10 text-left"
      >
        <img
          src={allImages[0]}
          alt={post.title}
          className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.02]"
        />
      </button>
    );
  }

  if (count === 2) {
    return (
      <div className="grid aspect-[16/10] grid-cols-2 gap-1 overflow-hidden">
        {allImages.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => onImageOpen(allImages, index)}
            className="group relative w-full overflow-hidden text-left"
          >
            <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </button>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid aspect-[16/10] grid-cols-3 gap-1 overflow-hidden">
        <button
          type="button"
          onClick={() => onImageOpen(allImages, 0)}
          className="group relative col-span-2 w-full overflow-hidden text-left"
        >
          <img src={allImages[0]} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </button>
        <div className="col-span-1 grid grid-rows-2 gap-1">
          {allImages.slice(1).map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => onImageOpen(allImages, index + 1)}
              className="group relative h-full w-full overflow-hidden text-left"
            >
              <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const remaining = count - 3;
  return (
    <div className="grid aspect-[16/10] grid-cols-3 gap-1 overflow-hidden">
      <button
        type="button"
        onClick={() => onImageOpen(allImages, 0)}
        className="group relative col-span-2 w-full overflow-hidden text-left"
      >
        <img src={allImages[0]} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      </button>
      <div className="col-span-1 grid grid-rows-2 gap-1">
        <button
          type="button"
          onClick={() => onImageOpen(allImages, 1)}
          className="group relative h-full w-full overflow-hidden text-left"
        >
          <img src={allImages[1]} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </button>
        <button
          type="button"
          onClick={() => onImageOpen(allImages, 2)}
          className="group relative h-full w-full overflow-hidden text-left"
        >
          <img src={allImages[2]} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          {remaining > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/60 text-lg font-bold text-white backdrop-blur-[2px]">
              +{remaining}
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default function AdminUserPostsPage() {
  const [posts, setPosts] = useState<BlogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detailPost, setDetailPost] = useState<BlogDetail | null>(null);
  const [commentsSort, setCommentsSort] = useState<"all" | "latest">("all");
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [statusSummary, setStatusSummary] = useState<PostStatusSummary>(defaultStatusSummary);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const pageSize = 10;

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/admin/blogs", {
        params: { page, limit: pageSize, search, status: statusFilter },
      });
      setPosts(response.data?.blogs || []);
      setTotalPages(response.data?.pagination?.pages || 1);
      setTotalPosts(response.data?.pagination?.total || 0);
      setStatusSummary({ ...defaultStatusSummary, ...(response.data?.statusSummary || {}) });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể tải danh sách bài viết.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (page === 1) fetchPosts();
      else setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const loadPostDetail = async (postId: string) => {
    setLoadingDetailId(postId);
    try {
      const response = await apiClient.get(`/admin/blogs/${postId}`);
      return response.data?.blog as BlogDetail;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể tải chi tiết bài viết.");
      return null;
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleViewPost = async (postId: string) => {
    const blog = await loadPostDetail(postId);
    if (blog) {
      setCommentsSort("all");
      setExpandedReplies([]);
      setDetailPost(blog);
    }
  };

  const closeDetail = () => {
    setDetailPost(null);
    setExpandedReplies([]);
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) =>
      prev.includes(commentId) ? prev.filter((id) => id !== commentId) : [...prev, commentId],
    );
  };

  const openImageLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeImageLightbox = () => {
    setLightboxOpen(false);
    setLightboxImages([]);
    setLightboxIndex(0);
  };

  const getPostThumbnail = (post: BlogListItem) => post.image || post.images?.[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-caramel">Community</p>
          <h1 className="font-serif text-4xl font-bold italic text-ink">User Posts</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-muted">
            Xem bài viết và bình luận giống giao diện người dùng trên feed.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchPosts}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-sand bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest text-ink shadow-sm hover:bg-warm"
        >
          <RefreshCw className="h-4 w-4 text-caramel" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total posts", value: statusSummary.total, icon: BookOpen },
          { label: "Approved", value: statusSummary.approved, icon: CheckCircle2 },
          { label: "Pending review", value: statusSummary.pending, icon: Clock3 },
          { label: "Inactive", value: statusSummary.inactive, icon: AlertTriangle },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
            <stat.icon className="mb-3 h-5 w-5 text-caramel" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">{stat.label}</p>
            <p className="mt-1 text-3xl font-black text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tiêu đề, nội dung, tác giả..."
              className="h-12 w-full rounded-xl border border-sand bg-warm/30 pl-11 pr-4 text-sm font-semibold text-ink outline-none focus:border-caramel"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-12 rounded-xl border border-sand bg-warm/30 px-3 text-sm font-semibold capitalize text-ink outline-none focus:border-caramel"
          >
            {statusOptions.map((option) => (
              <option key={option || "all"} value={option}>
                {option || "Tất cả trạng thái"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-sand bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-warm/60">
              <tr>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Bài viết</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Tác giả</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Trạng thái</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Ngày đăng</th>
                <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/40">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin text-caramel" />
                    <span className="text-xs font-black uppercase tracking-widest text-muted">Đang tải...</span>
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-xs font-black uppercase tracking-widest text-muted">
                    Không có bài viết nào.
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const thumbnail = getPostThumbnail(post);
                  const status = post.status || "draft";
                  const isLoadingRow = loadingDetailId === post._id;

                  return (
                    <tr key={post._id} className="hover:bg-warm/20">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-sand bg-warm">
                            {thumbnail ? (
                              <img src={thumbnail} alt={post.title} className="h-full w-full object-cover" />
                            ) : (
                              <BookOpen className="h-5 w-5 text-caramel" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-ink">{post.title}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{post.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-ink">{post.author?.name || "—"}</p>
                        <p className="text-xs text-muted">{post.author?.email || "—"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                            statusClasses[status] || statusClasses.draft
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-muted">
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={isLoadingRow}
                            onClick={() => handleViewPost(post._id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-sand px-3 py-2 text-xs font-bold text-ink hover:bg-warm disabled:opacity-50"
                          >
                            {isLoadingRow ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalPosts}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      {/* Modal giống feed — Comments view */}
      <AnimatePresence>
        {detailPost && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetail}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="relative z-10 flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-[2.5rem] border border-sand/50 bg-white p-4 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between gap-4 border-b border-sand/15 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted/50">Comments</p>
                  <h3 className="mt-2 font-serif text-2xl font-bold italic text-ink">{detailPost.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={closeDetail}
                  className="rounded-full p-2 text-muted transition-colors hover:bg-sand/30 hover:text-ink"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
                <div className="rounded-[2rem] border border-sand/30 bg-[#FBF9F2] p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-sand/40 bg-warm">
                      {detailPost.author?.avatarUrl ? (
                        <img src={detailPost.author.avatarUrl} alt={detailPost.author.name} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-caramel/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted/50">{detailPost.author?.name}</p>
                      <p className="mt-1 text-[11px] text-muted/50">
                        {new Date(detailPost.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted/80">
                        {normalizeBlogText(detailPost.content)}
                      </p>
                    </div>
                  </div>
                  {(detailPost.image || detailPost.images?.length) ? (
                    <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-sand/40 bg-white">
                      {renderCollage(detailPost, openImageLightbox)}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-sand/20 pt-4 text-xs font-bold uppercase tracking-widest text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-caramel" />
                      {detailPost.views} views
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Heart className="h-4 w-4 text-caramel" />
                      {detailPost.likes?.length || 0} likes
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-caramel" />
                      {countPostComments(detailPost.comments)} comments
                    </span>
                    <span
                      className={`ml-auto rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                        statusClasses[detailPost.status] || statusClasses.draft
                      }`}
                    >
                      {detailPost.status}
                    </span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[2rem] border border-sand/30 bg-white">
                  <div className="flex flex-col gap-3 border-b border-sand/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted/70">Sort by</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCommentsSort("all")}
                        className={`rounded-full px-4 py-2 text-[11px] font-bold transition-all ${
                          commentsSort === "all" ? "bg-caramel text-white" : "bg-[#FBF9F2] text-muted/80 hover:bg-[#f4e9d8]"
                        }`}
                      >
                        All Comments
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommentsSort("latest")}
                        className={`rounded-full px-4 py-2 text-[11px] font-bold transition-all ${
                          commentsSort === "latest"
                            ? "bg-caramel text-white"
                            : "bg-[#FBF9F2] text-muted/80 hover:bg-[#f4e9d8]"
                        }`}
                      >
                        Latest
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4 px-4 py-4">
                    {(detailPost.comments || []).length === 0 ? (
                      <p className="py-8 text-center text-sm font-semibold text-muted">Chưa có bình luận nào.</p>
                    ) : (
                      (detailPost.comments || [])
                        .slice()
                        .sort((a, b) =>
                          commentsSort === "all"
                            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                        )
                        .map((comment) => (
                          <div key={comment._id} className="space-y-3 rounded-[2rem] border border-sand/30 bg-[#FBF9F2] p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sand/40 bg-warm">
                                {comment.user?.avatarUrl ? (
                                  <img src={comment.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <User className="h-4 w-4 text-caramel/40" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold leading-tight text-ink">{comment.user?.name || "User"}</p>
                                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted/50">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted/80">{comment.text}</p>
                                {comment.replies && comment.replies.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleReplies(comment._id)}
                                    className="mt-3 text-[11px] font-bold text-caramel hover:text-rust"
                                  >
                                    {expandedReplies.includes(comment._id)
                                      ? `Hide replies (${comment.replies.length})`
                                      : `Show replies (${comment.replies.length})`}
                                  </button>
                                )}
                              </div>
                            </div>
                            {expandedReplies.includes(comment._id) && comment.replies && comment.replies.length > 0 && (
                              <div className="ml-12 mt-3 space-y-3 border-l-2 border-sand/40 pl-4">
                                {comment.replies.map((reply) => (
                                  <div key={reply._id} className="flex items-start gap-3 text-sm">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sand/40 bg-warm">
                                      {reply.user?.avatarUrl ? (
                                        <img src={reply.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                                      ) : (
                                        <User className="h-3.5 w-3.5 text-caramel/40" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="rounded-2xl border border-sand/30 bg-white px-3.5 py-2">
                                        <p className="font-bold leading-tight text-ink">{reply.user?.name || "User"}</p>
                                        <p className="mt-1 leading-relaxed text-muted/80">{reply.text}</p>
                                      </div>
                                      <p className="ml-1 mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-muted/50">
                                        {new Date(reply.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <div className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[3rem] bg-white shadow-2xl">
              <button
                type="button"
                onClick={closeImageLightbox}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-3 text-ink shadow-lg hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="relative flex min-h-[360px] items-center justify-center bg-black">
                <img
                  src={lightboxImages[lightboxIndex]}
                  alt="Preview"
                  className="max-h-[82vh] max-w-full object-contain"
                />
                {lightboxImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIndex((prev) => (prev === 0 ? lightboxImages.length - 1 : prev - 1))
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-3 text-ink shadow-lg hover:bg-white"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIndex((prev) => (prev === lightboxImages.length - 1 ? 0 : prev + 1))
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-3 text-ink shadow-lg hover:bg-white"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
