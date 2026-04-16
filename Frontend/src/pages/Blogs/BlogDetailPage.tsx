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
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import apiClient from "@/utils/api.service";

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

type BlogComment = {
  _id: string;
  user: CommentUser;
  text: string;
  createdAt: string;
  likes: string[];
  dislikes: string[];
  replies?: BlogComment[];
};

type Blog = {
  _id: string;
  title: string;
  content: string;
  category: string;
  image?: string;
  author: Author;
  likes: string[];
  dislikes: string[];
  comments: BlogComment[];
  createdAt: string;
  views: number;
};

type CommentItemProps = {
  comment: BlogComment;
  onLike: (commentId: string) => void;
  onDislike: (commentId: string) => void;
  onReply: (commentId: string | null) => void;
  replyingTo: string | null;
  replyText: string;
  setReplyText: (text: string) => void;
  onReplySubmit: (e: React.FormEvent) => void;
  currentUser: any;
  isLoggedIn: boolean;
  isReply?: boolean;
};

function CommentItem({ 
  comment, 
  onLike, 
  onDislike, 
  onReply, 
  replyingTo, 
  replyText, 
  setReplyText, 
  onReplySubmit,
  currentUser,
  isLoggedIn,
  isReply = false
}: CommentItemProps) {
  const isLiked = comment.likes.includes(currentUser._id);
  const isDisliked = comment.dislikes.includes(currentUser._id);

  return (
    <div className="space-y-6">
      <div className="flex gap-6 group">
        <div className="w-14 h-14 rounded-2xl bg-warm flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:scale-110 transition-transform overflow-hidden border border-sand">
          {comment.user.avatarUrl ? <img src={comment.user.avatarUrl} className="w-full h-full object-cover" /> : comment.user.name[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-ink text-sm">{comment.user.name}</span>
            <span className="text-[10px] text-muted/40 font-bold uppercase tracking-widest">{new Date(comment.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-lg text-muted/70 leading-relaxed font-medium italic whitespace-pre-wrap">{comment.text}</p>
          
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onLike(comment._id)}
                disabled={!isLoggedIn}
                className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  isLiked ? 'text-rust' : 'text-muted hover:text-rust'
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                {comment.likes.length}
              </button>
              <button 
                onClick={() => onDislike(comment._id)}
                disabled={!isLoggedIn}
                className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  isDisliked ? 'text-gray-600' : 'text-muted hover:text-gray-600'
                }`}
              >
                <ThumbsDown className="w-3 h-3" />
                {comment.dislikes.length}
              </button>
            </div>
            <button 
              onClick={() => onReply(replyingTo === comment._id ? null : comment._id)}
              className="text-[10px] font-bold text-muted hover:text-caramel uppercase tracking-widest transition-colors"
              style={{ display: isReply ? 'none' : 'inline' }}
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {replyingTo === comment._id && isLoggedIn && (
        <form onSubmit={onReplySubmit} className="ml-20 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-warm flex items-center justify-center text-xs font-bold flex-shrink-0 border border-sand">
            {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover rounded-xl" /> : currentUser.name?.[0].toUpperCase()}
          </div>
          <div className="flex-1 relative">
            <textarea 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="w-full bg-white border-2 border-sand/30 p-4 pr-16 rounded-2xl focus:border-caramel/50 outline-none transition-all min-h-[80px] text-muted font-medium italic shadow-inner"
            />
            <button 
              type="submit"
              className="absolute bottom-3 right-3 bg-ink hover:bg-caramel text-white p-2 rounded-full shadow-lg transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-20 space-y-6 border-l-2 border-sand/30 pl-6">
          {comment.replies.map(reply => (
            <CommentItem 
              key={reply._id}
              comment={reply}
              onLike={onLike}
              onDislike={onDislike}
              onReply={() => {}} // No reply for replies
              replyingTo={null}
              replyText=""
              setReplyText={() => {}}
              onReplySubmit={() => {}}
              currentUser={currentUser}
              isLoggedIn={isLoggedIn}              isReply={true}            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BlogDetailPage() {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/blogs/${blogId}`);
      setBlog(res.data.blog);
    } catch (error) {
      toast.error("Could not find this story.");
      navigate("/blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlog();
    window.scrollTo(0, 0);
  }, [blogId]);

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
      
      const isNowLiked = res.data.likes.includes(currentUser._id);
      if (isNowLiked) toast.success("Article appreciated!");
    } catch (error) {
      toast.error("Could not update appreciation.");
    }
  });

  const toggleDislike = () => handleInteraction(async () => {
    try {
      const res = await apiClient.post(`/blogs/${blogId}/dislike`);
      setBlog(prev => prev ? { ...prev, dislikes: res.data.dislikes } : null);
      
      const isNowDisliked = res.data.dislikes.includes(currentUser._id);
      if (isNowDisliked) toast.success("Feedback noted!");
    } catch (error) {
      toast.error("Could not update feedback.");
    }
  });

  const toggleBookmark = () => handleInteraction(() => {
    toast.success("Feature coming soon: Saved to your archives");
  });

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    handleInteraction(async () => {
      try {
        setCommentLoading(true);
        const res = await apiClient.post(`/blogs/${blogId}/comment`, { text: commentText });
        setBlog(prev => prev ? { ...prev, comments: res.data.comments } : null);
        setCommentText("");
        toast.success("Perspective shared!");
      } catch (error) {
        toast.error("Communication failure.");
      } finally {
        setCommentLoading(false);
      }
    });
  };

  const toggleCommentLike = (commentId: string) => handleInteraction(async () => {
    try {
      const res = await apiClient.post(`/blogs/${blogId}/comments/${commentId}/like`);
      setBlog(prev => prev ? { ...prev, comments: res.data.comments } : null);
    } catch (error) {
      toast.error("Could not update reaction.");
    }
  });

  const toggleCommentDislike = (commentId: string) => handleInteraction(async () => {
    try {
      const res = await apiClient.post(`/blogs/${blogId}/comments/${commentId}/dislike`);
      setBlog(prev => prev ? { ...prev, comments: res.data.comments } : null);
    } catch (error) {
      toast.error("Could not update reaction.");
    }
  });

  const handleReplySubmit = async (commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    handleInteraction(async () => {
      try {
        const res = await apiClient.post(`/blogs/${blogId}/comments/${commentId}/reply`, { text: replyText });
        setBlog(prev => prev ? { ...prev, comments: res.data.comments } : null);
        setReplyText("");
        setReplyingTo(null);
        toast.success("Reply added!");
      } catch (error) {
        toast.error("Reply failed.");
      }
    });
  };

  if (loading || !blog) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCF9F5]">
       <Loader2 className="w-12 h-12 animate-spin text-caramel" />
    </div>
  );

  const isLiked = blog.likes.includes(currentUser._id);
  const isDisliked = blog.dislikes.includes(currentUser._id);

  return (
    <div className="min-h-screen bg-[#FCF9F5] pb-24">
      <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-caramel z-[60] origin-left" style={{ scaleX }} />

      <div className="max-w-4xl mx-auto px-6 pt-12">
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted mb-8">
          <Link to="/blogs" className="hover:text-caramel transition-colors">Journal</Link>
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
            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full border border-sand shadow-sm">
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
            </div>
          </div>

          <div className="relative aspect-[16/9] rounded-[3.5rem] overflow-hidden shadow-2xl shadow-ink/10 border-[12px] border-white ring-1 ring-sand/50">
            {blog.image ? (
                <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-warm flex items-center justify-center text-muted/20">
                    <BookOpen className="w-24 h-24" />
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

              <div className="flex flex-col items-center gap-3">
                <button 
                  disabled={loading}
                  onClick={toggleDislike}
                  className={`w-14 h-14 rounded-full border-2 grid place-items-center transition-all shadow-xl active:scale-90 ${
                    isDisliked ? "bg-gray-600 border-gray-600 text-white shadow-gray-600/20" : "bg-white border-sand/40 text-muted hover:text-gray-600 hover:border-gray-600"
                  }`}
                >
                  <ThumbsDown className={`w-6 h-6 ${isDisliked ? "fill-white" : ""}`} />
                </button>
                <span className="text-[11px] font-bold text-ink/40 uppercase tracking-[0.2em]">{blog.dislikes.length}</span>
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
                [&_.context-cta]:text-white [&_.context-cta]:my-20 [&_.context-cta]:shadow-2xl shadow-ink/20"
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
                      <button 
                        type="submit"
                        disabled={commentLoading}
                        className="absolute bottom-6 right-6 bg-ink hover:bg-caramel text-white p-3.5 rounded-full shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                      >
                        {commentLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
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
                    <CommentItem 
                      key={comment._id} 
                      comment={comment} 
                      onLike={toggleCommentLike}
                      onDislike={toggleCommentDislike}
                      onReply={setReplyingTo}
                      replyingTo={replyingTo}
                      replyText={replyText}
                      setReplyText={setReplyText}
                      onReplySubmit={(e) => handleReplySubmit(comment._id, e)}
                      currentUser={currentUser}
                      isLoggedIn={isLoggedIn}
                    />
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
    </div>
  );
}
