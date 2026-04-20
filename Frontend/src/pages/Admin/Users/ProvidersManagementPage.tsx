import { useEffect, useState } from "react";
import { 
  Building2, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  ShieldX,
  FileText,
  Eye,
  BarChart3,
  Loader2,
  Lock,
  Unlock,
  X,
  MapPin,
  Calendar,
  CreditCard,
  TrendingUp,
  ExternalLink,
  Phone,
  Mail,
  DollarSign,
  Trash2
} from "lucide-react";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type Provider = {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  providerOnboardingStatus?: string;
  createdAt: string;
  totalRevenue: number;
  bookingsCount: number;
  phone?: string;
  address?: string;
};

export default function ProvidersManagementPage() {
  const [data, setData] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [aptitudeState, setAptitudeState] = useState("all");

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isFinancialOpen, setIsFinancialOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = { role: "service_provider", page, search };
      
      if (aptitudeState === "verified") {
        params.providerOnboardingStatus = "approved";
        params.isVerified = "true";
      } else if (aptitudeState === "pending") {
        params.providerOnboardingStatus = "pending_legal_approval";
      } else if (aptitudeState === "suspended") {
        params.isVerified = "false";
      }

      const res = await apiClient.get("/admin/users", { params });
      setData(res.data.users);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      toast.error("Failed to fetch partner network.");
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
  }, [search, aptitudeState]);

  useEffect(() => {
    fetchData();
  }, [page]);

  const toggleLock = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/admin/users/${id}`, { isVerified: !currentStatus });
      setData(prev => prev.map(u => u._id === id ? { ...u, isVerified: !currentStatus } : u));
      toast.success(currentStatus ? "Provider Access Suspended" : "Provider Access Restored");
      if (selectedProvider?._id === id) {
        setSelectedProvider(prev => prev ? { ...prev, isVerified: !currentStatus } : null);
      }
    } catch (err) {
      toast.error("Moderation failure.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely certain you wish to terminate the partnership with "${name}"? This action will permanently purge all associated services and products from the ecosystem.`)) return;
    
    try {
      await apiClient.delete(`/admin/users/${id}`);
      setData(prev => prev.filter(u => u._id !== id));
      toast.success(`${name} and all associated assets have been purged.`);
      if (selectedProvider?._id === id) {
        setIsDossierOpen(false);
        setSelectedProvider(null);
      }
    } catch (err) {
      toast.error("Operation failed. Partner integrity maintained.");
    }
  };

  const getStatusBadge = (onboarding: string, verified: boolean) => {
    if (onboarding === "approved" && verified) return { label: "Verified Partner", style: "bg-emerald-50 text-emerald-600 border-emerald-100" };
    if (onboarding === "pending_legal_approval") return { label: "Pending Review", style: "bg-amber-50 text-amber-600 border-amber-100" };
    return { label: "Unverified", style: "bg-sand/30 text-muted border-sand/50" };
  };

  const openDossier = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsDossierOpen(true);
  };

  const openFinancial = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsFinancialOpen(true);
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold italic text-ink mb-2">Partner Network</h1>
          <p className="text-muted text-sm font-medium">Manage Service Providers (Clinics) and Pet Shops in the ecosystem.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-6 py-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 text-xs font-bold text-white flex items-center gap-3">
              <ShieldCheck className="w-4 h-4" />
              {data.filter(d => d.providerOnboardingStatus === 'approved').length} Accredited Partners
           </div>
        </div>
      </div>

      {/* Partner Directory Filter */}
      <div className="bg-white rounded-3xl border border-sand/50 p-6 shadow-sm flex flex-wrap items-center gap-4 group hover:border-caramel/30 transition-all">
        <div className="relative flex-1 min-w-[300px]">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-caramel transition-colors" />
           <input 
             type="text" 
             placeholder="Search partners by business name or email..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full h-11 bg-warm/20 border border-sand/40 rounded-2xl pl-12 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-caramel transition-all"
           />
        </div>

        <select 
          value={aptitudeState}
          onChange={(e) => setAptitudeState(e.target.value)}
          className="h-11 px-6 bg-warm/20 border border-sand/40 rounded-2xl text-xs font-bold outline-none focus:border-caramel transition-all cursor-pointer hover:bg-white"
        >
          <option value="all">All Aptitude Status</option>
          <option value="verified">Verified Partners</option>
          <option value="pending">Pending Review</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Partner Atelier Table */}
      <div className="bg-white rounded-[3rem] border border-sand/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-warm/5">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Partner Establishment</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Aptitude Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Financial Tracking</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Account Management</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/20">
              {loading ? (
                <tr>
                   <td colSpan={5} className="py-24 text-center">
                      <Loader2 className="w-8 h-8 text-caramel animate-spin mx-auto mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted">Consulting Partner Ledger...</span>
                   </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-24 text-center">
                      <p className="text-xs font-bold text-muted uppercase tracking-widest">No matching partners on file.</p>
                   </td>
                </tr>
              ) : data.map((provider) => {
                const badge = getStatusBadge(provider.providerOnboardingStatus || "", provider.isVerified);
                return (
                  <tr key={provider._id} className="hover:bg-warm/10 transition-colors group">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-sand flex items-center justify-center text-caramel shadow-sm overflow-hidden group-hover:border-caramel/50 transition-colors">
                             {(provider as any).logoUrl ? <img src={(provider as any).logoUrl} className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6" />}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-ink mb-1">{provider.name}</p>
                             <p className="text-[10px] font-bold text-caramel uppercase tracking-widest">{provider.role === 'service_provider' ? 'Clinic' : 'Pet Shop'}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${badge.style}`}>
                          {badge.label}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                         <div className="text-center">
                            <p className="text-xs font-bold text-ink">${(provider.totalRevenue || 0).toLocaleString()}</p>
                            <p className="text-[8px] font-bold text-muted uppercase tracking-widest">GMV</p>
                         </div>
                         <div className="w-px h-6 bg-sand" />
                         <div className="text-center">
                            <p className="text-xs font-bold text-ink">{provider.bookingsCount || 0}</p>
                            <p className="text-[8px] font-bold text-muted uppercase tracking-widest">Bookings</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-[10px] font-bold text-ink uppercase tracking-widest mb-1 italic">
                          {provider.providerOnboardingStatus?.replace(/_/g, ' ') || 'Registered'}
                       </p>
                       <p className="text-[9px] font-black text-caramel uppercase tracking-widest">
                          {(provider as any).managedBy?.name ? `Agent: ${(provider as any).managedBy.name}` : "Direct Deal"}
                       </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button 
                            onClick={() => openDossier(provider)}
                            className="p-2.5 rounded-xl bg-white border border-sand text-muted hover:text-caramel transition-all shadow-sm" 
                            title="View Dossier"
                         >
                            <Eye className="w-4 h-4" />
                         </button>
                         <button 
                            onClick={() => openFinancial(provider)}
                            className="p-2.5 rounded-xl bg-white border border-sand text-muted hover:text-indigo-600 transition-all shadow-sm" 
                            title="Financial Report"
                         >
                            <BarChart3 className="w-4 h-4" />
                         </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); toggleLock(provider._id, provider.isVerified); }}
                            className={`p-2.5 rounded-xl border transition-all shadow-sm ${provider.isVerified ? 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100' : 'bg-emerald-50 border-emerald-100 text-emerald-500 hover:bg-emerald-100'}`}
                            title={provider.isVerified ? "Deactivate" : "Activate"}
                         >
                            {provider.isVerified ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                         </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(provider._id, provider.name); }}
                            className="p-2.5 rounded-xl bg-white border border-sand text-muted hover:text-rose-600 transition-all shadow-sm" 
                            title="Purge Partner"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-6 bg-white border-t border-sand/50 flex items-center justify-between">
           <p className="text-[10px] font-black text-muted uppercase tracking-widest">
             Partner Ecosystem Archive: {data.length} Registered
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

      {/* Dossier Modal */}
      <AnimatePresence>
        {isDossierOpen && selectedProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsDossierOpen(false)}
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
                     <button onClick={() => setIsDossierOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                   <div className="flex items-start gap-6">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-caramel shadow-xl overflow-hidden shrink-0">
                         {(selectedProvider as any).logoUrl ? <img src={(selectedProvider as any).logoUrl} className="w-full h-full object-cover" /> : <Building2 className="w-10 h-10" />}
                      </div>
                      <div>
                         <h2 className="text-3xl font-serif font-bold italic">{selectedProvider.name}</h2>
                         <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/50 mt-1">{selectedProvider.role === 'service_provider' ? 'Accredited Medical Clinic' : 'Premium Pet Shop'}</p>
                         <div className="flex items-center gap-4 mt-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${selectedProvider.isVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                               {selectedProvider.isVerified ? 'Active Partner' : 'Suspended'}
                            </span>
                             <span className="text-[10px] font-bold text-white/40 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> Member since {new Date(selectedProvider.createdAt).getFullYear()}
                             </span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-8">
                      <div>
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 border-b border-sand pb-2">Business Information</h4>
                         <div className="space-y-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-warm border border-sand flex items-center justify-center text-muted">
                                  <Mail className="w-4 h-4" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Main Email</p>
                                  <p className="text-xs font-bold text-ink">{selectedProvider.email}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-warm border border-sand flex items-center justify-center text-muted">
                                  <Phone className="w-4 h-4" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Phone Line</p>
                                  <p className="text-xs font-bold text-ink">{selectedProvider.phone || "+84 (0) 902 123 456"}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-warm border border-sand flex items-center justify-center text-muted">
                                  <MapPin className="w-4 h-4" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Office Location</p>
                                  <p className="text-xs font-bold text-ink truncate w-48">{selectedProvider.address || "District 1, Ho Chi Minh City"}</p>
                               </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                               <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                                  <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                   <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Assigned Agent</p>
                                   <p className="text-xs font-bold text-indigo-600">{(selectedProvider as any).managedBy?.name || "Direct Registration"}</p>
                                </div>
                            </div>
                         </div>
                      </div>

                      <div>
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 border-b border-sand pb-2">Technical Status</h4>
                         <div className="space-y-3">
                            <div className="flex items-center gap-3 px-4 py-3 bg-white border border-sand rounded-2xl">
                                {selectedProvider.providerOnboardingStatus === 'approved' ? (
                                   <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                ) : selectedProvider.providerOnboardingStatus === 'pending_legal_approval' ? (
                                   <FileText className="w-5 h-5 text-amber-500" />
                                ) : (
                                   <ShieldX className="w-5 h-5 text-rose-500" />
                                )}
                                <div>
                                   <p className="text-[10px] font-bold text-ink">Onboarding Documents</p>
                                   <p className="text-[9px] font-medium text-muted">
                                      {selectedProvider.providerOnboardingStatus === 'approved' 
                                         ? `Verified & Stamped on ${new Date(selectedProvider.createdAt).toLocaleDateString()}`
                                         : selectedProvider.providerOnboardingStatus === 'pending_legal_approval'
                                         ? "Documents under legal review"
                                         : "No legal documentation submitted yet"}
                                   </p>
                                </div>
                            </div>

                            {/* Legal Documents Archive */}
                            <div className="grid grid-cols-2 gap-3">
                               <div className="p-4 bg-white border border-sand rounded-2xl">
                                  <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-2">Clinic License</p>
                                  {(selectedProvider as any).legalDocuments?.clinicLicenseUrl ? (
                                     <a 
                                       href={(selectedProvider as any).legalDocuments?.clinicLicenseUrl} 
                                       target="_blank" 
                                       className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
                                     >
                                        <FileText className="w-4 h-4" />
                                        <span className="text-[10px] font-bold underline">View PDF</span>
                                     </a>
                                  ) : (
                                     <div className="flex items-center gap-2 text-muted opacity-50">
                                        <ShieldX className="w-4 h-4" />
                                        <span className="text-[10px] font-bold">Missing</span>
                                     </div>
                                  )}
                               </div>
                               <div className="p-4 bg-white border border-sand rounded-2xl">
                                  <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-2">Business Reg</p>
                                  {(selectedProvider as any).legalDocuments?.businessLicenseUrl ? (
                                     <a 
                                       href={(selectedProvider as any).legalDocuments?.businessLicenseUrl} 
                                       target="_blank" 
                                       className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
                                     >
                                        <FileText className="w-4 h-4" />
                                        <span className="text-[10px] font-bold underline">View Doc</span>
                                     </a>
                                  ) : (
                                     <div className="flex items-center gap-2 text-muted opacity-50">
                                        <ShieldX className="w-4 h-4" />
                                        <span className="text-[10px] font-bold">Missing</span>
                                     </div>
                                  )}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div>
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 border-b border-sand pb-2">Engagement Overview</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white border border-sand rounded-2xl text-center">
                               <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-1">Total Bookings</p>
                               <p className="text-xl font-bold text-ink">{selectedProvider.bookingsCount}</p>
                            </div>
                            <div className="p-4 bg-white border border-sand rounded-2xl text-center">
                               <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-1">Success Rate</p>
                               <p className="text-xl font-bold text-emerald-600">98%</p>
                            </div>
                         </div>
                      </div>

                       <div className="p-6 bg-ink rounded-3xl text-white space-y-4">
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Moderation Zone</p>
                          <div className="flex gap-4">
                             <button 
                               onClick={() => toggleLock(selectedProvider._id, selectedProvider.isVerified)}
                               className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${selectedProvider.isVerified ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                             >
                                {selectedProvider.isVerified ? "Suspend Access" : "Restore Access"}
                             </button>
                             <button 
                               onClick={() => handleDelete(selectedProvider._id, selectedProvider.name)}
                               className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                             >
                                <Trash2 className="w-3.5 h-3.5" /> Purge
                             </button>
                          </div>
                       </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Financial Modal */}
      <AnimatePresence>
        {isFinancialOpen && selectedProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsFinancialOpen(false)}
               className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-sand"
             >
                <div className="p-10 border-b border-sand flex items-center justify-between">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-1 italic">Partner Financial Insights</p>
                      <h2 className="text-2xl font-serif font-bold italic text-ink">{selectedProvider.name}</h2>
                   </div>
                   <button onClick={() => setIsFinancialOpen(false)} className="p-2.5 bg-warm border border-sand rounded-full text-muted hover:text-ink transition-all">
                      <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="p-10 space-y-10">
                   <div className="grid grid-cols-3 gap-6">
                      <div className="p-6 bg-warm/50 border border-sand/50 rounded-3xl">
                         <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm mb-4">
                            <TrendingUp className="w-5 h-5" />
                         </div>
                         <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-1">Total Revenue</p>
                         <p className="text-xl font-bold text-ink">${selectedProvider.totalRevenue.toLocaleString()}</p>
                      </div>
                      <div className="p-6 bg-warm/50 border border-sand/50 rounded-3xl">
                         <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-caramel shadow-sm mb-4">
                            <CreditCard className="w-5 h-5" />
                         </div>
                         <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-1">Commission Rate</p>
                         <p className="text-xl font-bold text-ink">12%</p>
                      </div>
                      <div className="p-6 bg-ink border border-ink rounded-3xl text-white">
                         <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-4">
                            <DollarSign className="w-5 h-5" />
                         </div>
                         <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">Net Earnings</p>
                         <p className="text-xl font-bold">${(selectedProvider.totalRevenue * 0.88).toLocaleString()}</p>
                      </div>
                   </div>

                   <div className="bg-white border border-sand rounded-[2rem] overflow-hidden">
                      <div className="p-6 bg-warm/20 border-b border-sand flex items-center justify-between">
                         <p className="text-[10px] font-black text-ink uppercase tracking-widest">Recent Cashflow</p>
                         <button className="text-[9px] font-black text-caramel uppercase tracking-widest flex items-center gap-1 hover:underline">
                            Export Ledger <ExternalLink className="w-3 h-3" />
                         </button>
                      </div>
                      <div className="p-6 space-y-4">
                         {[
                            { desc: "Appointment #BK-9021", date: "Today", amount: 150, type: "credit" },
                            { desc: "System Commission Fee", date: "Today", amount: -18, type: "debit" },
                            { desc: "Grooming Service #BK-8842", date: "Yesterday", amount: 85, type: "credit" }
                         ].map((tx, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-sand/30 last:border-0">
                               <div>
                                  <p className="text-xs font-bold text-ink">{tx.desc}</p>
                                  <p className="text-[9px] font-medium text-muted">{tx.date}</p>
                               </div>
                               <p className={`text-xs font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  {tx.type === 'credit' ? '+' : '-'}${Math.abs(tx.amount)}
                               </p>
                            </div>
                         ))}
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
