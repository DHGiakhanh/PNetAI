import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Edit3, 
  Plus, 
  Trash2, 
  FileText, 
  Search, 
  Filter,
  CheckCircle2,
  Clock3,
  FileEdit,
  AlertCircle
} from "lucide-react";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type Blog = {
  _id: string;
  title: string;
  category: string;
  status: "draft" | "pending" | "approved" | "rejected";
  image?: string;
  createdAt: string;
  views: number;
};

export default function MyBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchMyBlogs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/blogs/my-blogs");
      setBlogs(res.data.blogs || []);
    } catch (error: any) {
      toast.error("Could not load your curation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBlogs();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/blogs/${id}`);
      toast.success("Article removed from your records.");
      setBlogs(prev => prev.filter(b => b._id !== id));
      setConfirmDeleteId(null);
    } catch (error) {
      toast.error("Failed to remove article.");
    }
  };

  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatusBadge = ({ status }: { status: Blog["status"] }) => {
    const configs = {
      approved: { label: "Published", icon: CheckCircle2, class: "bg-emerald-50 text-emerald-700 border-emerald-100" },
      pending: { label: "In Review", icon: Clock3, class: "bg-amber-50 text-amber-700 border-amber-100" },
      draft: { label: "Draft", icon: FileEdit, class: "bg-slate-50 text-slate-600 border-slate-100" },
      rejected: { label: "Refined Needed", icon: AlertCircle, class: "bg-rose-50 text-rose-700 border-rose-100" }
    };
    const config = configs[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${config.class}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#FBF9F2] pt-12 pb-32">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Header Section */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-caramel/70" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Editorial Studio</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold italic text-ink tracking-tight">
              My Personal <span className="text-caramel/80">Blogs</span>
            </h1>
          </div>
          
          <button 
            onClick={() => navigate("/blogs/new")}
            className="group flex items-center gap-2 bg-ink text-white px-8 py-4 rounded-full font-bold hover:bg-caramel transition-all shadow-xl shadow-ink/10 active:scale-95"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
            Write New Article
          </button>
        </header>

        {/* Content Board */}
        <section className="bg-white border border-sand/50 rounded-[3rem] shadow-sm overflow-hidden">
          
          {/* Controls */}
          <div className="p-6 border-b border-sand/30 flex flex-col md:flex-row gap-4 items-center justify-between bg-warm/10">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
              <input 
                type="text" 
                placeholder="Search your records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-sand/60 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:border-caramel outline-none transition-all shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3">
               <span className="text-xs font-bold text-muted/60">{filteredBlogs.length} Articles</span>
               <div className="w-px h-4 bg-sand" />
               <button className="p-2 hover:bg-white rounded-xl transition-colors text-muted"> <Filter className="w-4 h-4" /> </button>
            </div>
          </div>

          {/* List Area */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 text-center">
                <div className="w-10 h-10 border-4 border-sand border-t-caramel rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-muted italic">Consulting the archives...</p>
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="p-32 text-center">
                 <div className="w-20 h-20 bg-warm rounded-full mx-auto mb-6 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-muted/30" />
                 </div>
                 <h3 className="text-xl font-serif font-bold italic text-ink mb-2">No Articles Found</h3>
                 <p className="text-sm text-muted/60 max-w-xs mx-auto mb-8">
                   Your pen is silent. Start sharing your pet parenting wisdom with the world.
                 </p>
                 <button onClick={() => navigate("/blogs/new")} className="text-sm font-bold text-caramel hover:text-rust transition-colors underline decoration-2 underline-offset-4">
                    Begin your first draft
                 </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-warm/5">
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-sand/30">Article</th>
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-sand/30">Status</th>
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-sand/30">Date Created</th>
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-sand/30 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/20">
                  {filteredBlogs.map((blog) => (
                    <tr key={blog._id} className="hover:bg-warm/5 group transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-warm overflow-hidden border border-sand/30 shrink-0">
                            {blog.image ? (
                              <img src={blog.image} alt={blog.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted/30"> <FileText className="w-5 h-5" /> </div>
                            )}
                          </div>
                          <div className="min-w-0">
                             <p className="text-[10px] font-bold uppercase tracking-widest text-caramel/70 mb-1">{blog.category}</p>
                             <Link to={blog.status === 'approved' ? `/blogs/${blog._id}` : '#'} className="text-base font-serif font-bold text-ink hover:text-caramel transition-colors truncate block italic">
                               {blog.title}
                             </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <StatusBadge status={blog.status} />
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-medium text-muted/70">
                          {new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => navigate(`/blogs/edit/${blog._id}`)}
                            className="p-2 hover:bg-caramel/10 rounded-xl text-caramel transition-all"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(blog._id)}
                            className="p-2 hover:bg-rose-50 rounded-xl text-rose-600 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteId(null)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />
              <div className="text-center mb-8 pt-4">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
                  <Trash2 className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-serif font-bold italic text-ink mb-3">Delete Article?</h3>
                <p className="text-sm text-muted/60 leading-relaxed font-medium">
                  This action is permanent and cannot be reversed. Are you sure you want to remove this piece from your portfolio?
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-4 rounded-2xl border border-sand font-bold text-ink hover:bg-warm transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="flex-1 px-4 py-4 rounded-2xl bg-rose-600 font-bold text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
