import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft,
  Heart,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";
import { useChatWindows } from "@/context/ChatWindowContext";
import { MiniProfileModal } from "@/components/social/MiniProfileModal";
import { PetPassportModal } from "@/components/pets/PetPassportModal";
import { Pet } from "@/services/pet.service";

type BreedingRequestPet = {
  _id: string;
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  age?: number;
  avatarUrl?: string;
};

type UserInfo = {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
};

type BreedingListing = {
  _id: string;
  title: string;
  pet: BreedingRequestPet;
  user: UserInfo;
};

type BreedingRequest = {
  _id: string;
  listing: BreedingListing;
  requester: UserInfo;
  requesterPet: BreedingRequestPet;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export default function BreedingRequestsPage() {
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming");
  const [incomingRequests, setIncomingRequests] = useState<BreedingRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<BreedingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [hiddenListingIds, setHiddenListingIds] = useState<Set<string>>(new Set());
  const [passportPet, setPassportPet] = useState<Pet | null>(null);
  const { openChatWithUser } = useChatWindows();

  const openPetPassport = async (petId: string) => {
    try {
      const response = await apiClient.get(`/breeding/pets/${petId}/passport`);
      setPassportPet(response.data?.pet || null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể tải passport.");
    }
  };

  const PetCard = ({
    title,
    pet,
    onClick,
  }: {
    title: string;
    pet?: BreedingRequestPet | null;
    onClick?: () => void;
  }) => {
    const placeholder =
      "https://images.unsplash.com/photo-1525253086316-d0c936c814f8?q=80&w=500&auto=format&fit=crop";

    return (
      <button
        type="button"
        onClick={pet?._id ? onClick : undefined}
        disabled={!pet?._id}
        className="group w-full rounded-[2rem] border border-sand/50 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-caramel/20 disabled:cursor-default disabled:opacity-70"
      >
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-[1.5rem] bg-[#F9F5EE] ring-1 ring-sand/40">
            <img
              src={pet?.avatarUrl || placeholder}
              alt={pet?.name || "Unknown pet"}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted mb-1">{title}</p>
            <h3 className="text-xl font-serif font-bold text-ink">{pet?.name || "No pet available"}</h3>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted">
              {pet ? `${pet.species} • ${pet.breed || "Mixed"}` : "No details"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em] text-muted">
          <span className="rounded-full bg-sand/20 px-3 py-1">{pet?.gender || "Unknown"}</span>
          <span className="rounded-full bg-sand/20 px-3 py-1">{pet?.age != null ? `${pet.age}Y` : "Age unknown"}</span>
        </div>
        <p className="mt-4 text-[10px] font-bold text-caramel">Nhấn để xem Pet Passport</p>
      </button>
    );
  };

  const fetchIncoming = async () => {
    try {
      const res = await apiClient.get("/breeding/requests/incoming");
      setIncomingRequests(res.data.requests || []);
    } catch (error) {
      toast.error("Could not fetch received requests.");
    }
  };

  const fetchOutgoing = async () => {
    try {
      const res = await apiClient.get("/breeding/requests/outgoing");
      setOutgoingRequests(res.data.requests || []);
    } catch (error) {
      toast.error("Could not fetch sent requests.");
    }
  };

  const loadData = async () => {
    setLoading(true);
    if (activeTab === "incoming") {
      await fetchIncoming();
    } else {
      await fetchOutgoing();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleStatusUpdate = async (requestId: string, status: "accepted" | "rejected") => {
    try {
      setProcessingId(requestId);
      await apiClient.patch(`/breeding/requests/${requestId}/status`, { status });
      toast.success(`Request successfully ${status}!`);
      
      // Update local state
      setIncomingRequests(prev => 
        prev.map(req => req._id === requestId ? { ...req, status } : req)
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update request status.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleHideListing = async (listingId: string) => {
    try {
      setProcessingId(`hide-${listingId}`);
      await apiClient.patch(`/breeding/${listingId}/hide`);
      setHiddenListingIds(prev => new Set([...prev, listingId]));
      toast.success("Listing hidden. It will no longer appear in the public matchmaker.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to hide listing.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBF9F2] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        
        {/* Back Link & Header */}
        <div className="mb-10">
          <Link 
            to="/breeding" 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted hover:text-caramel transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Matchmaker
          </Link>
          <h1 className="font-serif text-5xl font-bold italic text-ink tracking-tight">Breeding Requests</h1>
          <p className="text-sm text-muted/60 font-medium mt-2 leading-relaxed">
            Manage proposals and matchmaking history for pet companionship.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-sand mb-8">
          <button
            onClick={() => setActiveTab("incoming")}
            className={`px-8 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "incoming"
                ? "border-caramel text-caramel"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            Received Proposals
            {incomingRequests.filter(r => r.status === "pending").length > 0 && (
              <span className="px-2 py-0.5 bg-caramel text-white rounded-full text-[9px] font-bold">
                {incomingRequests.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("outgoing")}
            className={`px-8 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "outgoing"
                ? "border-caramel text-caramel"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            Sent Proposals
          </button>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-32">
            <Loader2 className="w-10 h-10 animate-spin text-caramel mb-4" />
            <p className="text-sm font-medium text-muted italic">Consulting mating logs...</p>
          </div>
        ) : activeTab === "incoming" ? (
          incomingRequests.length === 0 ? (
            <div className="text-center p-20 bg-white rounded-[2.5rem] border border-sand/50 shadow-sm">
              <Heart className="w-12 h-12 text-muted/20 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold italic text-ink mb-1">No Received Proposals</h3>
              <p className="text-xs text-muted/40 font-medium">When users request breeding with your listed pets, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {incomingRequests.map((req) => (
                <motion.article 
                  key={req._id}
                  layout
                  className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-sand/50 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start"
                >
                  <div className="flex-1 space-y-6">
                    {/* Header: Breeding Listing Pet and Requester Pet */}
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span 
                        onClick={() => setSelectedUserId(req.requester._id)}
                        className="font-bold text-ink cursor-pointer hover:text-caramel transition-colors"
                      >
                        {req.requester.name}
                      </span>
                      <span className="text-muted/40 font-medium">proposed mating between</span>
                      <span className="px-3 py-1 bg-warm border border-sand/30 rounded-full text-xs font-bold text-caramel flex items-center gap-1.5">
                        {req.requesterPet.name} ({req.requesterPet.gender})
                      </span>
                      <span className="text-muted/40 font-medium">and your pet</span>
                      <span className="px-3 py-1 bg-ink/5 border border-sand/30 rounded-full text-xs font-bold text-ink flex items-center gap-1.5">
                        {req.listing.pet?.name || "Deleted Pet"}
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <PetCard
                        title="Requester's Pet"
                        pet={req.requesterPet}
                        onClick={() => openPetPassport(req.requesterPet._id)}
                      />
                      <PetCard
                        title="Your Pet Target"
                        pet={req.listing.pet}
                        onClick={() => req.listing.pet?._id && openPetPassport(req.listing.pet._id)}
                      />
                    </div>

                    {/* Proposal message */}
                    <div className="bg-[#FBF9F2] p-5 rounded-2xl border-l-4 border-caramel/40 text-sm font-medium italic text-ink/80 leading-relaxed">
                      "{req.message}"
                    </div>

                    {/* Metadata & Contact (when accepted) */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                      <span className="w-1 h-1 bg-sand rounded-full" />
                      <span className="flex items-center gap-1 text-ink/80">
                        <Phone className="w-3.5 h-3.5" />
                        {req.requester.phone || "No phone listed"}
                      </span>
                      <span className="w-1 h-1 bg-sand rounded-full" />
                      <span className="flex items-center gap-1 text-ink/80">
                        <Mail className="w-3.5 h-3.5" />
                        {req.requester.email}
                      </span>
                      <span className="w-1 h-1 bg-sand rounded-full" />
                      <button
                        onClick={() => openChatWithUser(req.requester._id)}
                        className="flex items-center gap-1 text-caramel hover:text-rust font-bold transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Nhắn tin
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto shrink-0 self-stretch md:self-auto justify-end md:justify-start border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                    {req.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(req._id, "accepted")}
                          disabled={processingId !== null}
                          className="flex-1 md:flex-initial px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                          {processingId === req._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          Accept Match
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(req._id, "rejected")}
                          disabled={processingId !== null}
                          className="flex-1 md:flex-initial px-5 py-3 border border-sand hover:bg-rose-50 text-rose-600 hover:border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject Proposal
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2 items-end">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider self-end ${
                          req.status === "accepted"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-rose-50 text-rose-600 border border-rose-200"
                        }`}>
                          {req.status === "accepted" ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Accepted
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              Rejected
                            </>
                          )}
                        </span>
                        {req.status === "accepted" && req.listing?._id && (
                          <button
                            onClick={() => handleHideListing(req.listing._id)}
                            disabled={processingId !== null || hiddenListingIds.has(req.listing._id)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
                              hiddenListingIds.has(req.listing._id)
                                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                            }`}
                            title="Hide this listing from the public matchmaker"
                          >
                            {processingId === `hide-${req.listing._id}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                            {hiddenListingIds.has(req.listing._id) ? "Hidden" : "Hide Listing"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          )
        ) : (
          outgoingRequests.length === 0 ? (
            <div className="text-center p-20 bg-white rounded-[2.5rem] border border-sand/50 shadow-sm">
              <Heart className="w-12 h-12 text-muted/20 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold italic text-ink mb-1">No Sent Proposals</h3>
              <p className="text-xs text-muted/40 font-medium">Select matching pets on Breeding listings to submit proposals.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {outgoingRequests.map((req) => (
                <motion.article 
                  key={req._id}
                  className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-sand/50 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start"
                >
                  <div className="flex-1 space-y-5">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2.5 text-sm">
                      <span className="text-muted/50 font-medium">Requested breeding for your pet</span>
                      <span className="px-3 py-1 bg-warm border border-sand/30 rounded-full text-xs font-bold text-caramel">
                        {req.requesterPet.name}
                      </span>
                      <span className="text-muted/50 font-medium">with</span>
                      <span className="px-3 py-1 bg-ink/5 border border-sand/30 rounded-full text-xs font-bold text-ink">
                        {req.listing?.pet?.name || "Deleted Pet"}
                      </span>
                      <span className="text-muted/50 font-medium">owned by</span>
                      <span 
                        onClick={() => req.listing?.user?._id && setSelectedUserId(req.listing.user._id)}
                        className="font-bold text-ink cursor-pointer hover:text-caramel transition-colors"
                      >
                        {req.listing?.user?.name || "Owner"}
                      </span>
                    </div>

                    {/* Comparison Card */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <PetCard
                        title="Your Pet (Requester)"
                        pet={req.requesterPet}
                        onClick={() => openPetPassport(req.requesterPet._id)}
                      />
                      <PetCard
                        title="Target Partner Pet"
                        pet={req.listing?.pet}
                        onClick={() => req.listing?.pet?._id && openPetPassport(req.listing.pet._id)}
                      />
                    </div>

                    {/* Sent message */}

                    {/* Sent message */}
                    <div className="bg-[#FBF9F2] p-4 rounded-xl text-xs font-medium italic text-ink/75 leading-relaxed">
                      "{req.message}"
                    </div>

                    {/* Metadata & Contact */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                      {req.listing?.user && (
                        <>
                          <span className="w-1 h-1 bg-sand rounded-full" />
                          <span className="flex items-center gap-1 text-ink/80">
                            <Phone className="w-3.5 h-3.5" />
                            {req.listing.user.phone || "No phone listed"}
                          </span>
                          <span className="w-1 h-1 bg-sand rounded-full" />
                          <span className="flex items-center gap-1 text-ink/80">
                            <Mail className="w-3.5 h-3.5" />
                            {req.listing.user.email}
                          </span>
                          <span className="w-1 h-1 bg-sand rounded-full" />
                          <button
                            onClick={() => openChatWithUser(req.listing.user._id)}
                            className="flex items-center gap-1 text-caramel hover:text-rust font-bold transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Nhắn tin
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status Tag */}
                  <div className="shrink-0 self-stretch md:self-auto flex items-end md:items-start pt-4 md:pt-0 mt-2 md:mt-0 border-t md:border-t-0">
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${
                      req.status === "accepted"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : req.status === "rejected"
                        ? "bg-rose-50 text-rose-600 border border-rose-200"
                        : "bg-amber-50 text-amber-600 border border-amber-200"
                    }`}>
                      {req.status === "accepted" && <CheckCircle className="w-3.5 h-3.5" />}
                      {req.status === "rejected" && <XCircle className="w-3.5 h-3.5" />}
                      {req.status === "pending" && <AlertCircle className="w-3.5 h-3.5 animate-pulse" />}
                      {req.status}
                    </span>
                  </div>
                </motion.article>
              ))}
            </div>
          )
        )}
      </div>

      {/* Mini Profile Modal */}
      <AnimatePresence>
        {selectedUserId && (
          <MiniProfileModal
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
          />
        )}
      </AnimatePresence>

      {passportPet && (
        <PetPassportModal pet={passportPet} onClose={() => setPassportPet(null)} />
      )}
    </main>
  );
}
