import { useEffect, useState } from "react";
import { 
  Search, 
  Lock, 
  Unlock, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Heart,
  ShoppingBag,
  Trash2
} from "lucide-react";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";

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
  status: "active" | "inactive" | "locked";
  lastLoginAt: string;
};

export default function OwnersManagementPage() {
  const [data, setData] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const toggleLock = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/admin/users/${id}`, { isVerified: !currentStatus });
      setData(prev => prev.map(u => u._id === id ? { ...u, isVerified: !currentStatus } : u));
      toast.success(currentStatus ? "Community access restricted" : "Community access restored");
    } catch (err) {
      toast.error("Moderation action failed.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely certain you wish to purge "${name}" from the community? This action is permanent and will remove all associated pets and data.`)) return;
    
    try {
      setDeletingId(id);
      await apiClient.delete(`/admin/users/${id}`);
      setData(prev => prev.filter(u => u._id !== id));
      toast.success(`Owner "${name}" has been purged from the ecosystem.`);
    } catch (err) {
      toast.error("Deletion failed. User integrity maintained.");
    } finally {
      setDeletingId(null);
    }
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
              ) : data.map((owner) => (
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
                    <div className="flex flex-col gap-1.5">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm w-fit ${
                          owner.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          owner.status === 'inactive' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                          'bg-rose-50 text-rose-600 border-rose-100'
                       }`}>
                          {owner.status}
                       </span>
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-bold text-muted transition-opacity ${owner.isVerified ? 'opacity-100' : 'opacity-40'}`}>
                          {owner.isVerified ? 'Verified' : 'Unverified'}
                       </span>
                    </div>
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
                       
                       <button 
                         onClick={() => handleDelete(owner._id, owner.name)}
                         disabled={deletingId === owner._id}
                         className="p-2.5 rounded-xl bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 transition-all shadow-sm disabled:opacity-50"
                         title="Purge Account"
                       >
                          {deletingId === owner._id ? (
                             <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                             <Trash2 className="w-4 h-4" />
                          )}
                       </button>
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

    </div>
  );
}
