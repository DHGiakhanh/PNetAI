import { useState, useEffect } from "react";
import { CheckCircle2, FileText, UserCheck, Loader2, Search } from "lucide-react";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";

interface Provider {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  providerOnboardingStatus: string;
  createdAt: string;
  phone?: string;
  address?: string;
  legalDocuments?: {
    clinicName?: string;
    clinicLicenseNumber?: string;
    clinicLicenseUrl?: string;
    businessLicenseUrl?: string;
    doctorLicenseUrl?: string;
    submittedAt?: string;
  };
}

interface SalePendingApprovalsPageProps {
  mode: "account" | "legal";
}

export default function SalePendingApprovalsPage({ mode }: SalePendingApprovalsPageProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/sale/service-providers/pending");
      const allPending = res.data.pendingProviders || [];
      
      // Filter based on mode
      const filtered = allPending.filter((p: Provider) => {
        if (mode === "account") {
          return !p.isVerified || p.providerOnboardingStatus === "pending_sale_approval";
        } else {
          return p.providerOnboardingStatus === "pending_legal_approval";
        }
      });
      
      setProviders(filtered);
    } catch (error) {
      toast.error("Could not load pending requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [mode]);

  const handleApprove = async (id: string) => {
    try {
      setApprovingId(id);
      const res = await apiClient.put(`/sale/service-providers/${id}/approve`);
      toast.success(res.data.message || "Approval successful");
      setProviders(prev => prev.filter(p => p._id !== id));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Approval failed.");
    } finally {
      setApprovingId(null);
    }
  };

  const filteredProviders = providers.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold italic text-ink">
            {mode === "account" ? "Account Verification" : "Legal Document Review"}
          </h1>
          <p className="text-muted text-sm font-medium mt-1">
            {mode === "account" 
              ? "Verify new partner accounts before they can access the workspace." 
              : "Review uploaded medical and business certifications."}
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text"
            placeholder="Search pending..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 bg-white border border-sand rounded-2xl pl-12 pr-4 text-sm font-bold outline-none focus:border-brown transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-sand shadow-sm">
          <Loader2 className="w-10 h-10 text-brown animate-spin mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-muted">Consulting Registry...</p>
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-sand shadow-sm text-center px-6">
          <div className="w-20 h-20 bg-warm rounded-full flex items-center justify-center mb-6">
             <CheckCircle2 className="w-10 h-10 text-brown/20" />
          </div>
          <h3 className="text-xl font-bold text-ink mb-2 italic">All Caught Up!</h3>
          <p className="text-sm text-muted max-w-xs">{`No pending ${mode} approvals found at this moment.`}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProviders.map((provider) => (
            <div key={provider._id} className="bg-white rounded-[2.5rem] border border-sand p-8 shadow-sm hover:shadow-xl hover:shadow-brown/5 transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-warm flex items-center justify-center text-brown border border-sand">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink group-hover:text-brown transition-colors">{provider.name}</h3>
                    <p className="text-xs font-semibold text-muted">{provider.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                       <span className="px-3 py-1 rounded-full bg-brown/5 text-[9px] font-black uppercase tracking-widest text-brown border border-brown/10">
                          {provider.role.replace('_', ' ')}
                       </span>
                       <span className="text-[10px] font-bold text-muted italic">
                          Requested {new Date(provider.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                  </div>
                </div>
              </div>

              {mode === "legal" && provider.legalDocuments && (
                <div className="mb-8 p-6 bg-warm/30 rounded-3xl border border-sand space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                     <FileText className="w-4 h-4 text-brown" />
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-ink">Submitted Dossier</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div>
                        <p className="text-[9px] font-black text-muted uppercase tracking-tighter">Facility Name</p>
                        <p className="text-xs font-bold text-ink">{provider.legalDocuments.clinicName || "Not specified"}</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-muted uppercase tracking-tighter">License Number</p>
                        <p className="text-xs font-bold text-ink">{provider.legalDocuments.clinicLicenseNumber || "N/A"}</p>
                     </div>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                     {provider.legalDocuments.clinicLicenseUrl && (
                        <a 
                          href={provider.legalDocuments.clinicLicenseUrl} 
                          target="_blank" 
                          className="flex-1 py-3 bg-white border border-sand rounded-xl text-[10px] font-black uppercase tracking-widest text-center text-brown hover:bg-brown hover:text-white transition-all shadow-sm"
                        >
                           View Clinic License
                        </a>
                     )}
                     {provider.legalDocuments.businessLicenseUrl && (
                        <a 
                          href={provider.legalDocuments.businessLicenseUrl} 
                          target="_blank" 
                          className="flex-1 py-3 bg-white border border-sand rounded-xl text-[10px] font-black uppercase tracking-widest text-center text-brown hover:bg-brown hover:text-white transition-all shadow-sm"
                        >
                           View Business License
                        </a>
                     )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleApprove(provider._id)}
                  disabled={approvingId === provider._id}
                  className="flex-1 h-12 bg-brown text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brown/20 hover:bg-brown-dark transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {approvingId === provider._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {mode === "account" ? "Approve Account" : "Approve Legal Docs"}
                    </>
                  )}
                </button>
                <button className="px-6 h-12 bg-white border border-sand text-muted rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-warm transition-all">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
