import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Clock3, MessageSquare, XCircle, Loader2, Eye, MapPin, X } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/utils/api.service";
import Pagination from "@/components/common/Pagination";
import { motion, AnimatePresence } from "framer-motion";

type Author = {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  description?: string;
  address?: string;
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
  const [readingMode, setReadingMode] = useState(false);
  const pageSize = 5;

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/blogs/pending");
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
      await apiClient.put(`/admin/blogs/${blogId}/review`, {
        status,
        reviewNote
      });
      toast.success(`Blog post ${status} successfully.`);
      setReviewNote("");
      setSelectedBlog(null);
      setReadingMode(false);
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
          Global editorial review for all user-submitted articles and storytelling.
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
            <div className="flex flex-col items-center justify-center p-32 bg-white/50 rounded-[3rem] border border-dashed border-sand">
              <Loader2 className="w-10 h-10 border-4 border-sand border-t-caramel rounded-full animate-spin mb-4" />
              <p className="text-xs font-bold text-muted uppercase tracking-widest">Consulting Editorial</p>
            </div>
          ) : pendingBlogs.length === 0 ? (
            <div className="rounded-[3rem] border border-sand bg-white/50 p-24 text-center">
              <div className="w-20 h-20 bg-warm rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-8 w-8 text-muted/30" />
              </div>
              <p className="text-xl font-serif font-bold italic text-ink mb-2">Editor's Desk is Clear</p>
              <p className="text-sm font-medium text-muted/50">No pending submissions are awaiting refinement.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedBlogs.map((blog) => (
                <article 
                  key={blog._id} 
                  onClick={() => setSelectedBlog(blog)}
                  className={`group relative overflow-hidden rounded-[2.5rem] border transition-all duration-500 cursor-pointer p-6 flex gap-6
                    ${selectedBlog?._id === blog._id 
                      ? "border-caramel bg-white shadow-2xl shadow-caramel/10 scale-[1.02]" 
                      : "border-sand/40 bg-white/80 hover:bg-white hover:shadow-xl hover:border-caramel/30"}
                  `}
                >
                  <div className="w-28 h-28 rounded-3xl bg-sand/10 overflow-hidden flex-shrink-0 border border-sand/30">
                    {blog.image ? (
                      <img src={blog.image} alt={blog.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted/30">
                         <BookOpen className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-caramel bg-caramel/5 px-3 py-1 rounded-full border border-caramel/10">
                        {blog.category}
                      </span>
                      <span className="text-[10px] font-bold text-muted/40 uppercase tracking-widest">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-ink mb-3 line-clamp-1 italic group-hover:text-caramel transition-colors">
                      {blog.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-auto">
                       <div className="w-7 h-7 rounded-full bg-warm overflow-hidden border border-sand/30">
                          {blog.author.avatarUrl ? (
                            <img src={blog.author.avatarUrl} alt={blog.author.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-ink/20">
                              {blog.author.name[0]}
                            </div>
                          )}
                       </div>
                       <span className="text-xs font-bold text-ink/60">{blog.author.name}</span>
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
                className="mt-12"
              />
            </div>
          )}
        </section>

        {/* Review Detail Panel */}
        <aside>
           <AnimatePresence mode="wait">
             {selectedBlog ? (
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 30 }}
                 className="sticky top-24 rounded-[3.5rem] border border-sand bg-white p-10 shadow-2xl shadow-ink/5"
               >
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-caramel leading-tight mb-1">Editor In Chief</span>
                       <h2 className="text-2xl font-serif font-bold italic text-ink">Curation Panel</h2>
                    </div>
                    <button onClick={() => setSelectedBlog(null)} className="p-3 hover:bg-warm rounded-full transition-all text-muted hover:text-ink">
                      <XCircle className="w-6 h-6" />
                    </button>
                 </div>

                 <div className="space-y-6">
                    <div className="p-6 rounded-[2rem] bg-warm/20 border border-sand/20">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-muted/50 mb-3">Submission Title</p>
                       <p className="text-lg font-serif font-bold italic text-ink leading-snug mb-4">{selectedBlog.title}</p>
                       <button 
                         onClick={() => setReadingMode(true)}
                         className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-caramel hover:text-rust transition-colors"
                       >
                         <Eye className="w-4 h-4" /> Open Reading Mode
                       </button>
                    </div>

                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-muted/50 mb-4 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" /> Editorial Feedback <span className="text-muted/20 font-normal italic">(Internal Note)</span>
                       </p>
                       <textarea
                         value={reviewNote}
                         onChange={(e) => setReviewNote(e.target.value)}
                         placeholder="Provide guidance if the article needs refinement..."
                         className="w-full min-h-[160px] rounded-[2rem] border-2 border-sand/30 bg-warm/5 p-6 text-sm font-medium text-ink focus:border-caramel/50 focus:bg-white outline-none transition-all placeholder:text-muted/30"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-sand/30">
                       <button
                         type="button"
                         disabled={!!reviewingId}
                         onClick={() => handleReview(selectedBlog._id, "rejected")}
                         className="flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-sand/50 px-5 py-4 text-sm font-bold text-rust hover:bg-rose-50 hover:border-rose-200 transition-all disabled:opacity-50 active:scale-95"
                       >
                         {reviewingId === selectedBlog._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                         Decline
                       </button>
                       <button
                         type="button"
                         disabled={!!reviewingId}
                         onClick={() => handleReview(selectedBlog._id, "approved")}
                         className="flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-4 text-sm font-bold text-white hover:bg-caramel transition-all shadow-xl shadow-ink/10 disabled:opacity-50 active:scale-95"
                       >
                         {reviewingId === selectedBlog._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                         Approve
                       </button>
                    </div>
                 </div>
               </motion.div>
             ) : (
               <div className="rounded-[3.5rem] border-2 border-sand/40 border-dashed p-16 text-center bg-warm/5">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <BookOpen className="h-8 w-8 text-muted/20" />
                  </div>
                  <h3 className="text-lg font-serif font-bold italic text-ink mb-3">Quiet Archives</h3>
                  <p className="text-sm font-medium text-muted/50 leading-relaxed max-w-[200px] mx-auto italic">
                    Select a soul from the editorial queue to begin curation.
                  </p>
               </div>
             )}
           </AnimatePresence>
        </aside>
      </div>

      {/* Reading Mode Modal */}
      <AnimatePresence>
         {readingMode && selectedBlog && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-white overflow-y-auto"
           >
              <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-8 py-6 flex items-center justify-between border-b border-sand">
                 <div className="flex items-center gap-8">
                    <button onClick={() => setReadingMode(false)} className="p-3 hover:bg-warm rounded-full transition-all text-ink">
                       <X className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-caramel leading-none mb-1">Atelier Reader</span>
                       <span className="text-sm font-serif font-bold italic text-ink">{selectedBlog.title}</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <button 
                       disabled={!!reviewingId}
                       onClick={() => handleReview(selectedBlog._id, "approved")}
                       className="px-8 py-3 bg-ink text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-caramel transition-all shadow-xl shadow-ink/10"
                    >
                       Approve Now
                    </button>
                 </div>
              </nav>

              <article className="max-w-4xl mx-auto py-24 px-8 font-serif">
                <div className="text-center mb-16">
                  <span className="text-xs font-bold uppercase tracking-[0.4em] text-caramel mb-6 block">{selectedBlog.category}</span>
                  <h1 className="text-5xl md:text-8xl font-bold text-ink italic mb-12 leading-tight tracking-tighter">{selectedBlog.title}</h1>
                  
                  <div className="flex items-center justify-center gap-6 pt-12 border-t border-sand/30">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-warm overflow-hidden border border-sand/50">
                           {selectedBlog.author.avatarUrl ? (
                              <img src={selectedBlog.author.avatarUrl} alt={selectedBlog.author.name} className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-ink/20 font-bold">{selectedBlog.author.name[0]}</div>
                           )}
                        </div>
                        <div className="text-left">
                           <p className="text-[10px] font-bold uppercase tracking-widest text-muted leading-none mb-1">Contributed by</p>
                           <p className="text-sm font-bold text-ink">{selectedBlog.author.name}</p>
                        </div>
                     </div>
                     <div className="h-8 w-px bg-sand" />
                     <div className="text-left">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted leading-none mb-1">Date Published</p>
                        <p className="text-sm font-bold text-ink">{new Date(selectedBlog.createdAt).toLocaleDateString()}</p>
                     </div>
                  </div>
                </div>

                {selectedBlog.image && (
                   <div className="mb-24 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-8 border-white ring-1 ring-sand/30">
                      <img src={selectedBlog.image} className="w-full" alt="Cover" />
                   </div>
                )}

                <div className="prose prose-2xl mx-auto whitespace-pre-wrap text-2xl md:text-3xl text-ink leading-[1.7] italic text-ink/80">
                  {selectedBlog.content}
                </div>

                <div className="mt-40 p-12 bg-warm/20 rounded-[4rem] border border-sand/30">
                   <h4 className="text-2xl font-serif font-bold italic text-ink mb-6">About the Author</h4>
                   <div className="flex flex-col md:flex-row gap-8">
                      <div className="w-24 h-24 rounded-3xl bg-white overflow-hidden flex-shrink-0 shadow-xl">
                         {selectedBlog.author.avatarUrl && <img src={selectedBlog.author.avatarUrl} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                         <p className="text-lg font-medium text-muted/70 leading-relaxed mb-6 italic">
                            {selectedBlog.author.description || "A dedicated member of our community who values the bond between humans and their companions."}
                         </p>
                         <div className="flex flex-wrap gap-4">
                            {selectedBlog.author.address && (
                               <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted/50 bg-white px-4 py-2 rounded-full border border-sand/30">
                                  <MapPin className="w-3 h-3" /> {selectedBlog.author.address}
                               </span>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
              </article>
           </motion.div>
         )}
      </AnimatePresence>
    </main>
  );
}
