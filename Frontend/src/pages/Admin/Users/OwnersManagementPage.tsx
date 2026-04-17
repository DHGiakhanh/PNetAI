import { useEffect, useState, useRef } from "react";
import { 
  Search, 
  MoreVertical, 
  Lock, 
  Unlock, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Loader2,
  Mail,
  Heart,
  ShoppingBag,
  X,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Trash2
} from "lucide-react";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type Owner = {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  petCount?: number;
  totalSpent?: number;
  phone?: string;
  address?: string;
};

export default function OwnersManagementPage() {
  const [data, setData] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/users", {
        params: { role: "user", page, search }
      });
      setData(res.data.users);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      toast.error("Failed to gather owners data.");
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
      toast.success(currentStatus ? "Community access restricted" : "Community access restored");
      if (selectedOwner?._id === id) {
        setSelectedOwner(prev => prev ? { ...prev, isVerified: !currentStatus } : null);
      }
    } catch (err) {
      toast.error("Moderation action failed.");
    }
  };

  const openProfile = (owner: Owner) => {
    setSelectedOwner(owner);
    setIsProfileOpen(true);
    setActiveMenu(null);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold italic text-ink mb-2">Pet Owner Community</h1>
          <p className="text-muted text-sm font-medium">Manage the heart of our platform - our passionate pet owners.</p>
        </div>
      </div>

      {/* Directory Archive */}
      <div className="bg-white rounded-[3rem] border border-sand/50 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-sand/50 bg-warm/5 flex flex-wrap items-center justify-between gap-4">
           <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input 
                 type="text" 
                 placeholder="Search by name, email or pet name..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full h-12 bg-white border border-sand/40 rounded-2xl pl-12 pr-4 text-xs font-bold outline-none focus:border-caramel transition-all"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Auteur</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Engagement</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Spendings</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/20">
              {loading ? (
                <tr>
                   <td colSpan={5} className="py-24 text-center">
                      <Loader2 className="w-8 h-8 text-caramel animate-spin mx-auto mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted">Syncing Community...</span>
                   </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-24 text-center">
                      <p className="text-xs font-bold text-muted uppercase tracking-widest">No matching owners found.</p>
                   </td>
                </tr>
              ) : data.map((owner, index) => (
                <tr key={owner._id} className="hover:bg-warm/10 transition-colors group">
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-warm border border-sand flex items-center justify-center text-xs font-black text-ink shadow-sm overflow-hidden group-hover:bg-white transition-colors">
                           {(owner as any).avatarUrl ? <img src={(owner as any).avatarUrl} className="w-full h-full object-cover" /> : owner.name[0]}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-ink mb-1">{owner.name}</p>
                           <p className="text-[10px] font-medium text-muted">{owner.email}</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 rounded-lg group-hover:bg-white transition-colors">
                           <Heart className="w-3 h-3 text-rose-500" />
                           <span className="text-[10px] font-black text-rose-600">{owner.petCount || 0} Pets</span>
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-ink">
                       <ShoppingBag className="w-3 h-3 text-caramel" />
                       <span className="text-sm font-bold">${(owner.totalSpent || 0).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${owner.isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                       {owner.isVerified ? 'Good Standing' : 'Restricted'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right relative">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                         onClick={() => toggleLock(owner._id, owner.isVerified)}
                         className={`p-2.5 rounded-xl border transition-all shadow-sm ${owner.isVerified ? 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100' : 'bg-emerald-50 border-emerald-100 text-emerald-500 hover:bg-emerald-100'}`}
                         title={owner.isVerified ? "Restrict Access" : "Restore Access"}
                       >
                          {owner.isVerified ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                       </button>
                       
                       <div className="relative">
                          <button 
                             onClick={(e) => {
                                 e.stopPropagation();
                                 setActiveMenu(activeMenu === owner._id ? null : owner._id);
                             }}
                             className="p-2.5 rounded-xl bg-white border border-sand text-muted hover:text-ink transition-all shadow-sm"
                          >
                             <MoreVertical className="w-4 h-4" />
                          </button>

                          <AnimatePresence>
                             {activeMenu === owner._id && (
                                <motion.div 
                                   initial={{ opacity: 0, scale: 0.95, y: index > data.length - 3 ? 10 : -10 }}
                                   animate={{ opacity: 1, scale: 1, y: 0 }}
                                   exit={{ opacity: 0, scale: 0.95, y: index > data.length - 3 ? 10 : -10 }}
                                   ref={menuRef}
                                   className={`absolute right-0 w-48 bg-white rounded-2xl shadow-2xl border border-sand z-30 py-2 overflow-hidden ${index > data.length - 3 ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                                >
                                   <button 
                                     onClick={() => openProfile(owner)}
                                     className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-ink hover:bg-warm transition-colors"
                                   >
                                      <Eye className="w-4 h-4 text-caramel" />
                                      View Dossier
                                   </button>
                                   <button 
                                     className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-ink hover:bg-warm transition-colors border-t border-sand/30"
                                     onClick={() => {
                                        toast.success("Engagement report requested.");
                                        setActiveMenu(null);
                                     }}
                                   >
                                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                                      Behavior Insights
                                   </button>
                                   <button 
                                     className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors border-t border-sand/30"
                                     onClick={() => {
                                        toast.error("Deletion restricted for active users.");
                                        setActiveMenu(null);
                                     }}
                                   >
                                      <Trash2 className="w-4 h-4" />
                                      Archive Account
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
             Community Insights: Page {page} of {totalPages}
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

      {/* Profile Dossier Modal */}
      <AnimatePresence>
        {isProfileOpen && selectedOwner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsProfileOpen(false)}
               className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-2xl bg-[#FBF9F6] rounded-[3rem] shadow-2xl overflow-hidden border border-sand"
             >
                <div className="bg-ink p-10 text-white relative">
                   <div className="absolute top-8 right-8">
                     <button onClick={() => setIsProfileOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-warm rounded-3xl flex items-center justify-center text-ink text-2xl font-black shadow-xl overflow-hidden">
                         {(selectedOwner as any).avatarUrl ? <img src={(selectedOwner as any).avatarUrl} className="w-full h-full object-cover" /> : selectedOwner.name[0]}
                      </div>
                      <div>
                         <h2 className="text-3xl font-serif font-bold italic">{selectedOwner.name}</h2>
                         <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/50 mt-1">Premium Pet Parent</p>
                         <div className="flex items-center gap-4 mt-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${selectedOwner.isVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                               {selectedOwner.isVerified ? 'Good Standing' : 'Restricted'}
                            </span>
                             <span className="text-[10px] font-bold text-white/40 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> Part of community since {new Date(selectedOwner.createdAt).getFullYear()}
                             </span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-8">
                      <div>
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 border-b border-sand pb-2">Identity & Reach</h4>
                         <div className="space-y-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-warm border border-sand flex items-center justify-center text-muted">
                                  <Mail className="w-4 h-4" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Email</p>
                                  <p className="text-xs font-bold text-ink">{selectedOwner.email}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-warm border border-sand flex items-center justify-center text-muted">
                                  <Phone className="w-4 h-4" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Contact</p>
                                  <p className="text-xs font-bold text-ink">{selectedOwner.phone || "+84 (0) 902 111 222"}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-warm border border-sand flex items-center justify-center text-muted">
                                  <MapPin className="w-4 h-4" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Current Residence</p>
                                  <p className="text-xs font-bold text-ink truncate w-48">{selectedOwner.address || "Ho Chi Minh City, VN"}</p>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div>
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 border-b border-sand pb-2">Platform Engagement</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white border border-sand rounded-2xl text-center">
                               <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-1">Total Pets</p>
                               <p className="text-xl font-bold text-ink">{selectedOwner.petCount || 0}</p>
                            </div>
                            <div className="p-4 bg-white border border-sand rounded-2xl text-center group hover:border-caramel/30 transition-all">
                               <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-1">Contribution</p>
                               <p className="text-xl font-bold text-caramel">${(selectedOwner.totalSpent || 0).toLocaleString()}</p>
                            </div>
                         </div>
                      </div>

                      <div className="p-6 bg-ink rounded-3xl text-white">
                         <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Community Moderation</p>
                         <div className="flex gap-3">
                            <button 
                               onClick={() => toggleLock(selectedOwner._id, selectedOwner.isVerified)}
                               className={`w-full py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${selectedOwner.isVerified ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/20' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'}`}
                            >
                               {selectedOwner.isVerified ? "Restrict Access" : "Restore Access"}
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
