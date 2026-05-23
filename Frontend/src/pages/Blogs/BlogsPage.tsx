import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  Loader2, 
  BookOpen, 
  AlertCircle,
  Heart,
  MessageSquare,
  Eye,
  TrendingUp,
  Award,
  MoreHorizontal,
  Send,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Pagination from "@/components/common/Pagination";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";

type BlogReply = {
  _id: string;
  text: string;
  user: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
};

type BlogComment = {
  _id: string;
  text: string;
  user: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  replies?: BlogReply[];
  createdAt: string;
};

type BlogPost = {
  _id: string;
  title: string;
  content: string;
  category: string;
  image: string;
  images?: string[];
  likes?: string[];
  comments?: BlogComment[];
  author: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  views: number;
};

const renderCollage = (post: BlogPost) => {
  const allImages: string[] = [];
  if (post.image) allImages.push(post.image);
  if (post.images) {
    post.images.forEach(img => {
      if (img && img !== post.image) allImages.push(img);
    });
  }

  const count = allImages.length;
  if (count === 0) return null;

  if (count === 1) {
    return (
      <Link to={`/blogs/${post._id}`} className="block aspect-[16/10] overflow-hidden relative group">
        <img src={allImages[0]} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
      </Link>
    );
  }

  if (count === 2) {
    return (
      <Link to={`/blogs/${post._id}`} className="grid grid-cols-2 gap-1 aspect-[16/10] overflow-hidden">
        <div className="overflow-hidden group relative">
          <img src={allImages[0]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="overflow-hidden group relative">
          <img src={allImages[1]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
      </Link>
    );
  }

  if (count === 3) {
    return (
      <Link to={`/blogs/${post._id}`} className="grid grid-cols-3 gap-1 aspect-[16/10] overflow-hidden">
        <div className="col-span-2 overflow-hidden group relative">
          <img src={allImages[0]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="col-span-1 grid grid-rows-2 gap-1">
          <div className="overflow-hidden group relative h-full">
            <img src={allImages[1]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </div>
          <div className="overflow-hidden group relative h-full">
            <img src={allImages[2]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </div>
        </div>
      </Link>
    );
  }

  // 4 or more images
  const remaining = count - 3;
  return (
    <Link to={`/blogs/${post._id}`} className="grid grid-cols-3 gap-1 aspect-[16/10] overflow-hidden">
      <div className="col-span-2 overflow-hidden group relative">
        <img src={allImages[0]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      </div>
      <div className="col-span-1 grid grid-rows-2 gap-1">
        <div className="overflow-hidden group relative h-full">
          <img src={allImages[1]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="overflow-hidden group relative h-full">
          <img src={allImages[2]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          {remaining > 0 && (
            <div className="absolute inset-0 bg-ink/60 flex items-center justify-center text-white font-bold text-lg backdrop-blur-[2px]">
              +{remaining}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default function BlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 6;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [trendingPosts, setTrendingPosts] = useState<BlogPost[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);

  // Liking & commenting states
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [submittingComments, setSubmittingComments] = useState<{ [key: string]: boolean }>({});

  // Comments load-more states
  const [visibleCommentsCount, setVisibleCommentsCount] = useState<{ [postId: string]: number }>({});
  // Comment replies states
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});
  const [submittingReplies, setSubmittingReplies] = useState<{ [commentId: string]: boolean }>({});

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser._id || currentUser.id || "";

  const handleReplySubmit = async (postId: string, commentId: string) => {
    if (!isLoggedIn) {
      toast.error("Please log in to reply.");
      return;
    }
    const text = replyInputs[commentId] || "";
    if (!text.trim()) return;

    try {
      setSubmittingReplies(prev => ({ ...prev, [commentId]: true }));
      const res = await apiClient.post(`/blogs/${postId}/comment/${commentId}/reply`, { text });
      
      setPosts(prev => 
        prev.map(post => 
          post._id === postId ? { ...post, comments: res.data.comments } : post
        )
      );
      
      setReplyInputs(prev => ({ ...prev, [commentId]: "" }));
      setReplyingCommentId(null);
      toast.success("Reply posted!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to post reply.");
    } finally {
      setSubmittingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handleLikeToggle = async (postId: string) => {
    if (!isLoggedIn) {
      toast.error("Please log in to like posts.");
      return;
    }
    try {
      const res = await apiClient.post(`/blogs/${postId}/like`);
      setPosts(prev => 
        prev.map(post => 
          post._id === postId ? { ...post, likes: res.data.likes } : post
        )
      );
    } catch (error) {
      toast.error("Could not update appreciation.");
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!isLoggedIn) {
      toast.error("Please log in to comment.");
      return;
    }
    const text = commentInputs[postId] || "";
    if (!text.trim()) return;

    try {
      setSubmittingComments(prev => ({ ...prev, [postId]: true }));
      const res = await apiClient.post(`/blogs/${postId}/comment`, { text });
      
      setPosts(prev => 
        prev.map(post => 
          post._id === postId ? { ...post, comments: res.data.comments } : post
        )
      );
      
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      toast.success("Comment posted!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to post comment.");
    } finally {
      setSubmittingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const fetchBlogs = async (page: number, cat: string | null = selectedCategory) => {
    try {
      setLoading(true);
      let url = `/blogs?page=${page}&limit=${pageSize}`;
      if (cat) url += `&category=${encodeURIComponent(cat)}`;
      const res = await apiClient.get(url);
      setPosts(res.data.blogs || []);
      setTotal(res.data.pagination.total || 0);
    } catch (error) {
      toast.error("Could not fetch the journal.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      setTrendingLoading(true);
      const res = await apiClient.get("/blogs/hot");
      setTrendingPosts(res.data.blogs || []);
    } catch (error) {
      console.error("Could not fetch trending blogs:", error);
    } finally {
      setTrendingLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(currentPage, selectedCategory);
  }, [currentPage, selectedCategory]);

  useEffect(() => {
    fetchTrending();
  }, []);

  const handleReportSubmit = async () => {
    if (!reportReason.trim() || !selectedPostId) return;
    try {
      setReporting(true);
      await apiClient.post(`/blogs/${selectedPostId}/report`, { reason: reportReason });
      toast.success("Thank you. The report has been submitted to the admin for review.");
      setReportModalOpen(false);
      setReportReason("");
      setSelectedPostId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit report.");
    } finally {
      setReporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-screen bg-[#FBF9F2] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        
        {/* Header Title */}
        <div className="mb-10 text-center lg:text-left">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-caramel">Pet Social & Journal</p>
          <h1 className="font-serif text-5xl font-bold italic text-ink tracking-tight">Community Feed</h1>
          <p className="max-w-xl text-xs text-muted/60 font-medium leading-relaxed mt-2 mx-auto lg:mx-0">
            Share stories, moments, and tips about your pet companionship. Engage with other pet parents!
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Feed (Left) */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-32 bg-white rounded-[2.5rem] border border-sand/50 shadow-sm">
                 <Loader2 className="w-10 h-10 animate-spin text-caramel mb-4" />
                 <p className="text-sm font-medium text-muted italic">Consulting the archives...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center p-24 bg-white rounded-[2.5rem] border border-sand/50 shadow-sm">
                 <BookOpen className="w-14 h-14 text-muted/20 mx-auto mb-5" />
                 <h2 className="text-2xl font-serif font-bold italic text-ink mb-2">Feed is Silent</h2>
                 <p className="text-xs text-muted/50 max-w-xs mx-auto">There are no approved articles to display at this moment.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <article key={post._id} className="bg-white rounded-[2rem] border border-sand/50 shadow-sm overflow-hidden flex flex-col hover:border-caramel/20 transition-all duration-300">
                    
                    {/* Card Header */}
                    <div className="p-5 flex items-center justify-between border-b border-sand/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-warm overflow-hidden border border-sand/40 flex items-center justify-center shrink-0">
                          {post.author.avatarUrl ? (
                            <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-caramel/40" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ink leading-tight">{post.author.name}</p>
                          <div className="flex items-center gap-1.5 text-[9px] text-muted/50 font-bold uppercase tracking-wider mt-0.5">
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            <span>&bull;</span>
                            <span className="text-caramel">{post.category}</span>
                          </div>
                        </div>
                      </div>

                      {isLoggedIn && (
                        <button 
                          onClick={() => {
                            setSelectedPostId(post._id);
                            setReportModalOpen(true);
                          }}
                          className="text-muted/40 hover:text-red-500 hover:bg-rose-50 p-2 rounded-full transition-colors"
                          title="Report post"
                        >
                          <MoreHorizontal className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      <Link to={`/blogs/${post._id}`} className="block group">
                        <h3 className="font-serif text-xl font-bold italic text-ink group-hover:text-caramel transition-colors leading-tight">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="text-muted/70 text-xs leading-relaxed font-medium">
                        {post.content.replace(/<[^>]*>/g, '').substring(0, 180)}
                        {post.content.replace(/<[^>]*>/g, '').length > 180 && (
                          <Link to={`/blogs/${post._id}`} className="text-caramel hover:text-rust font-bold ml-1 hover:underline">
                            ... Read More
                          </Link>
                        )}
                      </p>
                    </div>

                    {/* Card Media Collage */}
                    <div className="border-t border-b border-sand/15 overflow-hidden bg-[#FBF9F2]/30">
                      {renderCollage(post)}
                    </div>

                    {/* Interactive Action Bar */}
                    <div className="px-5 py-4 flex items-center justify-between text-[10px] text-muted/60 font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-5">
                        <button 
                          onClick={() => handleLikeToggle(post._id)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            post.likes?.includes(currentUserId) 
                              ? "text-red-500 hover:text-red-600" 
                              : "text-muted/60 hover:text-red-500"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${post.likes?.includes(currentUserId) ? "fill-current text-red-500" : "text-muted/40"}`} />
                          <span>{post.likes?.length || 0} Likes</span>
                        </button>
                        <Link to={`/blogs/${post._id}`} className="flex items-center gap-1.5 hover:text-caramel transition-colors">
                          <MessageSquare className="w-4 h-4 text-muted/40 hover:text-caramel" />
                          <span>{post.comments?.length || 0} Comments</span>
                        </Link>
                        <button 
                          onClick={() => {
                            const postUrl = `${window.location.origin}/blogs/${post._id}`;
                            navigator.clipboard.writeText(postUrl);
                            toast.success("Link archived to clipboard!");
                          }}
                          className="flex items-center gap-1.5 hover:text-ink transition-colors"
                          title="Share post link"
                        >
                          <Share2 className="w-4 h-4 text-muted/40 hover:text-ink" />
                          <span>Share</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{post.views} views</span>
                      </div>
                    </div>

                    {/* Inline Comments Section */}
                    {post.comments && post.comments.length > 0 && (() => {
                      const visibleCount = visibleCommentsCount[post._id] || 5;
                      return (
                        <div className="px-5 pb-4 pt-3 border-t border-sand/10 space-y-3 bg-[#FBF9F2]/20">
                          <p className="text-[9px] font-bold text-muted/40 uppercase tracking-wider">Comments</p>
                          <div className="space-y-3">
                            {post.comments.slice(0, visibleCount).map((comment) => (
                              <div key={comment._id} className="space-y-2">
                                <div className="flex gap-2.5 items-start text-xs">
                                  <div className="w-7 h-7 rounded-full bg-warm border border-sand/40 overflow-hidden flex items-center justify-center shrink-0 mt-0.5">
                                    {comment.user?.avatarUrl ? (
                                      <img src={comment.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <User className="w-3.5 h-3.5 text-caramel/40" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="bg-[#FBF9F2] border border-sand/40 rounded-2xl px-3.5 py-2 inline-block max-w-full">
                                      <p className="font-bold text-ink leading-tight mb-0.5">{comment.user?.name || "User"}</p>
                                      <p className="text-muted/80 leading-relaxed font-medium break-words">{comment.text}</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-[8px] text-muted/40 font-bold uppercase tracking-wider mt-1 ml-2">
                                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                                      {isLoggedIn && (
                                        <button 
                                          type="button"
                                          onClick={() => setReplyingCommentId(comment._id === replyingCommentId ? null : comment._id)}
                                          className="text-caramel hover:underline cursor-pointer"
                                        >
                                          Reply
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Replies list */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="ml-9 pl-4 border-l-2 border-sand/35 space-y-2">
                                    {comment.replies.map((reply) => (
                                      <div key={reply._id} className="flex gap-2 items-start text-xs">
                                        <div className="w-6 h-6 rounded-full bg-warm border border-sand/35 overflow-hidden flex items-center justify-center shrink-0 mt-0.5">
                                          {reply.user?.avatarUrl ? (
                                            <img src={reply.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            <User className="w-3 h-3 text-caramel/40" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="bg-[#FBF9F2]/70 border border-sand/30 rounded-xl px-3 py-1.5 inline-block max-w-full">
                                            <p className="font-bold text-ink leading-tight mb-0.5">{reply.user?.name || "User"}</p>
                                            <p className="text-muted/80 leading-relaxed font-medium break-words">{reply.text}</p>
                                          </div>
                                          <p className="text-[7.5px] text-muted/40 font-bold uppercase tracking-wider mt-0.5 ml-1">
                                            {new Date(reply.createdAt).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Inline reply input */}
                                {replyingCommentId === comment._id && (
                                  <div className="ml-9 pl-4 border-l-2 border-sand/35">
                                    <form 
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        handleReplySubmit(post._id, comment._id);
                                      }}
                                      className="flex items-center gap-2.5 bg-[#FBF9F2]/50 border border-sand/40 rounded-xl px-3 py-1.5 hover:border-caramel/30 focus-within:border-caramel/45 focus-within:bg-white transition-colors"
                                    >
                                      <div className="w-5 h-5 rounded-full bg-sand/30 flex items-center justify-center overflow-hidden shrink-0">
                                        {currentUser.avatarUrl ? (
                                          <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <User className="w-3 text-muted/50" />
                                        )}
                                      </div>
                                      <input
                                        type="text"
                                        value={replyInputs[comment._id] || ""}
                                        onChange={(e) => setReplyInputs(prev => ({ ...prev, [comment._id]: e.target.value }))}
                                        placeholder="Write a reply..."
                                        disabled={submittingReplies[comment._id]}
                                        className="flex-1 bg-transparent text-[11px] text-ink outline-none placeholder:text-muted/40 placeholder:font-medium disabled:cursor-not-allowed"
                                      />
                                      <button 
                                        type="submit"
                                        disabled={submittingReplies[comment._id] || !(replyInputs[comment._id] || "").trim()}
                                        className="text-caramel hover:text-rust disabled:opacity-40 transition-colors shrink-0 p-0.5 rounded-full"
                                      >
                                        {submittingReplies[comment._id] ? (
                                          <Loader2 className="w-3 h-3 animate-spin text-caramel" />
                                        ) : (
                                          <Send className="w-3 h-3 transform rotate-45" />
                                        )}
                                      </button>
                                    </form>
                                  </div>
                                )}
                              </div>
                            ))}

                            {post.comments.length > visibleCount && (
                              <button 
                                type="button"
                                onClick={() => setVisibleCommentsCount(prev => ({ ...prev, [post._id]: visibleCount + 5 }))}
                                className="text-[10px] font-bold text-caramel hover:text-rust block mt-3 hover:underline ml-9 cursor-pointer text-left"
                              >
                                Load more comments ({post.comments.length - visibleCount} remaining)
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Inline Comment Input Form */}
                    <div className="px-5 pb-5 pt-3 border-t border-sand/10">
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleCommentSubmit(post._id);
                        }}
                        className="flex items-center gap-3 bg-[#FBF9F2] border border-sand/50 rounded-xl px-4 py-2 hover:border-caramel/40 transition-colors focus-within:border-caramel focus-within:bg-white"
                      >
                        <div className="w-6 h-6 rounded-full bg-sand/30 flex items-center justify-center overflow-hidden shrink-0">
                          {currentUser.avatarUrl ? (
                            <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-muted/50" />
                          )}
                        </div>
                        <input
                          type="text"
                          value={commentInputs[post._id] || ""}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                          placeholder={isLoggedIn ? "Write a comment..." : "Log in to join the conversation"}
                          disabled={!isLoggedIn || submittingComments[post._id]}
                          className="flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-muted/40 placeholder:font-medium disabled:cursor-not-allowed"
                        />
                        {isLoggedIn && (
                          <button 
                            type="submit" 
                            disabled={submittingComments[post._id] || !(commentInputs[post._id] || "").trim()}
                            className="text-caramel hover:text-rust disabled:opacity-40 disabled:hover:text-caramel transition-colors shrink-0 p-1 rounded-full hover:bg-caramel/5 active:scale-90"
                          >
                            {submittingComments[post._id] ? (
                              <Loader2 className="w-4 h-4 animate-spin text-caramel" />
                            ) : (
                              <Send className="w-4 h-4 transform rotate-45" />
                            )}
                          </button>
                        )}
                      </form>
                    </div>

                  </article>
                ))}

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={total}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  className="mt-12"
                />
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block lg:col-span-1 space-y-6 sticky top-6">
            
            {/* Discover Topics */}
            <div className="bg-white border border-sand/50 rounded-[2rem] p-6 shadow-sm">
              <h3 className="font-serif text-lg font-bold italic text-ink mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-caramel" />
                Discover Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    selectedCategory === null
                      ? "bg-caramel text-white border-caramel shadow-sm shadow-caramel/10"
                      : "bg-[#FBF9F2] text-muted border-sand/40 hover:border-caramel/40"
                  }`}
                >
                  All Entries
                </button>
                {[
                  "Nutrition & Health",
                  "Training & Behavior",
                  "Pet Lifestyle",
                  "Species Guide: Dogs",
                  "Species Guide: Cats",
                  "Species Guide: Other",
                  "Pet Travel",
                  "Success Stories"
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      selectedCategory === cat
                        ? "bg-caramel text-white border-caramel shadow-sm shadow-caramel/10"
                        : "bg-[#FBF9F2] text-muted border-sand/40 hover:border-caramel/40"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Journals */}
            <div className="bg-white border border-sand/50 rounded-[2rem] p-6 shadow-sm">
              <h3 className="font-serif text-lg font-bold italic text-ink mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-caramel" />
                Trending Journals
              </h3>
              
              {trendingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-caramel" />
                </div>
              ) : trendingPosts.length === 0 ? (
                <p className="text-xs text-muted/40 font-medium italic text-center py-4">No trending articles</p>
              ) : (
                <div className="space-y-4">
                  {trendingPosts.map((tPost) => (
                    <Link
                      key={tPost._id}
                      to={`/blogs/${tPost._id}`}
                      className="flex items-center gap-3 group border-b border-sand/10 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-warm shrink-0 border border-sand/30">
                        {tPost.image ? (
                          <img src={tPost.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted/30">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-ink leading-snug line-clamp-2 group-hover:text-caramel transition-colors">
                          {tPost.title}
                        </h4>
                        <p className="text-[9px] text-muted/50 font-bold uppercase mt-1 flex items-center gap-1.5">
                          <span>{tPost.author.name}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-0.5 text-caramel font-semibold">
                            <Eye className="w-3.5 h-3.5" />
                            {tPost.views}
                          </span>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

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
                    className="w-full px-4 py-3 bg-[#FBF9F2] border border-sand/50 rounded-2xl text-sm focus:outline-none focus:border-caramel/50 resize-none"
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
    </main>
  );
}
