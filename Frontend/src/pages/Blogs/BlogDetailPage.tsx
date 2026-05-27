import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  CalendarDays, 
  Clock3, 
  Bookmark, 
  Link as LinkIcon,
  ChevronRight,
  ArrowUp,
  Heart,
  Send,
  Loader2,
  BookOpen,
  Image as ImageIcon,
  X,
  MessageSquare,
  Trash2,
  ThumbsUp,
  AlertCircle
} from "lucide-react";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import apiClient from "@/utils/api.service";
import { authService } from "@/services/auth.service";
import { MiniProfileModal } from "@/components/social/MiniProfileModal";

type Author = {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  description?: string;
};

type CommentUser = {
  _id: string;
  name: string;
  avatarUrl?: string;
};

type BlogReply = {
  _id: string;
  user: CommentUser;
  text: string;
  image?: string;
  createdAt: string;
};

type BlogComment = {
  _id: string;
  user: CommentUser;
  text: string;
  image?: string;
  likes: string[];
  replies: BlogReply[];
  createdAt: string;
};

type Blog = {
  _id: string;
  title: string;
  content: string;
  category: string;
  image?: string;
  images?: string[];
  author: Author;
  likes: string[];
  comments: BlogComment[];
  createdAt: string;
  views: number;
};

export default function BlogDetailPage() {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser._id || currentUser.id || "";
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [commentText, setCommentText] = useState("");
  const [commentImage, setCommentImage] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [activeImage, setActiveImage] = useState<string>("");

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/blogs/${blogId}`);
      setBlog(res.data.blog);
      if (res.data.blog.images && res.data.blog.images.length > 0) {
        setActiveImage(res.data.blog.images[0]);
      } else if (res.data.blog.image) {
        setActiveImage(res.data.blog.image);
      }
    } catch (error) {
      toast.error("Could not find this story.");
      navigate("/feeds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlog();
    window.scrollTo(0, 0);
  }, [blogId]);

  const handleReportSubmit = async () => {
    if (!reportReason.trim()) return;
    try {
      setReporting(true);
      await apiClient.post(`/blogs/${blogId}/report`, { reason: reportReason });
      toast.success("Thank you. The report has been submitted to the admin for review.");
      setReportModalOpen(false);
      setReportReason("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit report.");
    } finally {
      setReporting(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > window.innerHeight);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleInteraction = (action: () => void) => {
    if (!isLoggedIn) {
      toast.error("Join the community to interact", {
        style: { borderRadius: '20px', background: '#2C2418', color: '#fff' },
        icon: '🔒'
      });
      return;
    }
    action();
  };

  const toggleLike = () => handleInteraction(async () => {
    try {
      const res = await apiClient.post(`/blogs/${blogId}/like`);
      setBlog(prev => prev ? { ...prev, likes: res.data.likes } : null);
      
      const isNowLiked = res.data.likes.includes(currentUserId);
      if (isNowLiked) toast.success("Article appreciated!");
    } catch (error) {
      toast.error("Could not update appreciation.");
    }
  });

  const toggleBookmark = () => handleInteraction(() => {
    toast.success("Feature coming soon: Saved to your archives");
  });

  const handleImageUpload = async (file: File, type: 'comment' | 'reply') => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Portrait too heavy. Limit is 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      const { url } = await authService.generalUpload(file);
      if (type === 'comment') setCommentImage(url);
      else setReplyImage(url);
      toast.success("Portrait captured.");
    } catch {
      toast.error("Failed to secure image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    handleInteraction(async () => {
      try {
        setCommentLoading(true);
        const res = await apiClient.post(`/blogs/${blogId}/comment`, { 
          text: commentText,
          image: commentImage 
        });
        setBlog(prev => prev ? { ...prev, comments: res.data.comments } : null);
        setCommentText("");
        setCommentImage("");
        toast.success("Perspective shared!");
      } catch (error) {
        toast.error("Communication failure.");
      } finally {
        setCommentLoading(false);
      }
    });
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!replyText.trim()) return;

    handleInteraction(async () => {
      try {
        setCommentLoading(true);
        const res = await apiClient.post(`/blogs/${blogId}/comment/${commentId}/reply`, { 
          text: replyText,
          image: replyImage
        });
        setBlog(prev => prev ? { ...prev, comments: res.data.comments } : null);
        setReplyText("");
        setReplyImage("");
        setReplyingTo(null);
        toast.success("Perspective responded!");
      } catch (error) {
        toast.error("Communication failure.");
      } finally {
        setCommentLoading(false);
      }
    });
  };

  const handleCommentLike = (commentId: string) => handleInteraction(async () => {
    try {
      const res = await apiClient.post(`/blogs/${blogId}/comment/${commentId}/like`);
      setBlog(prev => prev ? { ...prev, comments: res.data.comments } : null);
    } catch (error) {
      toast.error("Could not update appreciation.");
    }
  });

  const handleCommentDelete = (commentId: string) => handleInteraction(async () => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await apiClient.delete(`/blogs/${blogId}/comment/${commentId}`);
      setBlog(prev => prev ? { ...prev, comments: res.data.comments } : null);
      toast.success("Comment removed.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not delete comment.");
    }
  });

  if (loading || !blog) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCF9F5]">
       <Loader2 className="w-12 h-12 animate-spin text-caramel" />
    </div>
  );

  const isLiked = blog.likes.includes(currentUserId);

  return (
    <div className="min-h-screen bg-[#FCF9F5] pb-24">
      <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-caramel z-[60] origin-left" style={{ scaleX }} />

      <div className="max-w-4xl mx-auto px-6 pt-12">
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted mb-8">
          <Link to="/feeds" className="hover:text-caramel transition-colors">Feeds</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-caramel">{blog.category}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="line-clamp-1 opacity-50">{blog.title}</span>
        </nav>

        <header className="mb-16">
          <h1 className="text-5xl md:text-7xl font-serif font-bold italic text-ink leading-[1.1] mb-8 tracking-tight">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 mb-12">
            <div 
              onClick={() => setSelectedUserId(blog.author._id)}
              className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full border border-sand shadow-sm cursor-pointer hover:border-caramel/40 hover:bg-warm/10 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-warm overflow-hidden border border-sand/40">
                {blog.author.avatarUrl ? (
                   <img src={blog.author.avatarUrl} alt={blog.author.name} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-caramel-dark font-bold text-xs">{blog.author.name[0]}</div>
                )}
              </div>
              <span className="text-sm font-bold text-ink">{blog.author.name}</span>
            </div>
            
            <div className="flex items-center gap-5 text-sm font-bold text-muted/50 uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                {new Date(blog.createdAt).toLocaleDateString()}
              </span>
              <span className="w-1 h-1 bg-sand/60 rounded-full" />
              <span className="flex items-center gap-2">
                <Clock3 className="w-4 h-4" />
                {Math.ceil(blog.content.length / 500) + 1} min read
              </span>
              {isLoggedIn && (
                <>
                  <span className="w-1 h-1 bg-sand/60 rounded-full lg:hidden" />
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors lg:hidden normal-case font-bold"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Report
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative aspect-[16/9] rounded-[3.5rem] overflow-hidden shadow-2xl shadow-ink/10 border-[12px] border-white ring-1 ring-sand/50">
              {activeImage ? (
                  <img src={activeImage} alt={blog.title} className="w-full h-full object-cover transition-all duration-500" />
              ) : blog.image ? (
                  <img src={blog.image} alt={blog.title} className="w-full h-full object-cover transition-all duration-500" />
              ) : (
                  <div className="w-full h-full bg-warm flex items-center justify-center text-muted/20">
                      <BookOpen className="w-24 h-24" />
                  </div>
              )}
            </div>

            {blog.images && blog.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-sand">
                {blog.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-24 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImage === img ? "border-caramel scale-105 shadow-md" : "border-sand/40 hover:border-sand hover:scale-102"
                    }`}
                  >
                    <img src={img} alt={`thumbnail-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[80px_1fr] gap-12 relative">
          <aside className="hidden lg:block">
            <div className="sticky top-32 flex flex-col items-center gap-8">
              <div className="flex flex-col items-center gap-3">
                <button 
                  disabled={loading}
                  onClick={toggleLike}
                  className={`w-14 h-14 rounded-full border-2 grid place-items-center transition-all shadow-xl active:scale-90 ${
                    isLiked ? "bg-rust border-rust text-white shadow-rust/20" : "bg-white border-sand/40 text-muted hover:text-rust hover:border-rust"
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? "fill-white" : ""}`} />
                </button>
                <span className="text-[11px] font-bold text-ink/40 uppercase tracking-[0.2em]">{blog.likes.length}</span>
              </div>

              <button 
                onClick={toggleBookmark}
                className="w-14 h-14 rounded-full border-2 bg-white border-sand/40 text-muted hover:text-caramel hover:border-caramel grid place-items-center transition-all shadow-xl active:scale-90"
              >
                <Bookmark className="w-6 h-6" />
              </button>
              
              <div className="h-px bg-sand/40 w-8" />
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link archived to clipboard!");
                }}
                className="w-14 h-14 rounded-full bg-white border-2 border-sand/40 grid place-items-center text-muted hover:text-ink hover:border-ink transition-all shadow-xl active:scale-90"
              >
                <LinkIcon className="w-6 h-6" />
              </button>

              {isLoggedIn && (
                <>
                  <div className="h-px bg-sand/40 w-8" />
                  <button 
                    onClick={() => setReportModalOpen(true)}
                    className="w-14 h-14 rounded-full bg-white border-2 border-sand/40 grid place-items-center text-muted hover:text-red-500 hover:border-red-500 transition-all shadow-xl active:scale-90"
                    title="Report post"
                  >
                    <AlertCircle className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </aside>

          <article className="min-w-0">
            <div 
              className="article-content prose-lg font-serif italic text-2xl text-ink/80 leading-[1.6] whitespace-pre-wrap
                [&_h3]:text-4xl [&_h3]:font-bold [&_h3]:text-ink [&_h3]:mt-16 [&_h3]:mb-8 [&_h3]:not-italic
                [&_p]:mb-8
                [&_.pull-quote]:py-16 [&_.pull-quote]:px-10 [&_.pull-quote]:my-16 
                [&_.pull-quote]:border-y-2 [&_.pull-quote]:border-sand/40 
                [&_.pull-quote]:font-serif [&_.pull-quote]:italic [&_.pull-quote]:text-4xl 
                [&_.pull-quote]:text-center [&_.pull-quote]:text-ink [&_.pull-quote]:bg-warm/5
                [&_.context-cta]:bg-ink [&_.context-cta]:p-12 [&_.context-cta]:rounded-[3rem] 
                [&_.context-cta]:text-white [&_.context-cta]:my-20 [&_.context-cta]:shadow-2xl shadow-ink/20
                [&_img]:max-w-full [&_img]:rounded-3xl [&_img]:my-12 [&_img]:shadow-xl"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            <div className="my-24 pt-16 border-t border-sand/40">
              <div id="comments" className="space-y-16">
                <h3 className="text-3xl font-serif font-bold italic text-ink flex items-center gap-4">
                  Comment
                  <span className="px-4 py-1 bg-warm text-caramel rounded-full text-base italic">{blog.comments.length}</span>
                </h3>

                {isLoggedIn ? (
                  <form onSubmit={handleCommentSubmit} className="flex gap-6 items-start">
                    <div className="w-14 h-14 rounded-2xl bg-warm flex items-center justify-center text-xs font-bold flex-shrink-0 animate-pulse border border-sand">
                       {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover rounded-2xl" /> : currentUser.name?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1 relative">
                      <textarea 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Share your perspective..."
                        className="w-full bg-white border-2 border-sand/30 p-6 pr-20 rounded-[2rem] focus:border-caramel/50 outline-none transition-all min-h-[140px] text-muted font-medium italic shadow-inner"
                      />
                      
                      {/* Image Preview */}
                      {commentImage && (
                        <div className="mt-4 relative inline-block">
                          <img src={commentImage} className="max-h-40 rounded-xl border border-sand shadow-sm" />
                          <button 
                            type="button" 
                            onClick={() => setCommentImage("")}
                            className="absolute -top-2 -right-2 bg-rust text-white p-1 rounded-full shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className="absolute bottom-6 right-6 flex items-center gap-3">
                        <label className="p-3.5 rounded-full border border-sand bg-white text-muted hover:text-caramel hover:border-caramel transition-all cursor-pointer">
                          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, 'comment');
                            }} 
                          />
                        </label>
                        <button 
                          type="submit"
                          disabled={commentLoading || isUploading}
                          className="bg-ink hover:bg-caramel text-white p-3.5 rounded-full shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                        >
                          {commentLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="bg-warm/10 rounded-[3rem] p-16 text-center border-2 border-dashed border-sand/50">
                    <p className="text-xl font-serif italic text-ink mb-6">Want to lend your voice?</p>
                    <Link to="/login" className="inline-flex bg-ink text-white px-10 py-4 rounded-full font-bold hover:bg-caramel transition-all shadow-xl shadow-ink/10">
                      Sign in to Participate
                    </Link>
                  </div>
                )}

                <div className="space-y-12">
                  {blog.comments.map(comment => (
                    <div key={comment._id} className="space-y-6">
                      <div className="flex gap-6 group">
                        <div 
                          onClick={() => setSelectedUserId(comment.user._id)}
                          className="w-14 h-14 rounded-2xl bg-warm flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:scale-110 transition-transform overflow-hidden border border-sand cursor-pointer"
                        >
                           {comment.user.avatarUrl ? <img src={comment.user.avatarUrl} className="w-full h-full object-cover" /> : comment.user.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <span 
                              onClick={() => setSelectedUserId(comment.user._id)}
                              className="font-bold text-ink text-sm cursor-pointer hover:text-caramel transition-colors"
                            >
                              {comment.user.name}
                            </span>
                            <span className="text-[10px] text-muted/40 font-bold uppercase tracking-widest">{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-lg text-muted/70 leading-relaxed font-medium italic whitespace-pre-wrap">{comment.text}</p>
                          
                          {comment.image && (
                            <img src={comment.image} className="mt-4 max-w-md rounded-2xl border border-sand shadow-md" alt="Comment attachment" />
                          )}

                          <div className="flex gap-6 mt-4 items-center">
                            <button 
                              onClick={() => handleCommentLike(comment._id)}
                              className={`text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${
                                comment.likes?.includes(currentUserId) 
                                  ? "text-caramel" 
                                  : "text-muted hover:text-caramel"
                              }`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${comment.likes?.includes(currentUserId) ? "fill-caramel" : ""}`} />
                              {comment.likes?.length > 0 && <span>{comment.likes.length}</span>}
                              Like
                            </button>
                            <button 
                              onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                              className="text-[10px] font-bold text-muted hover:text-caramel uppercase tracking-widest transition-colors flex items-center gap-2"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Reply
                              {comment.replies?.length > 0 && <span className="text-caramel">({comment.replies.length})</span>}
                            </button>
                            {(comment.user._id === currentUserId || currentUser.role === 'admin') && (
                              <button 
                                onClick={() => handleCommentDelete(comment._id)}
                                className="text-[10px] font-bold text-muted hover:text-rust uppercase tracking-widest transition-colors flex items-center gap-2"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            )}
                          </div>

                          {/* Reply Input Form */}
                          {replyingTo === comment._id && (
                             <div className="mt-6 flex gap-4 items-start animate-in fade-in slide-in-from-top-4 duration-300">
                               <div className="w-10 h-10 rounded-xl bg-warm flex items-center justify-center text-[10px] font-bold flex-shrink-0 border border-sand">
                                  {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover rounded-xl" /> : currentUser.name?.[0].toUpperCase()}
                               </div>
                               <div className="flex-1 relative">
                                  <textarea 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={`Reply to ${comment.user.name}...`}
                                    className="w-full bg-white border-2 border-sand/30 p-4 pr-16 rounded-2xl focus:border-caramel/50 outline-none transition-all min-h-[100px] text-sm font-medium italic"
                                  />
                                  
                                  {replyImage && (
                                    <div className="mt-2 relative inline-block">
                                      <img src={replyImage} className="max-h-24 rounded-lg border border-sand" />
                                      <button onClick={() => setReplyImage("")} className="absolute -top-2 -right-2 bg-rust text-white p-0.5 rounded-full shadow-lg"> <X className="w-3 h-3" /> </button>
                                    </div>
                                  )}

                                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                     <label className="p-2 rounded-full border border-sand bg-white text-muted hover:text-caramel cursor-pointer">
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], 'reply')} />
                                     </label>
                                     <button 
                                       onClick={() => handleReplySubmit(comment._id)}
                                       disabled={commentLoading || isUploading || !replyText.trim()}
                                       className="bg-ink hover:bg-caramel text-white p-2.5 rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-50"
                                     >
                                        <Send className="w-4 h-4" />
                                     </button>
                                  </div>
                               </div>
                             </div>
                          )}
                        </div>
                      </div>

                      {/* Render Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-20 space-y-8 border-l-2 border-sand/30 pl-8">
                           {comment.replies.map(reply => (
                             <div key={reply._id} className="flex gap-4 group/reply">
                                <div 
                                  onClick={() => setSelectedUserId(reply.user._id)}
                                  className="w-10 h-10 rounded-xl bg-warm flex items-center justify-center text-[10px] font-bold flex-shrink-0 border border-sand overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                                >
                                   {reply.user.avatarUrl ? <img src={reply.user.avatarUrl} className="w-full h-full object-cover" /> : reply.user.name[0].toUpperCase()}
                                </div>
                                <div className="flex-1">
                                   <div className="flex items-center justify-between mb-2">
                                      <span 
                                        onClick={() => setSelectedUserId(reply.user._id)}
                                        className="font-bold text-ink text-xs cursor-pointer hover:text-caramel transition-colors"
                                      >
                                        {reply.user.name}
                                      </span>
                                      <span className="text-[8px] text-muted/40 font-bold uppercase tracking-widest">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                   </div>
                                   <p className="text-base text-muted/70 leading-relaxed font-medium italic">{reply.text}</p>
                                   {reply.image && (
                                      <img src={reply.image} className="mt-3 max-w-sm rounded-xl border border-sand shadow-sm" alt="Reply attachment" />
                                   )}
                                </div>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-12 right-12 w-16 h-16 bg-ink text-white rounded-full flex items-center justify-center shadow-2xl z-50 hover:bg-caramel transition-all active:scale-90"
          >
            <ArrowUp className="w-7 h-7" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {reportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportModalOpen(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden bg-white border border-sand/50 shadow-2xl rounded-[2.5rem] p-8 z-10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold italic text-ink">Report Journal Entry</h3>
                  <p className="text-xs text-muted/50 font-medium">Help keep our community safe and high-quality.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink/75 uppercase tracking-wider mb-2">
                    Reason for reporting
                  </label>
                  <textarea
                    rows={4}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Provide a detailed explanation of why this post violates community guidelines (e.g. spam, inappropriate behavior, harassment, etc.)."
                    className="w-full px-4 py-3 bg-[#FBF9F2] border border-sand/50 rounded-2xl text-sm focus:outline-none focus:border-caramel/50 resize-none font-sans"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="flex-1 px-5 py-3 border border-sand text-ink text-sm font-bold rounded-2xl hover:bg-[#FBF9F2] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportSubmit}
                  disabled={reporting || !reportReason.trim()}
                  className="flex-1 px-5 py-3 bg-red-500 text-white text-sm font-bold rounded-2xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {reporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : "Submit Report"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mini Profile Modal */}
      <AnimatePresence>
        {selectedUserId && (
          <MiniProfileModal
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
