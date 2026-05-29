import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  Share2,
  Image as ImageIcon,
  X,
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Pagination from "@/components/common/Pagination";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";
import { authService } from "@/services/auth.service";
import { MiniProfileModal } from "@/components/social/MiniProfileModal";

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

const normalizeBlogText = (html: string) => {
  return html
    .replace(/\r\n|\r/g, '\n')
    .replace(/<p>\s*(?:<br\s*\/?>)?\s*<\/p>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/li>|<\/blockquote>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\u00A0/g, ' ')
    .trim();
};

const renderCollage = (post: BlogPost, onImageOpen: (images: string[], index: number) => void) => {
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
      <button
        type="button"
        onClick={() => onImageOpen(allImages, 0)}
        className="block aspect-[16/10] overflow-hidden relative group bg-sand/10 w-full text-left"
      >
        <img src={allImages[0]} alt={post.title} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.02]" />
      </button>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 aspect-[16/10] overflow-hidden">
        <button
          type="button"
          onClick={() => onImageOpen(allImages, 0)}
          className="overflow-hidden group relative w-full text-left"
        >
          <img src={allImages[0]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </button>
        <button
          type="button"
          onClick={() => onImageOpen(allImages, 1)}
          className="overflow-hidden group relative w-full text-left"
        >
          <img src={allImages[1]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </button>
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-3 gap-1 aspect-[16/10] overflow-hidden">
        <button
          type="button"
          onClick={() => onImageOpen(allImages, 0)}
          className="col-span-2 overflow-hidden group relative w-full text-left"
        >
          <img src={allImages[0]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </button>
        <div className="col-span-1 grid grid-rows-2 gap-1">
          <button
            type="button"
            onClick={() => onImageOpen(allImages, 1)}
            className="overflow-hidden group relative h-full w-full text-left"
          >
            <img src={allImages[1]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </button>
          <button
            type="button"
            onClick={() => onImageOpen(allImages, 2)}
            className="overflow-hidden group relative h-full w-full text-left"
          >
            <img src={allImages[2]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </button>
        </div>
      </div>
    );
  }

  // 4 or more images
  const remaining = count - 3;
  return (
    <div className="grid grid-cols-3 gap-1 aspect-[16/10] overflow-hidden">
      <button
        type="button"
        onClick={() => onImageOpen(allImages, 0)}
        className="col-span-2 overflow-hidden group relative w-full text-left"
      >
        <img src={allImages[0]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      </button>
      <div className="col-span-1 grid grid-rows-2 gap-1">
        <button
          type="button"
          onClick={() => onImageOpen(allImages, 1)}
          className="overflow-hidden group relative h-full w-full text-left"
        >
          <img src={allImages[1]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </button>
        <button
          type="button"
          onClick={() => onImageOpen(allImages, 2)}
          className="overflow-hidden group relative h-full w-full text-left"
        >
          <img src={allImages[2]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          {remaining > 0 && (
            <div className="absolute inset-0 bg-ink/60 flex items-center justify-center text-white font-bold text-lg backdrop-blur-[2px]">
              +{remaining}
            </div>
          )}
        </button>
      </div>
    </div>
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
  const [expandedPostIds, setExpandedPostIds] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  const showPrevLightboxImage = () => {
    setLightboxIndex(prev => (prev === 0 ? lightboxImages.length - 1 : prev - 1));
  };

  const showNextLightboxImage = () => {
    setLightboxIndex(prev => (prev === lightboxImages.length - 1 ? 0 : prev + 1));
  };

  // Liking & commenting states
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [submittingComments, setSubmittingComments] = useState<{ [key: string]: boolean }>({});

  // Comment modal states
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentModalPost, setCommentModalPost] = useState<BlogPost | null>(null);
  const [commentModalSort, setCommentModalSort] = useState<'all' | 'latest'>('all');
  const [expandedCommentReplies, setExpandedCommentReplies] = useState<string[]>([]);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryPostId = searchParams.get("postId");
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser._id || currentUser.id || "";

  // Quick Post Creator states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Nutrition & Health");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isUploadingPostImages, setIsUploadingPostImages] = useState(false);

  const handleComposerClick = () => {
    if (!isLoggedIn) {
      toast.error("Please log in to create a post.");
      navigate("/login");
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleQuickPostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploadingPostImages(true);
    const uploadedUrls = [...newPostImages];
    try {
      toast.loading("Uploading images...", { id: "quick-post-upload" });
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (limit 5MB).`);
          continue;
        }
        const { url } = await authService.generalUpload(file);
        uploadedUrls.push(url);
      }
      setNewPostImages(uploadedUrls);
      toast.success("Images uploaded!", { id: "quick-post-upload" });
    } catch (error) {
      toast.error("Upload failed", { id: "quick-post-upload" });
    } finally {
      setIsUploadingPostImages(false);
    }
  };

  const removeQuickPostImage = (index: number) => {
    setNewPostImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please log in to post.");
      return;
    }
    if (!newPostTitle.trim()) {
      toast.error("Please add a title.");
      return;
    }
    if (!newPostContent.trim()) {
      toast.error("Please add some content.");
      return;
    }

    try {
      setIsSubmittingPost(true);
      const mainImage = newPostImages[0] || "";
      
      const payload = {
        title: newPostTitle,
        content: newPostContent,
        category: newPostCategory,
        image: mainImage,
        images: newPostImages,
        status: "pending"
      };
      
      await apiClient.post("/blogs", payload);
      toast.success("Post submitted for review! It will be visible once approved.");
      
      setNewPostTitle("");
      setNewPostCategory("Nutrition & Health");
      setNewPostContent("");
      setNewPostImages([]);
      setIsCreateModalOpen(false);
      
      fetchBlogs(currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create post.");
    } finally {
      setIsSubmittingPost(false);
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

  useEffect(() => {
    if (queryPostId) {
      const fetchAndOpenPost = async () => {
        try {
          const res = await apiClient.get(`/blogs/${queryPostId}`);
          if (res.data.blog) {
            openCommentModal(res.data.blog);
          }
        } catch (error) {
          console.error("Failed to fetch shared post:", error);
        }
      };
      fetchAndOpenPost();
    }
  }, [queryPostId]);

  useEffect(() => {
    if (!commentModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [commentModalOpen]);

  const openCommentModal = (post: BlogPost) => {
    setCommentModalPost(post);
    setCommentModalSort('all');
    setExpandedCommentReplies([]);
    setCommentModalOpen(true);
    if (searchParams.get("postId") !== post._id) {
      searchParams.set("postId", post._id);
      setSearchParams(searchParams);
    }
  };

  const closeCommentModal = () => {
    setCommentModalOpen(false);
    setCommentModalPost(null);
    setExpandedCommentReplies([]);
    if (searchParams.has("postId")) {
      searchParams.delete("postId");
      setSearchParams(searchParams);
    }
  };

  const toggleCommentReplies = (commentId: string) => {
    setExpandedCommentReplies(prev =>
      prev.includes(commentId)
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

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
            {/* Quick Post Creator Box */}
            <div className="bg-white rounded-[2rem] border border-sand/50 shadow-sm p-4 space-y-3 hover:border-caramel/20 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-warm overflow-hidden border border-sand/40 flex items-center justify-center shrink-0">
                  {isLoggedIn && currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-caramel/40" />
                  )}
                </div>
                <button
                  onClick={handleComposerClick}
                  className="flex-1 bg-warm/30 hover:bg-warm/50 border border-sand/35 rounded-full px-5 py-3 text-xs text-muted/60 font-medium transition-colors text-left outline-none cursor-pointer"
                >
                  {isLoggedIn 
                    ? `What's on your mind, ${currentUser.name || "friend"}? Share a story or tip...`
                    : "Log in to share your pet companion stories..."}
                </button>
              </div>
              
              <div className="border-t border-sand/10 pt-3 flex items-center justify-between text-xs font-bold text-muted/60">
                <button
                  onClick={() => {
                    if (isLoggedIn) {
                      setNewPostCategory("Pet Lifestyle");
                    }
                    handleComposerClick();
                  }}
                  className="flex items-center gap-2 hover:bg-[#FBF9F2] px-4 py-2 rounded-full hover:text-ink transition-colors cursor-pointer animate-duration-300"
                >
                  <ImageIcon className="w-4.5 h-4.5 text-emerald-500" />
                  <span>Photo/Gallery</span>
                </button>
                <button
                  onClick={handleComposerClick}
                  className="flex items-center gap-2 hover:bg-[#FBF9F2] px-4 py-2 rounded-full hover:text-ink transition-colors cursor-pointer animate-duration-300"
                >
                  <BookOpen className="w-4.5 h-4.5 text-caramel" />
                  <span>Write Story</span>
                </button>
                <button
                  onClick={() => {
                    if (isLoggedIn) {
                      setNewPostCategory("Success Stories");
                    }
                    handleComposerClick();
                  }}
                  className="flex items-center gap-2 hover:bg-[#FBF9F2] px-4 py-2 rounded-full hover:text-ink transition-colors cursor-pointer animate-duration-300"
                >
                  <Award className="w-4.5 h-4.5 text-amber-500" />
                  <span>Success Story</span>
                </button>
              </div>
            </div>

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
                        <div 
                          onClick={() => setSelectedUserId(post.author._id)}
                          className="w-10 h-10 rounded-full bg-warm overflow-hidden border border-sand/40 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
                        >
                          {post.author.avatarUrl ? (
                            <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-caramel/40" />
                          )}
                        </div>
                        <div>
                          <p 
                            onClick={() => setSelectedUserId(post.author._id)}
                            className="text-xs font-bold text-ink leading-tight cursor-pointer hover:text-caramel transition-colors"
                          >
                            {post.author.name}
                          </p>
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
                      <button 
                        onClick={() => openCommentModal(post)} 
                        className="block group text-left outline-none"
                      >
                        <h3 className="font-serif text-xl font-bold italic text-ink group-hover:text-caramel transition-colors leading-tight">
                          {post.title}
                        </h3>
                      </button>
                      <p className="text-muted/70 text-sm leading-relaxed font-medium whitespace-pre-line">
                        {expandedPostIds.includes(post._id)
                          ? normalizeBlogText(post.content)
                          : `${normalizeBlogText(post.content).substring(0, 180)}${normalizeBlogText(post.content).length > 180 ? '...' : ''}`}
                      </p>
                      {post.content.replace(/<[^>]*>/g, '').length > 180 && (
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedPostIds(prev =>
                              prev.includes(post._id)
                                ? prev.filter(id => id !== post._id)
                                : [...prev, post._id]
                            );
                          }}
                          className="text-caramel hover:text-rust font-bold ml-1 hover:underline"
                        >
                          {expandedPostIds.includes(post._id) ? 'Show less' : 'Read More'}
                        </button>
                      )}
                    </div>

                    {/* Card Media Collage */}
                    <div className="border-t border-b border-sand/15 overflow-hidden bg-[#FBF9F2]/30">
                        {renderCollage(post, openImageLightbox)}
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
                        <button
                          type="button"
                          onClick={() => openCommentModal(post)}
                          className="flex items-center gap-1.5 hover:text-caramel transition-colors"
                        >
                          <MessageSquare className="w-4 h-4 text-muted/40 hover:text-caramel" />
                          <span>{post.comments?.length || 0} Comments</span>
                        </button>
                        <button 
                          onClick={() => {
                            const postUrl = `${window.location.origin}/feeds/${post._id}`;
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
                    {post.comments && post.comments.length > 0 && (
                      <div className="px-5 pb-4 pt-3 border-t border-sand/10 space-y-3 bg-[#FBF9F2]/20">
                        <p className="text-[9px] font-bold text-muted/40 uppercase tracking-wider">Comments preview</p>
                        <div className="space-y-3">
                          {post.comments.slice(0, 2).map((comment) => (
                            <div key={comment._id} className="space-y-2">
                              <div className="flex gap-2.5 items-start text-xs">
                                <div 
                                  onClick={() => setSelectedUserId(comment.user._id)}
                                  className="w-7 h-7 rounded-full bg-warm border border-sand/40 overflow-hidden flex items-center justify-center shrink-0 mt-0.5 cursor-pointer hover:scale-105 transition-transform"
                                >
                                  {comment.user?.avatarUrl ? (
                                    <img src={comment.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-3.5 h-3.5 text-caramel/40" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="bg-[#FBF9F2] border border-sand/40 rounded-2xl px-3.5 py-2 inline-block max-w-full">
                                    <p 
                                      onClick={() => setSelectedUserId(comment.user._id)}
                                      className="font-bold text-ink leading-tight mb-0.5 cursor-pointer hover:text-caramel transition-colors"
                                    >
                                      {comment.user?.name || "User"}
                                    </p>
                                    <p className="text-muted/80 leading-relaxed font-medium break-words">{comment.text}</p>
                                  </div>
                                  <div className="flex items-center gap-3 text-[8px] text-muted/40 font-bold uppercase tracking-wider mt-1 ml-2">
                                    <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                                    {comment.replies && comment.replies.length > 0 && (
                                      <button 
                                        type="button"
                                        onClick={() => toggleCommentReplies(comment._id)}
                                        className="text-caramel hover:underline cursor-pointer"
                                      >
                                        {expandedCommentReplies.includes(comment._id) ? 'Hide replies' : `Show replies (${comment.replies.length})`}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {expandedCommentReplies.includes(comment._id) && comment.replies && comment.replies.length > 0 && (
                                <div className="ml-9 pl-4 border-l-2 border-sand/35 space-y-2">
                                  {comment.replies.map((reply) => (
                                    <div key={reply._id} className="flex gap-2 items-start text-xs">
                                      <div 
                                        onClick={() => setSelectedUserId(reply.user._id)}
                                        className="w-6 h-6 rounded-full bg-warm border border-sand/35 overflow-hidden flex items-center justify-center shrink-0 mt-0.5 cursor-pointer hover:scale-105 transition-transform"
                                      >
                                        {reply.user?.avatarUrl ? (
                                          <img src={reply.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <User className="w-3 h-3 text-caramel/40" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="bg-[#FBF9F2]/70 border border-sand/30 rounded-xl px-3 py-1.5 inline-block max-w-full">
                                          <p 
                                            onClick={() => setSelectedUserId(reply.user._id)}
                                            className="font-bold text-ink leading-tight mb-0.5 cursor-pointer hover:text-caramel transition-colors"
                                          >
                                            {reply.user?.name || "User"}
                                          </p>
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
                            </div>
                          ))}

                          {post.comments.length > 2 && (
                            <button
                              type="button"
                              onClick={() => openCommentModal(post)}
                              className="text-[10px] font-bold text-caramel hover:text-rust block mt-3 hover:underline ml-9 cursor-pointer text-left"
                            >
                              View all {post.comments.length} comments
                            </button>
                          )}
                        </div>
                      </div>
                    )}

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

            {/* Trending Feeds */}
            <div className="bg-white border border-sand/50 rounded-[2rem] p-6 shadow-sm">
              <h3 className="font-serif text-lg font-bold italic text-ink mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-caramel" />
                Trending Feeds
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
                      to={`/feeds/${tPost._id}`}
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
                          <span 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedUserId(tPost.author._id);
                            }}
                            className="cursor-pointer hover:text-caramel transition-colors"
                          >
                            {tPost.author.name}
                          </span>
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

      {/* Comments Modal */}
      <AnimatePresence>
        {commentModalOpen && commentModalPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCommentModal}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl overflow-hidden bg-white border border-sand/50 shadow-2xl rounded-[2.5rem] p-4 z-10 max-h-[88vh] flex flex-col"
            >
              <div className="flex items-center justify-between gap-4 mb-4 border-b border-sand/15 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted/50 font-bold">Comments</p>
                  <h3 className="font-serif text-2xl font-bold italic text-ink mt-2">{commentModalPost.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={closeCommentModal}
                  className="rounded-full p-2 text-muted hover:bg-sand/30 hover:text-ink transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="min-h-0 overflow-y-auto space-y-5">
                <div className="rounded-[2rem] border border-sand/30 bg-[#FBF9F2] p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-warm border border-sand/40 overflow-hidden flex items-center justify-center">
                      {commentModalPost.author.avatarUrl ? (
                        <img src={commentModalPost.author.avatarUrl} alt={commentModalPost.author.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-caramel/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted/50">{commentModalPost.author.name}</p>
                      <p className="text-[11px] text-muted/50 mt-1">{new Date(commentModalPost.createdAt).toLocaleDateString()}</p>
                      <p className="text-sm text-muted/80 mt-4 leading-relaxed whitespace-pre-line">{normalizeBlogText(commentModalPost.content)}</p>
                    </div>
                  </div>
                  {(commentModalPost.image || commentModalPost.images?.length) && (
                    <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-sand/40 bg-white">
                      {renderCollage(commentModalPost, openImageLightbox)}
                    </div>
                  )}
                </div>

                <div className="rounded-[2rem] border border-sand/30 bg-white overflow-hidden">
                  <div className="flex flex-col gap-3 px-5 py-4 border-b border-sand/15 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted/70">Sort by</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCommentModalSort('all')}
                        className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all ${commentModalSort === 'all' ? 'bg-caramel text-white' : 'bg-[#FBF9F2] text-muted/80 hover:bg-[#f4e9d8]'}`}
                      >
                        All Comments
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommentModalSort('latest')}
                        className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all ${commentModalSort === 'latest' ? 'bg-caramel text-white' : 'bg-[#FBF9F2] text-muted/80 hover:bg-[#f4e9d8]'}`}
                      >
                        Latest
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4 px-4 py-4">
                    {(commentModalPost.comments || [])
                      .slice()
                      .sort((a, b) =>
                        commentModalSort === 'all'
                          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                      )
                      .map((comment) => (
                      <div key={comment._id} className="space-y-3 bg-[#FBF9F2] rounded-[2rem] border border-sand/30 p-4">
                      <div className="flex items-start gap-3">
                        <div 
                          onClick={() => setSelectedUserId(comment.user._id)}
                          className="w-9 h-9 rounded-full bg-warm border border-sand/40 overflow-hidden flex items-center justify-center shrink-0 mt-0.5 cursor-pointer hover:scale-105 transition-transform"
                        >
                          {comment.user?.avatarUrl ? (
                            <img src={comment.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-caramel/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p 
                              onClick={() => setSelectedUserId(comment.user._id)}
                              className="font-bold text-ink leading-tight cursor-pointer hover:text-caramel transition-colors"
                            >
                              {comment.user?.name || 'User'}
                            </p>
                            <span className="text-[10px] text-muted/50 uppercase tracking-[0.2em] font-bold">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted/80 leading-relaxed mt-2 whitespace-pre-wrap">{comment.text}</p>
                          {comment.replies && comment.replies.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleCommentReplies(comment._id)}
                              className="text-[11px] font-bold text-caramel hover:text-rust mt-3"
                            >
                              {expandedCommentReplies.includes(comment._id) ? `Hide replies (${comment.replies.length})` : `Show replies (${comment.replies.length})`}
                            </button>
                          )}
                        </div>
                      </div>
                      {expandedCommentReplies.includes(comment._id) && comment.replies && comment.replies.length > 0 && (
                        <div className="ml-12 border-l-2 border-sand/40 pl-4 space-y-3 mt-3">
                          {comment.replies.map((reply) => (
                            <div key={reply._id} className="flex items-start gap-3 text-sm">
                              <div 
                                onClick={() => setSelectedUserId(reply.user._id)}
                                className="w-8 h-8 rounded-full bg-warm border border-sand/40 overflow-hidden flex items-center justify-center shrink-0 mt-0.5 cursor-pointer hover:scale-105 transition-transform"
                              >
                                {reply.user?.avatarUrl ? (
                                  <img src={reply.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-3.5 h-3.5 text-caramel/40" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="bg-white border border-sand/30 rounded-2xl px-3.5 py-2">
                                  <p 
                                    onClick={() => setSelectedUserId(reply.user._id)}
                                    className="font-bold text-ink leading-tight cursor-pointer hover:text-caramel transition-colors"
                                  >
                                    {reply.user?.name || 'User'}
                                  </p>
                                  <p className="text-muted/80 leading-relaxed mt-1">{reply.text}</p>
                                </div>
                                <p className="text-[9px] text-muted/50 uppercase tracking-[0.2em] font-bold mt-1 ml-1">
                                  {new Date(reply.createdAt).toLocaleDateString()}
                                </p>
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
            </motion.div>
          </div>
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

      {/* Create Quick Post Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-y-auto max-h-[90vh] bg-white border border-sand/50 shadow-2xl rounded-[2.5rem] p-8 z-10 scrollbar-none"
            >
              <div className="flex items-center justify-between mb-6 border-b border-sand/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-caramel/10 rounded-full flex items-center justify-center text-caramel">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold italic text-ink">Share a Post</h3>
                    <p className="text-xs text-muted/50 font-medium">Create a new post for the community.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-warm rounded-full text-muted transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleQuickPostSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-ink/75 uppercase tracking-wider mb-2">
                    Post Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="E.g., Tips for preparing nutritious meals for puppies"
                    className="w-full px-4 py-3 bg-[#FBF9F2] border border-sand/50 rounded-2xl text-sm focus:outline-none focus:border-caramel/50 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-ink/75 uppercase tracking-wider mb-2">
                      Topic Category
                    </label>
                    <div className="relative">
                      <select
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-[#FBF9F2] border border-sand/50 rounded-2xl text-sm focus:outline-none focus:border-caramel/50 transition-all font-medium appearance-none cursor-pointer"
                      >
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
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink/75 uppercase tracking-wider mb-2">
                      Photos (Optional)
                    </label>
                    <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-sand/50 hover:border-caramel/40 rounded-2xl cursor-pointer bg-warm/5 hover:bg-warm/15 transition-all text-sm text-ink/70 justify-center">
                      <Upload className="w-4 h-4 text-caramel/70" />
                      <span className="font-bold text-xs">Add Images</span>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleQuickPostImageUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                {/* Previews */}
                {(newPostImages.length > 0 || isUploadingPostImages) && (
                  <div>
                    <label className="block text-[10px] font-bold text-muted/60 uppercase tracking-wider mb-2">
                      Selected Photos ({newPostImages.length})
                    </label>
                    <div className="grid grid-cols-4 gap-2.5 p-3 bg-warm/5 rounded-2xl border border-sand/20">
                      {newPostImages.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-sand/30 group">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeQuickPostImage(idx)}
                            className="absolute top-1 right-1 bg-ink/75 hover:bg-ink text-white p-1 rounded-full transition-opacity cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {isUploadingPostImages && (
                        <div className="aspect-square rounded-xl border border-sand/30 bg-warm/5 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-caramel" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-ink/75 uppercase tracking-wider mb-2">
                    Post Content
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share details about nutrition, behaviors, trips, or success stories..."
                    className="w-full px-4 py-3 bg-[#FBF9F2] border border-sand/50 rounded-2xl text-sm focus:outline-none focus:border-caramel/50 resize-none transition-all font-medium leading-relaxed"
                  />
                </div>

                <div className="mt-8 flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-5 py-3.5 border border-sand text-ink text-sm font-bold rounded-2xl hover:bg-[#FBF9F2] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPost || isUploadingPostImages || !newPostTitle.trim() || !newPostContent.trim()}
                    className="flex-1 px-5 py-3.5 bg-caramel text-white text-sm font-bold rounded-2xl hover:bg-[#b08e6f] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-caramel/10 cursor-pointer"
                  >
                    {isSubmittingPost ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : "Post to Feed"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[3rem] overflow-hidden shadow-2xl">
              <button
                type="button"
                onClick={closeImageLightbox}
                className="absolute top-4 right-4 z-10 rounded-full bg-white/90 p-3 text-ink shadow-lg hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="relative h-full min-h-[360px] bg-black flex items-center justify-center">
                <img
                  src={lightboxImages[lightboxIndex]}
                  alt="Preview"
                  className="max-h-[82vh] max-w-full object-contain"
                />
                {lightboxImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPrevLightboxImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-3 text-ink shadow-lg hover:bg-white"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={showNextLightboxImage}
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

      {/* Mini Profile Modal */}
      <AnimatePresence>
        {selectedUserId && (
          <MiniProfileModal
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
