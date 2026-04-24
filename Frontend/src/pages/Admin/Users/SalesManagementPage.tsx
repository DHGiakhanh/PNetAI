import { useEffect, useState, useRef } from "react";
import { 
  Users, 
  Search, 
  MoreVertical, 
  Lock, 
  Unlock, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  UserPlus,
  ArrowUpRight,
  Loader2,
  Filter,
  X,
  Mail,
  Key,
  Edit,
  Trash2
} from "lucide-react";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type Sale = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  saleCode?: string;
  isVerified: boolean;
  role: string;
  createdAt:string;
  partnersCount: number;
};

export default function SalesManagementPage() {
  const [data, setData] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [, setDeleting] = useState<string | null>(null);
  
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    saleCode: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/users", {
        params: { role: "sale", page, search }
      });
      setData(res.data.users);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      toast.error("Failed to recruit sale data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (page === 1) {
        fetchData();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [page]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLock = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/admin/users/${id}`, { isVerified: !currentStatus });
      setData(prev => prev.map(u => u._id === id ? { ...u, isVerified: !currentStatus } : u));
      toast.success(currentStatus ? "Account Locked" : "Account Renewed");
    } catch (err) {
      toast.error("Authorization update failed.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await apiClient.post("/admin/users", { 
        ...form, 
        role: "sale" 
      });
      toast.success("Sales Agent Commissioned Successfully");
      setIsModalOpen(false);
      setForm({ name: "", email: "", password: "", saleCode: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create agent.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    try {
      setUpdating(true);
      await apiClient.put(`/admin/users/${editingSale._id}`, {
        name: form.name,
        email: form.email,
        saleCode: form.saleCode,
        ...(form.password ? { password: form.password } : {})
      });
      toast.success("Agent dossier updated.");
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update failed.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to decommission this agent? This action is permanent.")) return;
    try {
      setDeleting(id);
      await apiClient.delete(`/admin/users/${id}`);
      toast.success("Agent removed from force.");
      fetchData();
    } catch (err) {
      toast.error("Deletion failed.");
    } finally {
      setDeleting(null);
    }
  };

  const openEditModal = (sale: Sale) => {
    setEditingSale(sale);
    setForm({
      name: sale.name,
      email: sale.email,
      password: "",
      saleCode: sale.saleCode || ""
    });
    setIsEditModalOpen(true);
    setActiveMenu(null);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold italic text-ink mb-2">Sales Force Management</h1>
          <p className="text-muted text-sm font-medium">Control internal sale accounts and their performance metrics.</p>
        </div>
        <button 
          onClick={() => {
            setForm({ name: "", email: "", password: "", saleCode: "" });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-3 px-8 py-3 bg-ink text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-caramel transition-all shadow-xl shadow-ink/10 active:scale-95"
        >
          <UserPlus className="w-4 h-4" /> Create New Account
        </button>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div key="create-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-6">
             <motion.div 
               key="create-modal-backdrop"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsModalOpen(false)}
               className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
             />
             <motion.div 
               key="create-modal-content"
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-lg bg-[#FBF9F6] rounded-[3rem] shadow-2xl overflow-hidden border border-sand"
             >
                <div className="bg-ink p-8 text-white relative">
                   <div className="absolute top-8 right-8">
                     <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                   <h2 className="text-2xl font-serif font-bold italic">Recruit New Agent</h2>
                   <p className="text-[10px] uppercase tracking-widest font-bold text-white/50 mt-1">Assign internal sales credentials</p>
                </div>

                <form onSubmit={handleCreate} className="p-10 space-y-8">
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">Full Name</label>
                        <div className="relative">
                           <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                           <input 
                               required
                               value={form.name}
                               onChange={e => setForm({...form, name: e.target.value})}
                               placeholder="e.g. Jean Atelier"
                               className="w-full h-12 bg-white border border-sand rounded-2xl pl-12 pr-4 text-xs font-bold outline-none focus:border-caramel transition-all"
                           />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">Email Address</label>
                        <div className="relative">
                           <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                           <input 
                               required
                               type="email"
                               value={form.email}
                               onChange={e => setForm({...form, email: e.target.value})}
                               placeholder="agent@pnetai.com"
                               className="w-full h-12 bg-white border border-sand rounded-2xl pl-12 pr-4 text-xs font-bold outline-none focus:border-caramel transition-all"
                           />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">Temporary Password</label>
                          <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input 
                                required
                                type="password"
                                value={form.password}
                                onChange={e => setForm({...form, password: e.target.value})}
                                placeholder="••••••••"
                                className="w-full h-12 bg-white border border-sand rounded-2xl pl-12 pr-4 text-xs font-bold outline-none focus:border-caramel transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">Sale Code</label>
                          <input 
                              required
                              value={form.saleCode}
                              onChange={e => setForm({...form, saleCode: e.target.value.toUpperCase()})}
                              placeholder="SALE-001"
                              className="w-full h-12 bg-white border border-sand rounded-2xl px-5 text-xs font-black outline-none focus:border-caramel transition-all"
                          />
                        </div>
                      </div>
                   </div>

                   <button 
                     disabled={creating}
                     className="w-full py-5 bg-ink text-white font-serif font-bold italic text-xl rounded-full hover:bg-caramel transition-all shadow-2xl shadow-ink/10 active:scale-95 disabled:opacity-50"
                   >
                      {creating ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Deploy Agent"}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div key="edit-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-6">
             <motion.div 
               key="edit-modal-backdrop"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsEditModalOpen(false)}
               className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
             />
             <motion.div 
               key="edit-modal-content"
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-lg bg-[#FBF9F6] rounded-[3rem] shadow-2xl overflow-hidden border border-sand"
             >
                <div className="bg-caramel p-8 text-white relative">
                   <div className="absolute top-8 right-8">
                     <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                   <h2 className="text-2xl font-serif font-bold italic">Edit Agent Dossier</h2>
                   <p className="text-[10px] uppercase tracking-widest font-bold text-white/50 mt-1">Modify internal agent credentials</p>
                </div>

                <form onSubmit={handleUpdate} className="p-10 space-y-8">
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">Full Name</label>
                        <div className="relative">
                           <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                           <input 
                               required
                               value={form.name}
                               onChange={e => setForm({...form, name: e.target.value})}
                               className="w-full h-12 bg-white border border-sand rounded-2xl pl-12 pr-4 text-xs font-bold outline-none focus:border-caramel transition-all"
                           />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">Email Address</label>
                        <div className="relative">
                           <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                           <input 
                               required
                               type="email"
                               value={form.email}
                               onChange={e => setForm({...form, email: e.target.value})}
                               className="w-full h-12 bg-white border border-sand rounded-2xl pl-12 pr-4 text-xs font-bold outline-none focus:border-caramel transition-all"
                           />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">New Password (Optional)</label>
                          <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input 
                                type="password"
                                value={form.password}
                                onChange={e => setForm({...form, password: e.target.value})}
                                placeholder="Leave blank to keep current"
                                className="w-full h-12 bg-white border border-sand rounded-2xl pl-12 pr-4 text-xs font-bold outline-none focus:border-caramel transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">Sale Code</label>
                          <input 
                              required
                              value={form.saleCode}
                              onChange={e => setForm({...form, saleCode: e.target.value.toUpperCase()})}
                              className="w-full h-12 bg-white border border-sand rounded-2xl px-5 text-xs font-black outline-none focus:border-caramel transition-all"
                          />
                        </div>
                      </div>
                   </div>

                   <button 
                     disabled={updating}
                     className="w-full py-5 bg-caramel text-white font-serif font-bold italic text-xl rounded-full hover:bg-ink transition-all shadow-2xl shadow-caramel/10 active:scale-95 disabled:opacity-50"
                   >
                      {updating ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Update Credentials"}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white rounded-[2.5rem] border border-sand/50 p-8 shadow-sm flex items-center justify-between group hover:border-caramel/30 transition-all">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Active Agents</p>
               <h4 className="text-2xl font-bold text-ink">{data.filter(s => s.isVerified).length} Professional</h4>
            </div>
            <div className="w-12 h-12 bg-caramel/5 rounded-2xl flex items-center justify-center text-caramel group-hover:scale-110 transition-transform">
               <TrendingUp className="w-6 h-6" />
            </div>
         </div>
         <div className="bg-white rounded-[2.5rem] border border-sand/50 p-8 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all col-span-2">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Managed Partners</p>
               <h4 className="text-2xl font-bold text-ink">{data.reduce((acc, s) => acc + (s.partnersCount || 0), 0)} Units</h4>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
               <Users className="w-6 h-6" />
            </div>
         </div>
      </div>

      {/* Main Directory */}
      <div className="bg-white rounded-[3rem] border border-sand/50 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-sand/50 flex flex-wrap items-center justify-between gap-4 bg-warm/5">
           <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-caramel transition-colors" />
              <input 
                 type="text" 
                 placeholder="Search by name, email or sale code..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full h-12 bg-white border border-sand/40 rounded-2xl pl-12 pr-4 text-xs font-bold outline-none focus:border-caramel transition-all"
              />
           </div>
           <div className="flex items-center gap-3">
              <button className="p-3 bg-white border border-sand rounded-xl text-muted hover:text-ink transition-all hover:bg-warm">
                 <Filter className="w-4 h-4" />
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Agent Information</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Sale Code</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-center">Managed Partners</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/20">
              {loading ? (
                <tr>
                   <td colSpan={5} className="py-24 text-center">
                      <Loader2 className="w-8 h-8 text-caramel animate-spin mx-auto mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted">Syncing Sales Data...</p>
                   </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-24 text-center">
                      <p className="text-xs font-bold text-muted uppercase tracking-widest">No matching agents on file.</p>
                   </td>
                </tr>
              ) : data.map((sale, index) => (
                <tr key={sale._id} className="hover:bg-warm/10 transition-colors group">
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-warm border border-sand flex items-center justify-center text-xs font-black text-ink shadow-sm group-hover:bg-white transition-colors">
                           {sale.name[0]}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-ink mb-1">{sale.name}</p>
                           <p className="text-[10px] font-medium text-muted">{sale.email}</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-white border border-sand rounded-lg text-[10px] font-black text-caramel shadow-sm">
                       {sale.saleCode || 'N/A'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <p className="text-sm font-bold text-ink">{sale.partnersCount || 0}</p>
                    <p className="text-[8px] font-medium text-muted uppercase tracking-widest">Units</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${sale.isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                       {sale.isVerified ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                       {sale.isVerified ? 'Active' : 'Locked'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right relative">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                         onClick={() => toggleLock(sale._id, sale.isVerified)}
                         className={`p-2.5 rounded-xl border transition-all shadow-sm ${sale.isVerified ? 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100' : 'bg-emerald-50 border-emerald-100 text-emerald-500 hover:bg-emerald-100'}`}
                         title={sale.isVerified ? "Lock Agent" : "Unlock Agent"}
                       >
                          {sale.isVerified ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                       </button>
                       
                       <div className="relative">
                          <button 
                             onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(activeMenu === sale._id ? null : sale._id);
                             }}
                             className="p-2.5 rounded-xl bg-white border border-sand text-muted hover:text-ink transition-all shadow-sm"
                          >
                             <MoreVertical className="w-4 h-4" />
                          </button>

                          <AnimatePresence>
                             {activeMenu === sale._id && (
                                <motion.div 
                                   key={`menu-${sale._id}`}
                                   initial={{ opacity: 0, scale: 0.95, y: index > data.length - 3 ? 10 : -10 }}
                                   animate={{ opacity: 1, scale: 1, y: 0 }}
                                   exit={{ opacity: 0, scale: 0.95, y: index > data.length - 3 ? 10 : -10 }}
                                   ref={menuRef}
                                   className={`absolute right-0 w-48 bg-white rounded-2xl shadow-2xl border border-sand z-50 py-2 overflow-hidden ${index > data.length - 3 ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                                >
                                   <button 
                                     onClick={() => openEditModal(sale)}
                                     className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-ink hover:bg-warm transition-colors"
                                   >
                                      <Edit className="w-4 h-4 text-caramel" />
                                      Edit Dossier
                                   </button>
                                   <button 
                                     className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-ink hover:bg-warm transition-colors border-t border-sand/30"
                                     onClick={() => {
                                        toast.success("Performance report generation requested.");
                                        setActiveMenu(null);
                                     }}
                                   >
                                      <ArrowUpRight className="w-4 h-4 text-indigo-500" />
                                      View Activity
                                   </button>
                                   <button 
                                     onClick={() => {
                                        handleDelete(sale._id);
                                        setActiveMenu(null);
                                     }}
                                     className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors border-t border-sand/30"
                                   >
                                      <Trash2 className="w-4 h-4" />
                                      Decommission
                                   </button>
                                </motion.div>
                             )}
                          </AnimatePresence>
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-6 bg-white border-t border-sand/50 flex items-center justify-between">
           <p className="text-[10px] font-black text-muted uppercase tracking-widest">
             Archive Data: Showing {data.length} entries
           </p>
           <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2.5 rounded-xl bg-white border border-sand hover:bg-warm transition-all disabled:opacity-30">
                 <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2.5 rounded-xl bg-white border border-sand hover:bg-warm transition-all disabled:opacity-30">
                 <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
