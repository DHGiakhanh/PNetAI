import { useEffect, useState } from "react";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Trash2,
  Filter,
  PawPrint,
  Mail,
  User as UserIcon
} from "lucide-react";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";

type Pet = {
  _id: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  age: number;
  avatarUrl: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
  };
  createdAt: string;
};

export default function PetsManagementPage() {
  const [data, setData] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("");
  
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/pets", {
        params: { page, search, species }
      });
      setData(res.data.pets);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      toast.error("Failed to gather pets data.");
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
  }, [search, species]);

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely certain you wish to remove "${name}"? This action cannot be undone.`)) return;
    
    try {
      setDeletingId(id);
      await apiClient.delete(`/admin/pets/${id}`);
      setData(prev => prev.filter(p => p._id !== id));
      toast.success(`Pet "${name}" has been removed.`);
    } catch (err) {
      toast.error("Deletion failed.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold italic text-ink mb-2">Pet Directory</h1>
          <p className="text-muted text-sm font-medium">Manage and monitor all pets registered in the ecosystem.</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-sand/50 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-sand/50 bg-warm/5 flex flex-wrap items-center justify-between gap-4">
           <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input 
                 type="text" 
                 placeholder="Search by pet name, owner name or email..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full h-12 bg-white border border-sand/40 rounded-2xl pl-12 pr-4 text-xs font-bold outline-none focus:border-caramel transition-all"
              />
           </div>
           
           <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-muted" />
              <select 
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="h-12 bg-white border border-sand/40 rounded-2xl px-4 text-xs font-bold outline-none focus:border-caramel transition-all"
              >
                <option value="">All Species</option>
                <option value="Dog">Dogs</option>
                <option value="Cat">Cats</option>
                <option value="Other">Others</option>
              </select>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Pet</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Breed & Species</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Owner</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Registered At</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/20">
              {loading ? (
                <tr>
                   <td colSpan={5} className="py-24 text-center">
                      <Loader2 className="w-8 h-8 text-caramel animate-spin mx-auto mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted">Syncing Records...</span>
                   </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-24 text-center">
                      <p className="text-xs font-bold text-muted uppercase tracking-widest">No matching pets found.</p>
                   </td>
                </tr>
              ) : data.map((pet) => (
                <tr key={pet._id} className="hover:bg-warm/10 transition-colors group">
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-warm border border-sand flex items-center justify-center text-xs font-black text-ink shadow-sm overflow-hidden group-hover:bg-white transition-colors">
                           {pet.avatarUrl ? <img src={pet.avatarUrl} className="w-full h-full object-cover" /> : <PawPrint className="w-5 h-5 text-caramel/40" />}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-ink mb-1">{pet.name}</p>
                           <p className="text-[10px] font-medium text-muted">{pet.gender}, {pet.age} years old</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brown">{pet.species}</span>
                        <span className="text-xs font-medium text-muted">{pet.breed || "Mixed Breed"}</span>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                           <UserIcon className="w-3 h-3 text-caramel" />
                           <span className="text-xs font-bold text-ink">{pet.user?.name || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <Mail className="w-3 h-3 text-muted" />
                           <span className="text-[10px] font-medium text-muted">{pet.user?.email || "No email"}</span>
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-ink">
                       {new Date(pet.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-8 py-6 text-right relative">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                         onClick={() => handleDelete(pet._id, pet.name)}
                         disabled={deletingId === pet._id}
                         className="p-2.5 rounded-xl bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 transition-all shadow-sm disabled:opacity-50"
                         title="Remove Pet"
                       >
                          {deletingId === pet._id ? (
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
             Directory Insights: Page {page} of {totalPages}
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
