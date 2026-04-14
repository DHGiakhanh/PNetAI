import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Clock3, MessageSquare, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/utils/api.service";
import Pagination from "@/components/common/Pagination";
import { motion, AnimatePresence } from "framer-motion";

type Author = {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

type Blog = {
  _id: string;
  title: string;
  content: string;
  category: string;
  image?: string;
  author: Author;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export default function BlogApprovalsPage() {
  const [pendingBlogs, setPendingBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const pageSize = 5;

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/sale/blogs/pending");
      setPendingBlogs(res.data.pendingBlogs || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not load pending blog posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const totalPages = Math.max(1, Math.ceil(pendingBlogs.length / pageSize));
  const paginatedBlogs = useMemo(
    () => pendingBlogs.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [pendingBlogs, currentPage]
  );

  const handleReview = async (blogId: string, status: "approved" | "rejected") => {
    try {
      setReviewingId(blogId);
      await apiClient.put(`/sale/blogs/${blogId}/review`, {
        status,
        reviewNote
      });
      toast.success(`Blog post ${status} successfully.`);
      setReviewNote("");
      setSelectedBlog(null);
      await fetchPending();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Could not ${status} post.`);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <main className="min-h-[calc(100vh-7rem)]">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold italic text-ink">Blog Moderation</h1>
        <p className="mt-2 text-sm text-muted">
          Review and approve editorial submissions from your managed providers.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Pending List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-ink">
              <Clock3 className="h-5 w-5 text-caramel" />
              Waiting for Review
            </h2>
            <span className="rounded-full bg-warm px-3 py-1 text-xs font-bold text-ink ring-1 ring-sand/50 shadow-sm">
              {pendingBlogs.length} pending
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-20 bg-white/50 rounded-3xl border border-dashed border-sand">
              <div className="w-8 h-8 border-4 border-sand border-t-caramel rounded-full animate-spin" />
            </div>
          ) : pendingBlogs.length === 0 ? (
            <div className="rounded-[2.5rem] border border-sand bg-white/50 p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted/30 mb-4" />
              <p className="text-sm font-medium text-muted">No pending blog posts to review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedBlogs.map((blog) => (
                <article 
                  key={blog._id} 
                  onClick={() => setSelectedBlog(blog)}
                  className={`group relative overflow-hidden rounded-[2rem] border transition-all cursor-pointer p-5 flex gap-5
                    ${selectedBlog?._id === blog._id 
                      ? "border-caramel bg-white shadow-xl shadow-caramel/5 scale-[1.02]" 
                      : "border-sand/50 bg-white/80 hover:bg-white hover:shadow-lg hover:border-caramel/30"}
                  `}
                >
                  <div className="w-24 h-24 rounded-2xl bg-sand/20 overflow-hidden flex-shrink-0">
                    {blog.image ? (
                      <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">
                         <BookOpen className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-caramel bg-caramel/5 px-2 py-0.5 rounded-full border border-caramel/10">
                        {blog.category}
                      </span>
                      <span className="text-[10px] font-bold text-muted/50 uppercase tracking-widest">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-serif font-bold text-ink mb-2 line-clamp-1 italic">
                      {blog.title}
                    </h3>
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-warm overflow-hidden border border-sand/30">
                          {blog.author.avatarUrl ? (
                            <img src={blog.author.avatarUrl} alt={blog.author.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-ink/40">
                              {blog.author.name[0]}
                            </div>
                          )}
                       </div>
                       <span className="text-xs font-bold text-muted/80">{blog.author.name}</span>
                    </div>
                  </div>
                </article>
              ))}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={pendingBlogs.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                className="mt-6"
              />
            </div>
          )}
        </section>

        {/* Review Detail Panel */}
        <aside>
           <AnimatePresence mode="wait">
             {selectedBlog ? (
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="sticky top-24 rounded-[2.5rem] border border-sand bg-white p-8 shadow-2xl shadow-ink/5"
               >
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-serif font-bold italic text-ink">Review Post</h2>
                    <button onClick={() => setSelectedBlog(null)} className="p-2 hover:bg-warm rounded-full transition-colors">
                      <XCircle className="w-5 h-5 text-muted" />
                    </button>
                 </div>

                 <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-warm/30 border border-sand/30">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Title</p>
                       <p className="text-sm font-bold text-ink leading-snug">{selectedBlog.title}</p>
                    </div>

                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5" /> Rejection Note <span className="text-muted/40 font-normal">(if rejecting)</span>
                       </p>
                       <textarea
                         value={reviewNote}
                         onChange={(e) => setReviewNote(e.target.value)}
                         placeholder="Explain why this post needs revisions..."
                         className="w-full min-h-[120px] rounded-2xl border border-sand bg-warm/10 p-4 text-sm font-medium text-ink focus:border-caramel focus:ring-4 focus:ring-caramel/5 outline-none transition-all placeholder:text-muted/40"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-sand/50">
                       <button
                         type="button"
                         disabled={!!reviewingId}
                         onClick={() => handleReview(selectedBlog._id, "rejected")}
                         className="flex items-center justify-center gap-2 rounded-2xl bg-white border border-sand px-5 py-4 text-sm font-bold text-rust hover:bg-rust/5 transition-all disabled:opacity-50"
                       >
                         {reviewingId === selectedBlog._id ? "..." : <XCircle className="w-4 h-4" />}
                         Reject
                       </button>
                       <button
                         type="button"
                         disabled={!!reviewingId}
                         onClick={() => handleReview(selectedBlog._id, "approved")}
                         className="flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-4 text-sm font-bold text-white hover:bg-ink/90 transition-all shadow-lg shadow-ink/10 disabled:opacity-50"
                       >
                         {reviewingId === selectedBlog._id ? "..." : <CheckCircle2 className="w-4 h-4" />}
                         Approve
                       </button>
                    </div>
                 </div>
               </motion.div>
             ) : (
               <div className="rounded-[2.5rem] border border-sand border-dashed p-12 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-muted/20 mb-4" />
                  <p className="text-sm font-medium text-muted/60 leading-relaxed italic">
                    Select a submission from the list <br /> to begin the review process.
                  </p>
               </div>
             )}
           </AnimatePresence>
        </aside>
      </div>
    </main>
  );
}
