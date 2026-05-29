import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Heart, 
  Plus, 
  Search, 
  Loader2, 
  X, 
  ImageIcon, 
  MessageSquare,
  Sparkles,
  Info,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/utils/api.service";
import { authService } from "@/services/auth.service";
import { toast } from "react-hot-toast";
import { MiniProfileModal } from "@/components/social/MiniProfileModal";
import { PetPassportModal } from "@/components/pets/PetPassportModal";
import { Pet } from "@/services/pet.service";
import { formatUserDistrictProvince } from "@/utils/address";

type UserInfo = {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  location?: {
    addressName?: string;
  };
};

type BreedingListing = {
  _id: string;
  pet: Pet;
  user: UserInfo;
  title: string;
  description: string;
  images: string[];
  status: string;
  createdAt: string;
};

export default function BreedingPage() {
  const [listings, setListings] = useState<BreedingListing[]>([]);
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [breedFilter, setBreedFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("All");

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<BreedingListing | null>(null);
  const [passportPet, setPassportPet] = useState<Pet | null>(null);
  const [loadingPassport, setLoadingPassport] = useState(false);

  // Forms state
  const [newListing, setNewListing] = useState({
    petId: "",
    title: "",
    description: "",
    images: [] as string[]
  });
  const [requestData, setRequestData] = useState({
    requesterPetId: "",
    message: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser._id || currentUser.id || "";
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      let query = "/breeding";
      const params = [];
      if (speciesFilter !== "All") params.push(`species=${encodeURIComponent(speciesFilter)}`);
      if (breedFilter.trim()) params.push(`breed=${encodeURIComponent(breedFilter.trim())}`);
      if (genderFilter !== "All") params.push(`gender=${encodeURIComponent(genderFilter)}`);
      
      if (params.length > 0) {
        query += "?" + params.join("&");
      }
      const res = await apiClient.get(query);
      setListings(res.data.listings || []);
    } catch (error) {
      toast.error("Could not fetch breeding listings.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPets = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await apiClient.get("/pets");
      setMyPets(res.data.pets || []);
    } catch (error) {
      console.error("Could not load user's pets");
    }
  };

  useEffect(() => {
    fetchListings();
  }, [speciesFilter, genderFilter]);

  // Debounced search for breed filter
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchListings();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [breedFilter]);

  useEffect(() => {
    fetchMyPets();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      toast.loading("Uploading gallery image...", { id: "gallery-upload" });
      const uploadedUrls = [...newListing.images];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Limit is 5MB.`);
          continue;
        }
        const { url } = await authService.generalUpload(file);
        uploadedUrls.push(url);
      }
      setNewListing(prev => ({ ...prev, images: uploadedUrls }));
      toast.success("Images uploaded successfully", { id: "gallery-upload" });
    } catch (error) {
      toast.error("Upload failed", { id: "gallery-upload" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    const updated = [...newListing.images];
    updated.splice(idx, 1);
    setNewListing(prev => ({ ...prev, images: updated }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListing.petId || !newListing.title || !newListing.description) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/breeding", newListing);
      toast.success("Listing submitted to admin for moderation!");
      setCreateModalOpen(false);
      setNewListing({ petId: "", title: "", description: "", images: [] });
      fetchListings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create listing.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;
    if (!requestData.requesterPetId || !requestData.message) {
      toast.error("Please select a pet and write a message.");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post(`/breeding/${selectedListing._id}/request`, requestData);
      toast.success("Breeding request sent successfully!");
      setDetailModalOpen(false);
      setRequestData({ requesterPetId: "", message: "" });
      setSelectedListing(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Compatibility or communication failure.");
    } finally {
      setSubmitting(false);
    }
  };

  const openListingDetail = (listing: BreedingListing) => {
    setSelectedListing(listing);
    setRequestData({ requesterPetId: "", message: "" });
    setDetailModalOpen(true);
  };

  const closeListingDetail = () => {
    setDetailModalOpen(false);
    setSelectedListing(null);
    setRequestData({ requesterPetId: "", message: "" });
  };

  const openPetPassport = async (petId: string) => {
    try {
      setLoadingPassport(true);
      const response = await apiClient.get(`/breeding/pets/${petId}/passport`);
      setPassportPet(response.data?.pet || null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể tải passport.");
    } finally {
      setLoadingPassport(false);
    }
  };

  const getListingImages = (listing: BreedingListing) => {
    const images: string[] = [];
    listing.images?.forEach((img) => {
      if (img) images.push(img);
    });
    if (images.length === 0 && listing.pet.avatarUrl) {
      images.push(listing.pet.avatarUrl);
    }
    return images;
  };

  return (
    <main className="min-h-screen bg-[#FBF9F2] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-caramel">Breeding Matchmaker</p>
            <h1 className="font-serif text-6xl font-bold italic text-ink tracking-tight mb-4">Breeding</h1>
            <p className="max-w-xl text-sm text-muted/60 font-medium leading-relaxed">
              Find compatible partners for your pets. Search and filter by species, breed, and gender to ensure compatibility and healthy breeding.
            </p>
          </div>

          <div className="flex gap-4">
            {isLoggedIn && (
              <>
                <Link
                  to="/breeding/requests"
                  className="px-6 py-3 border border-sand bg-white text-ink text-sm font-bold rounded-2xl hover:bg-[#FBF9F2] transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Manage Requests
                </Link>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-8 py-3 bg-ink text-white text-sm font-bold rounded-2xl hover:bg-caramel transition-all shadow-xl shadow-ink/10 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  List a Pet
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        <section className="mb-10 bg-white rounded-[2rem] p-6 border border-sand/50 shadow-sm flex flex-wrap items-center justify-between gap-6">
          
          {/* Species tabs */}
          <div className="flex gap-2">
            {["All", "Dog", "Cat", "Bird", "Other"].map((spec) => (
              <button
                key={spec}
                onClick={() => setSpeciesFilter(spec)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                  speciesFilter === spec
                    ? "bg-caramel border-caramel text-white shadow-md"
                    : "bg-[#FBF9F2] border-sand/30 text-muted hover:border-caramel/30"
                }`}
              >
                {spec}s
              </button>
            ))}
          </div>

          {/* Search & Gender */}
          <div className="flex items-center gap-4 flex-1 md:flex-initial">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
              <input
                type="text"
                placeholder="Search breed..."
                value={breedFilter}
                onChange={(e) => setBreedFilter(e.target.value)}
                className="w-full bg-[#FBF9F2] border border-sand/50 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-medium focus:outline-none focus:border-caramel/50"
              />
              {breedFilter && (
                <button 
                  onClick={() => setBreedFilter("")} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted/40 hover:text-ink"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex bg-[#FBF9F2] p-1 rounded-2xl border border-sand/50">
              {["All", "Male", "Female"].map((gen) => (
                <button
                  key={gen}
                  onClick={() => setGenderFilter(gen)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    genderFilter === gen
                      ? "bg-white text-ink shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {gen}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Listings Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-32">
             <Loader2 className="w-12 h-12 animate-spin text-caramel mb-4" />
             <p className="text-sm font-medium text-muted italic">Consulting compatibility scrolls...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center p-32 bg-white rounded-[3rem] border border-sand/50 shadow-sm">
             <Heart className="w-16 h-16 text-muted/20 mx-auto mb-6" />
             <h2 className="text-2xl font-serif font-bold italic text-ink mb-2">No Companions Found</h2>
             <p className="text-sm text-muted/50">Try broadening your species or gender filters.</p>
          </div>
        ) : (
          <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((list) => {
              const isOwnListing = list.user?._id === currentUserId;
              return (
                <article
                  key={list._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openListingDetail(list)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openListingDetail(list);
                    }
                  }}
                  className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[3rem] border border-sand/50 bg-white transition-all duration-700 hover:border-caramel/30 hover:shadow-2xl hover:shadow-ink/5"
                >
                  <div className="relative block aspect-[16/11] overflow-hidden bg-warm">
                    {list.images && list.images.length > 0 ? (
                      <img
                        src={list.images[0]}
                        alt={list.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                    ) : list.pet.avatarUrl ? (
                      <img
                        src={list.pet.avatarUrl}
                        alt={list.pet.name}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted/20">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    
                    {/* Species & Gender Badges */}
                    <div className="absolute top-6 left-6 flex gap-2">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-ink text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                        {list.pet.species}
                      </span>
                      <span className={`px-3 py-1 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm ${
                        list.pet.gender === "Male" ? "bg-blue-500/90" : list.pet.gender === "Female" ? "bg-rose-600/85" : "bg-gray-500/90"
                      }`}>
                        {list.pet.gender}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-8 flex flex-col flex-1">
                    <div className="mb-4">
                      <span className="text-[10px] font-bold text-caramel uppercase tracking-[0.2em]">
                        {list.pet.breed || "Unknown Breed"} &bull; {list.pet.age} Years Old
                      </span>
                      <h3 className="font-serif text-2xl font-bold italic text-ink mt-1.5 line-clamp-1">
                        {list.title}
                      </h3>
                    </div>

                    <p className="text-muted/60 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
                      {list.description}
                    </p>

                    {/* Owner & Action */}
                    <div className="mt-auto flex items-center justify-between border-t border-sand/30 pt-6">
                      <div
                        onClick={(event) => {
                          event.stopPropagation();
                          if (list.user?._id) setSelectedUserId(list.user._id);
                        }}
                        className="flex min-w-0 cursor-pointer items-center gap-3 transition-all hover:text-caramel hover:opacity-85"
                      >
                        <div className="w-9 h-9 rounded-full bg-warm overflow-hidden border border-sand/40 flex items-center justify-center">
                          {list.user?.avatarUrl ? (
                             <img src={list.user.avatarUrl} alt={list.user.name} className="w-full h-full object-cover" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-xs font-bold text-caramel bg-warm">
                               {list.user?.name?.[0]?.toUpperCase() || "P"}
                             </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-ink/80 leading-none">{list.user?.name || "Pet Parent"}</p>
                          <p className="mt-1 flex items-center gap-1 truncate text-[9px] font-medium leading-none text-muted/50">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {formatUserDistrictProvince(list.user)}
                          </p>
                        </div>
                      </div>

                      {isOwnListing ? (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted/40">
                          Your Ad
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {/* List a Pet Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateModalOpen(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl overflow-hidden bg-white border border-sand/50 shadow-2xl rounded-[2.5rem] p-8 z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-caramel/10 rounded-full flex items-center justify-center text-caramel">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold italic text-ink">List Pet for Breeding</h3>
                    <p className="text-xs text-muted/50 font-medium">Connect with compatible mates for your pet.</p>
                  </div>
                </div>
                <button onClick={() => setCreateModalOpen(false)} className="p-2 hover:bg-warm rounded-full text-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-6">
                
                {/* Select Pet */}
                <div>
                  <label className="block text-xs font-bold text-ink/75 uppercase tracking-wider mb-2">
                    Select Your Pet <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={newListing.petId}
                    onChange={(e) => setNewListing(prev => ({ ...prev, petId: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#FBF9F2] border border-sand/50 rounded-2xl text-sm focus:outline-none focus:border-caramel/50"
                  >
                    <option value="">-- Choose one of your registered pets --</option>
                    {myPets.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.species} &bull; {p.breed || "No breed info"} &bull; {p.gender})
                      </option>
                    ))}
                  </select>
                  {myPets.length === 0 && (
                    <p className="text-xs text-caramel mt-2 font-medium flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      You must register a pet first in <Link to="/my-pets" className="underline font-bold">My Pets</Link> to listing.
                    </p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-ink/75 uppercase tracking-wider mb-2">
                    Listing Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newListing.title}
                    onChange={(e) => setNewListing(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Friendly Golden Retriever looking for breeding partner"
                    className="w-full px-4 py-3 bg-[#FBF9F2] border border-sand/50 rounded-2xl text-sm focus:outline-none focus:border-caramel/50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-ink/75 uppercase tracking-wider mb-2">
                    Detailed Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newListing.description}
                    onChange={(e) => setNewListing(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your pet's personality, pedigree history, vaccines, health details, and what partner characteristics you are seeking."
                    className="w-full px-4 py-3 bg-[#FBF9F2] border border-sand/50 rounded-2xl text-sm focus:outline-none focus:border-caramel/50 resize-none font-sans"
                  />
                </div>

                {/* Images */}
                <div>
                  <label className="block text-xs font-bold text-ink/75 uppercase tracking-wider mb-2">
                    Gallery Images
                  </label>
                  <div className="grid grid-cols-4 gap-4">
                    {newListing.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-sand shadow-sm group">
                        <img src={img} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className="group flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-sand hover:border-caramel bg-white hover:bg-warm/30 transition-all cursor-pointer">
                      <ImageIcon className="w-5 h-5 text-muted/30 group-hover:scale-115 transition-transform" />
                      <span className="text-[9px] font-bold text-muted/50 uppercase tracking-widest mt-1">Add Image</span>
                      <input type="file" multiple className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-sand/30">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-sand text-ink text-sm font-bold rounded-2xl hover:bg-[#FBF9F2] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="flex-1 px-8 py-3 bg-ink text-white text-sm font-bold rounded-2xl hover:bg-caramel transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Submit Listing"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Listing detail + breeding request */}
      <AnimatePresence>
        {detailModalOpen && selectedListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeListingDetail}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[2.5rem] border border-sand/50 bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                    <Heart className="h-6 w-6 fill-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold italic text-ink">Breeding Request</h3>
                    <p className="text-xs font-medium text-muted/50">Send matching request with your pet.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeListingDetail}
                  className="rounded-full p-2 text-muted transition-colors hover:bg-warm"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
                <section className="rounded-2xl border border-sand/30 bg-[#FBF9F2] p-5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-caramel">
                    {selectedListing.pet.breed || "Unknown Breed"} • {selectedListing.pet.age} Years Old
                  </span>
                  <h4 className="mt-2 font-serif text-2xl font-bold italic text-ink">{selectedListing.title}</h4>
                  <p className="mt-4 whitespace-pre-line text-sm font-medium leading-relaxed text-muted/80">
                    {selectedListing.description}
                  </p>

                  {getListingImages(selectedListing).length > 0 ? (
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      {getListingImages(selectedListing).map((image) => (
                        <img
                          key={image}
                          src={image}
                          alt={selectedListing.title}
                          className="aspect-[4/3] w-full rounded-2xl border border-sand/40 object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                </section>

                <button
                  type="button"
                  onClick={() => openPetPassport(selectedListing.pet._id)}
                  disabled={loadingPassport}
                  className="flex w-full items-center gap-3 rounded-2xl border border-sand/30 bg-[#FBF9F2] p-4 text-left transition-all hover:border-caramel/40 hover:bg-warm/40 disabled:opacity-60"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-warm">
                    {selectedListing.pet.avatarUrl ? (
                      <img src={selectedListing.pet.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold uppercase text-caramel">
                        {selectedListing.pet.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted/50">Partner target</p>
                    <p className="text-sm font-serif font-bold italic text-ink">
                      {selectedListing.pet.name} ({selectedListing.pet.species} •{" "}
                      {selectedListing.pet.breed || "No breed"} • {selectedListing.pet.gender})
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-caramel">Nhấn để xem Pet Passport</p>
                  </div>
                  {loadingPassport ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-caramel" /> : null}
                </button>

                {isLoggedIn && selectedListing.user?._id !== currentUserId ? (
                  <form onSubmit={handleRequestSubmit} className="space-y-6 border-t border-sand/30 pt-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink/75">
                        Select Your Compatible Pet <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={requestData.requesterPetId}
                        onChange={(event) =>
                          setRequestData((prev) => ({ ...prev, requesterPetId: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-sand/50 bg-[#FBF9F2] px-4 py-3 text-sm focus:border-caramel/50 focus:outline-none"
                      >
                        <option value="">-- Choose one of your pets --</option>
                        {myPets
                          .filter(
                            (pet) =>
                              pet.species === selectedListing.pet.species &&
                              pet.gender !== "Unknown" &&
                              pet.gender !== selectedListing.pet.gender,
                          )
                          .map((pet) => (
                            <option key={pet._id} value={pet._id}>
                              {pet.name} ({pet.breed || "No breed"} • {pet.gender})
                            </option>
                          ))}
                      </select>
                      <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-muted/40">
                        Note: To be compatible, your pet must be of the <strong>same species</strong> (
                        {selectedListing.pet.species}) and of the <strong>opposite gender</strong> (
                        {selectedListing.pet.gender === "Male" ? "Female" : "Male"}).
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink/75">
                        Message to Owner <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={requestData.message}
                        onChange={(event) =>
                          setRequestData((prev) => ({ ...prev, message: event.target.value }))
                        }
                        placeholder="Hello! I would love to breed my pet with yours. Let's talk!"
                        className="w-full resize-none rounded-2xl border border-sand/50 bg-[#FBF9F2] px-4 py-3 font-sans text-sm focus:border-caramel/50 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={closeListingDetail}
                        className="flex-1 rounded-2xl border border-sand px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-[#FBF9F2]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-500 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-rose-600 disabled:opacity-50"
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Request"}
                      </button>
                    </div>
                  </form>
                ) : selectedListing.user?._id === currentUserId ? (
                  <p className="rounded-2xl border border-sand/30 bg-warm/30 px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-muted/60">
                    Đây là bài đăng của bạn
                  </p>
                ) : (
                  <p className="rounded-2xl border border-sand/30 bg-warm/30 px-4 py-3 text-center text-sm font-medium text-muted/70">
                    Đăng nhập để gửi yêu cầu phối giống.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {passportPet ? <PetPassportModal pet={passportPet} onClose={() => setPassportPet(null)} /> : null}

      {/* Mini Profile Modal */}
      <AnimatePresence>
        {selectedUserId && (
          <MiniProfileModal
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
