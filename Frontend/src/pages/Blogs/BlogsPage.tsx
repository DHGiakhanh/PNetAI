import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, ChevronRight, Loader2, BookOpen, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Pagination from "@/components/common/Pagination";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";

type BlogPost = {
  _id: string;
  title: string;
  content: string;
  category: string;
  image: string;
  author: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  views: number;
};

export default function BlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 6;

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const fetchBlogs = async (page: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/blogs?page=${page}&limit=${pageSize}`);
      setPosts(res.data.blogs || []);
      setTotal(res.data.pagination.total || 0);
    } catch (error) {
      toast.error("Could not fetch the journal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(currentPage);
  }, [currentPage]);

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
        <div className="mb-16">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-caramel">Pet Journal</p>
          <h1 className="font-serif text-6xl font-bold italic text-ink tracking-tight mb-6">Blog</h1>
          <p className="max-w-xl text-sm text-muted/60 font-medium leading-relaxed">
            Comprehensive knowledge on dog and cat care, behavior, nutrition, 
            and easy-to-apply daily practical tips.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-32">
             <Loader2 className="w-12 h-12 animate-spin text-caramel mb-4" />
             <p className="text-sm font-medium text-muted italic">Consulting the archives...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-32 bg-white rounded-[3rem] border border-sand/50 shadow-sm">
             <BookOpen className="w-16 h-16 text-muted/20 mx-auto mb-6" />
             <h2 className="text-2xl font-serif font-bold italic text-ink mb-2">The Journal is Silent</h2>
             <p className="text-sm text-muted/50">There are no approved articles to display at this moment.</p>
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article key={post._id} className="group bg-white rounded-[3rem] overflow-hidden border border-sand/50 transition-all duration-700 hover:shadow-2xl hover:shadow-ink/5 flex flex-col h-full hover:border-caramel/30">
                  <Link to={`/blogs/${post._id}`} className="block aspect-[16/11] overflow-hidden relative">
                    {post.image ? (
                        <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-warm flex items-center justify-center text-muted/20">
                            <BookOpen className="w-12 h-12" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-ink/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <span className="px-4 py-1.5 bg-warm/50 border border-sand/30 text-caramel text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">
                          {post.category}
                        </span>
                        <span className="text-[10px] font-bold text-muted/40 uppercase tracking-widest">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {isLoggedIn && (
                        <button 
                          onClick={() => {
                            setSelectedPostId(post._id);
                            setReportModalOpen(true);
                          }}
                          className="text-muted/40 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50/50"
                          title="Report post"
                        >
                          <AlertCircle className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>

                    <Link to={`/blogs/${post._id}`} className="block group/title mb-4">
                      <h3 className="font-serif text-2xl font-bold italic text-ink leading-tight group-hover/title:text-caramel transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                    </Link>

                    <p className="text-muted/60 text-sm leading-relaxed mb-8 line-clamp-3 font-medium">
                      {post.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                    </p>

                    <div className="mt-auto pt-6 border-t border-sand/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-warm overflow-hidden border border-sand/40 flex items-center justify-center">
                          {post.author.avatarUrl ? (
                             <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full object-cover" />
                          ) : (
                             <User className="w-5 h-5 text-caramel/40" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-ink/80">{post.author.name}</span>
                      </div>
                      <Link 
                        to={`/blogs/${post._id}`}
                        className="w-10 h-10 bg-warm rounded-full flex items-center justify-center text-caramel hover:bg-ink hover:text-white transition-all group/arrow"
                      >
                        <ChevronRight className="w-5 h-5 transition-transform group-hover/arrow:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </section>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              className="mt-16"
            />
          </>
        )}
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
