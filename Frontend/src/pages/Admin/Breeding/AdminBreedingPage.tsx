import { useEffect, useState } from "react";
import { 
  Check, 
  X, 
  Slash, 
  Loader2, 
  Heart, 
  Calendar,
  User,
  ImageIcon
} from "lucide-react";
import { motion } from "framer-motion";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";

type Pet = {
  _id: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  age: number;
  avatarUrl?: string;
};

type UserInfo = {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

type BreedingListing = {
  _id: string;
  pet: Pet;
  user: UserInfo;
  title: string;
  description: string;
  images: string[];
  status: "pending" | "approved" | "disabled" | "rejected";
  createdAt: string;
};

export default function AdminBreedingPage() {
  const [listings, setListings] = useState<BreedingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("pending");

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/breeding/listings");
      setListings(res.data.listings || []);
    } catch (error) {
      toast.error("Could not load breeding listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleStatusChange = async (listingId: string, status: "approved" | "disabled" | "rejected") => {
    if (!window.confirm(`Are you sure you want to set this listing status to ${status}?`)) return;
    try {
      setProcessingId(listingId);
      await apiClient.patch(`/admin/breeding/listings/${listingId}/status`, { status });
      toast.success(`Listing ${status} successfully!`);
      
      // Update local state
      setListings(prev => 
        prev.map(list => list._id === listingId ? { ...list, status } : list)
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update listing status.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredListings = listings.filter(item => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-caramel">Moderation Center</p>
          <h1 className="font-serif text-4xl font-bold italic text-ink tracking-tight mt-1">Breeding Queue</h1>
          <p className="text-xs text-muted/60 font-medium mt-2 leading-relaxed">
            Approve, disable, or reject breeding listing proposals to keep the matchmaker healthy.
          </p>
        </div>

        {/* Status segment filters */}
        <div className="flex bg-white p-1 rounded-2xl border border-sand/50 shadow-sm self-start">
          {["pending", "approved", "disabled", "rejected", "all"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterStatus === status
                  ? "bg-ink text-white shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Queue */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-caramel mb-4" />
          <p className="text-sm font-medium text-muted italic">Consulting listings cache...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center p-20 bg-white rounded-[2.5rem] border border-sand/50 shadow-sm">
          <Heart className="w-12 h-12 text-muted/20 mx-auto mb-4" />
          <h3 className="text-xl font-serif font-bold italic text-ink mb-1">Queue Empty</h3>
          <p className="text-xs text-muted/40 font-medium">There are no breeding listings matching status "{filterStatus}".</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredListings.map((list) => (
            <motion.article
              key={list._id}
              layout
              className="bg-white rounded-[2.5rem] p-6 border border-sand/50 shadow-sm flex flex-col md:flex-row gap-6 items-start"
            >
              {/* Image Preview */}
              <div className="w-full md:w-48 aspect-video md:aspect-square rounded-[1.5rem] overflow-hidden bg-warm border border-sand flex-shrink-0 relative">
                {list.images && list.images.length > 0 ? (
                  <img src={list.images[0]} className="w-full h-full object-cover" />
                ) : list.pet?.avatarUrl ? (
                  <img src={list.pet.avatarUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted/20">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                
                {/* Image counter */}
                {list.images && list.images.length > 1 && (
                  <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    +{list.images.length - 1} more
                  </span>
                )}
              </div>

              {/* Body details */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-caramel uppercase tracking-[0.2em]">
                      {list.pet?.species || "Unknown Species"} &bull; {list.pet?.breed || "Unknown Breed"}
                    </span>
                    <h3 className="font-serif text-2xl font-bold italic text-ink mt-1">
                      {list.title}
                    </h3>
                  </div>

                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    list.status === "approved"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : list.status === "rejected"
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : list.status === "disabled"
                      ? "bg-gray-50 text-gray-500 border border-gray-200"
                      : "bg-amber-50 text-amber-600 border border-amber-200"
                  }`}>
                    {list.status}
                  </span>
                </div>

                <p className="text-sm font-medium text-ink/75 leading-relaxed whitespace-pre-wrap">
                  {list.description}
                </p>

                {/* Compare attributes / Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-sand/30 text-xs">
                  
                  {/* Pet attributes */}
                  <div className="space-y-1.5">
                    <p className="font-bold text-ink uppercase tracking-wider text-[10px] text-muted">Pet Details</p>
                    <p className="font-medium">Name: <strong className="text-ink font-bold">{list.pet?.name || "N/A"}</strong></p>
                    <p className="font-medium">Gender: <strong className="text-ink font-bold">{list.pet?.gender || "N/A"}</strong></p>
                    <p className="font-medium">Age: <strong className="text-ink font-bold">{list.pet?.age !== undefined ? `${list.pet.age} Years` : "N/A"}</strong></p>
                  </div>

                  {/* Owner attributes */}
                  <div className="space-y-1.5">
                    <p className="font-bold text-ink uppercase tracking-wider text-[10px] text-muted">Owner details</p>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-warm overflow-hidden border border-sand flex items-center justify-center">
                        {list.user?.avatarUrl ? (
                          <img src={list.user.avatarUrl} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-3 h-3 text-caramel/40" />
                        )}
                      </div>
                      <p className="font-bold text-ink">{list.user?.name || "N/A"}</p>
                    </div>
                    <p className="font-medium text-muted/60">{list.user?.email || "N/A"}</p>
                    <p className="font-medium text-muted/40 text-[10px] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Created: {new Date(list.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Side action controls */}
              <div className="w-full md:w-auto flex md:flex-col gap-2 shrink-0 md:self-stretch justify-end border-t md:border-t-0 pt-4 md:pt-0">
                {list.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleStatusChange(list._id, "approved")}
                      disabled={processingId !== null}
                      className="flex-1 md:flex-initial px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(list._id, "rejected")}
                      disabled={processingId !== null}
                      className="flex-1 md:flex-initial px-5 py-3 border border-sand hover:bg-rose-50 text-rose-600 hover:border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </>
                )}
                {list.status === "approved" && (
                  <button
                    onClick={() => handleStatusChange(list._id, "disabled")}
                    disabled={processingId !== null}
                    className="w-full px-5 py-3 border border-sand hover:bg-rose-50 text-rose-600 hover:border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Slash className="w-4 h-4" /> Revoke / Disable
                  </button>
                )}
                {list.status === "disabled" && (
                  <button
                    onClick={() => handleStatusChange(list._id, "approved")}
                    disabled={processingId !== null}
                    className="w-full px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> Reactivate
                  </button>
                )}
                {list.status === "rejected" && (
                  <span className="text-xs text-muted/30 italic font-bold p-2 text-right">Rejected listing</span>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
