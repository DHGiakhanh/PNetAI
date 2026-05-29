import { useEffect, useState, useCallback } from "react";
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  Dog, 
  History, 
  StickyNote, 
  ChevronRight, 
//   Save,
  Clock,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { bookingService } from "@/services/booking.service";
import { petService } from "@/services/pet.service";
import { formatVnd } from "@/utils/currency";
import { toast } from "react-hot-toast";

const bookingStatusStyles: Record<string, { badge: string; dot: string }> = {
  completed: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "border-emerald-100 bg-emerald-500",
  },
  cancelled: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "border-rose-100 bg-rose-500",
  },
  pending: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "border-amber-100 bg-amber-500",
  },
  confirmed: {
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "border-sky-100 bg-sky-500",
  },
};

const getBookingStatusStyle = (status?: string) =>
  bookingStatusStyles[status?.toLowerCase() || ""] ?? {
    badge: "border-sand bg-warm text-muted",
    dot: "border-sand bg-caramel",
  };

const formatBookingStatus = (status?: string) => {
  if (!status) return "Unknown";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const CustomerDirectory = () => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [selectedCustomerPets, setSelectedCustomerPets] = useState<any[]>([]);
//   const [currentNote, setCurrentNote] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const bookings = await bookingService.getProviderBookings();
      // Extract unique users
      const userMap = new Map();
      bookings.forEach((b: any) => {
        if (b.user && !userMap.has(b.user._id)) {
          userMap.set(b.user._id, {
            ...b.user,
            bookings: bookings.filter((bk: any) => bk.user?._id === b.user._id)
          });
        }
      });
      const uniqueCustomers = Array.from(userMap.values());
      setCustomers(uniqueCustomers);
      if (uniqueCustomers.length > 0 && !selectedId) {
        setSelectedId(uniqueCustomers[0]._id);
      }
    } catch {
      toast.error("Failed to retrieve client registry.");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchPets = async () => {
      if (!selectedId) return;
      try {
        const pets = await petService.getUserPets(selectedId);
        setSelectedCustomerPets(pets);
        setSelectedPetId((prev) => {
          if (prev && pets.some((pet: any) => pet._id === prev)) return prev;
          return pets[0]?._id || null;
        });
      } catch {
        console.error("Failed to fetch customer pets");
      }
    };
    fetchPets();
  }, [selectedId]);

  const selectedCustomer = customers.find(c => c._id === selectedId);
  const selectedPet = selectedCustomerPets.find((pet) => pet._id === selectedPetId) || null;
  const medicalHistoryRecords = selectedPet?.medicalHistoryRecords ?? [];
  const recentMedicalHistoryRecords = medicalHistoryRecords.slice().reverse();

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

/*
  const handleStoreMemorandum = async () => {
    if (!selectedPetId) {
      toast.error("Please select a pet profile first.");
      return;
    }

    const note = currentNote.trim();
    if (!note) {
      toast.error("Please enter a note before storing.");
      return;
    }

    try {
      const updatedPet = await petService.addMedicalHistoryNote(selectedPetId, { note });
      setSelectedCustomerPets((prev) =>
        prev.map((pet) => (pet._id === updatedPet._id ? updatedPet : pet))
      );
      setCurrentNote("");
      toast.success("Memorandum synced to pet medical history.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to store memorandum.");
    }
  };
*/

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
       <Loader2 className="w-10 h-10 animate-spin text-caramel" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-caramel mb-2">
            <div className="w-10 h-px bg-caramel"></div>
            Clientèle Records
          </div>
          <h1 className="text-4xl font-serif font-bold italic text-ink">
            Customer Directory
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Customer List (Master) */}
        <section className="lg:col-span-4 bg-white rounded-[3rem] border border-sand p-8 shadow-sm h-[700px] flex flex-col">
           <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/30" />
              <input 
                type="text" 
                placeholder="Search records..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#FBF9F2] border border-sand/50 pl-12 pr-6 py-4 rounded-2xl outline-none text-sm font-medium focus:border-caramel/30 transition-all" 
              />
           </div>

           <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {filteredCustomers.map(c => {
                const active = c._id === selectedId;
                return (
                  <button 
                    key={c._id}
                    onClick={() => setSelectedId(c._id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${active ? 'bg-ink border-ink shadow-lg shadow-ink/10' : 'bg-transparent border-transparent hover:bg-warm'}`}
                  >
                     <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${active ? 'bg-caramel text-white' : 'bg-sand/30 text-ink'}`}>
                        {c.name?.[0]?.toUpperCase()}
                     </div>
                     <div className="text-left flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${active ? 'text-white' : 'text-ink'}`}>{c.name}</p>
                        <p className={`text-[10px] font-medium truncate ${active ? 'text-white/50' : 'text-muted'}`}>{c.phone || "No phone"}</p>
                     </div>
                     <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${active ? 'text-caramel rotate-90' : 'text-sand'}`} />
                  </button>
                )
              })}
              {filteredCustomers.length === 0 && (
                <div className="py-20 text-center">
                   <p className="text-xs font-serif italic text-muted">No records matched the criteria.</p>
                </div>
              )}
           </div>
        </section>

        {/* Details View (Detail) */}
        <section className="lg:col-span-8 space-y-8">
           <AnimatePresence mode="wait">
              {selectedCustomer ? (
                <motion.div 
                  key={selectedCustomer._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   {/* Personal Profile Header */}
                   <div className="bg-white rounded-[3rem] border border-sand p-10 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-caramel/5 rounded-full blur-3xl -translate-y-32 translate-x-32" />
                      
                      <div className="flex flex-col sm:flex-row gap-8 relative z-10">
                         <div className="h-24 w-24 rounded-[2rem] bg-ink flex items-center justify-center text-4xl font-serif font-bold italic text-caramel shrink-0">
                            {selectedCustomer.name?.[0]?.toUpperCase()}
                         </div>
                         <div className="flex-1">
                            <h2 className="text-3xl font-serif font-bold italic text-ink mb-2">{selectedCustomer.name}</h2>
                            <div className="flex flex-wrap gap-6 mt-4">
                               <div className="flex items-center gap-2 text-sm font-medium text-muted">
                                  <Phone className="w-4 h-4 text-caramel" /> {selectedCustomer.phone || "Not provided"}
                               </div>
                               <div className="flex items-center gap-2 text-sm font-medium text-muted">
                                  <Mail className="w-4 h-4 text-caramel" /> {selectedCustomer.email}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Pet Profiles */}
                   <div className="grid md:grid-cols-2 gap-8">
                      <div className="bg-white rounded-[3rem] border border-sand p-10 shadow-sm">
                         <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted flex items-center gap-3">
                               <Dog className="w-4 h-4" /> Pet(s)
                            </h3>
                         </div>

                         <div className="space-y-6">
                            {selectedCustomerPets.map(pet => (
                              <button
                                type="button"
                                key={pet._id}
                                onClick={() => setSelectedPetId(pet._id)}
                                className={`w-full flex items-center gap-5 p-4 rounded-2xl border group transition-all text-left ${
                                  selectedPetId === pet._id
                                    ? "bg-ink text-white border-ink shadow-lg shadow-ink/10"
                                    : "bg-[#FBF9F2]/50 border-sand/20 hover:border-caramel/30"
                                }`}
                              >
                                 <div className="h-14 w-14 rounded-2xl overflow-hidden border border-sand/50 bg-warm flex items-center justify-center">
                                    {pet.avatarUrl ? (
                                      <img src={pet.avatarUrl} className="w-full h-full object-cover" alt={pet.name} />
                                    ) : (
                                      <Dog className="w-6 h-6 text-sand" />
                                    )}
                                 </div>
                                 <div className="flex-1">
                                    <p className={`text-sm font-bold ${selectedPetId === pet._id ? "text-white" : "text-ink"}`}>{pet.name}</p>
                                    <p className={`text-[10px] font-medium uppercase tracking-widest ${selectedPetId === pet._id ? "text-white/60" : "text-muted"}`}>
                                      {pet.species} • {pet.breed}
                                    </p>
                                 </div>
                              </button>
                            ))}
                            {selectedCustomerPets.length === 0 && (
                               <p className="text-xs font-serif italic text-muted text-center py-4">No companions registered.</p>
                            )}
                         </div>
                      </div>

                      <div className="bg-white rounded-[3rem] border border-sand p-8 shadow-sm h-full min-h-[420px] flex flex-col">
                         <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 rounded-2xl bg-warm flex items-center justify-center shrink-0">
                                 <StickyNote className="w-4 h-4 text-caramel" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted">Clinical Notes</h3>
                                <p className="mt-1 text-xs font-serif italic text-muted/70 truncate">
                                  {selectedPet ? `${selectedPet.name}'s recent clinical history` : "Select a companion to view notes"}
                                </p>
                              </div>
                            </div>
                            {medicalHistoryRecords.length > 0 && (
                              <span className="shrink-0 rounded-full bg-warm px-3 py-1 text-[10px] font-black uppercase tracking-widest text-caramel">
                                {medicalHistoryRecords.length} notes
                              </span>
                            )}
                         </div>
{/* 
                         <textarea 
                           className="w-full h-40 bg-[#FBF9F2]/50 border border-sand/20 p-6 rounded-2xl text-[13px] font-medium text-ink leading-relaxed outline-none focus:border-caramel/30 transition-all resize-none italic font-serif"
                           value={currentNote}
                           onChange={(e) => setCurrentNote(e.target.value)}
                           placeholder={selectedPet ? `Write note for ${selectedPet.name}...` : "Select a pet profile to write note"}
                         />
                         <button
                            onClick={handleStoreMemorandum}
                            className="w-full mt-6 py-4 rounded-full bg-ink text-white text-xs font-black uppercase tracking-widest hover:bg-caramel transition shadow-xl shadow-ink/10 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={!selectedPetId}
                         >
                            <Save className="w-4 h-4" /> Store Memorandum
                         </button>
*/}
                         <div className="flex-1 min-h-[280px] border-t border-sand/40 pt-5 flex flex-col">
                           <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-muted">Recent Medical History</p>
                           {recentMedicalHistoryRecords.length > 0 ? (
                             <div className="max-h-[320px] space-y-3 overflow-y-auto overscroll-contain pr-2 custom-scrollbar lg:max-h-[360px]">
                               {recentMedicalHistoryRecords.map((record: any, index: number) => (
                                   <div key={record._id || `${record.createdAt}-${index}`} className="rounded-2xl bg-[#FBF9F2]/70 p-4 border border-sand/40">
                                     <p className="text-sm font-medium text-ink leading-relaxed">{record.note}</p>
                                     <p className="mt-2 text-[10px] font-semibold text-muted">
                                       {record.providerName || "Clinic"} · {record.createdAt ? new Date(record.createdAt).toLocaleString() : ""}
                                     </p>
                                 </div>
                               ))}
                               </div>
                            ) : (
                              <div className="flex-1 rounded-[2rem] border border-dashed border-sand/50 bg-[#FBF9F2]/40 flex items-center justify-center p-8 text-center">
                                <p className="text-xs font-serif italic text-muted">
                                  {selectedPet ? "No medical history has been recorded for this companion yet." : "Choose a companion profile to review clinical notes."}
                                </p>
                              </div>
                            )}
                         </div>
                      </div>
                   </div>

                   {/* History Timeline */}
                   <div className="bg-white rounded-[3rem] border border-sand p-8 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
                         <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-2xl bg-warm flex items-center justify-center">
                              <History className="w-5 h-5 text-caramel" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black uppercase tracking-widest text-muted">Service Audit</h3>
                              <p className="mt-1 text-xs font-serif italic text-muted/70">Booking history and payment summary</p>
                            </div>
                         </div>
                         <span className="w-fit rounded-full bg-warm px-4 py-2 text-[10px] font-black uppercase tracking-widest text-caramel">
                            {selectedCustomer.bookings?.length || 0} records
                         </span>
                      </div>

                      <div className="relative space-y-4 before:absolute before:left-5 before:top-3 before:bottom-3 before:w-px before:bg-sand/60">
                         {selectedCustomer.bookings?.map((item: any) => {
                           const statusStyle = getBookingStatusStyle(item.status);
                           return (
                           <div key={item._id} className="relative pl-12">
                              <div className={`absolute left-[13px] top-6 h-4 w-4 rounded-full border-4 shadow-sm ${statusStyle.dot}`}></div>
                               <div className="rounded-[2rem] border border-sand/50 bg-[#FBF9F2]/50 p-5 transition hover:border-caramel/40 hover:bg-white">
                                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                     <div className="min-w-0">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                           <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyle.badge}`}>
                                              {formatBookingStatus(item.status)}
                                           </span>
                                        </div>
                                        <p className="text-base font-bold text-ink leading-snug">{item.service?.title || "Untitled service"}</p>
                                     </div>
                                     <div className="flex items-center gap-2 rounded-full border border-sand/50 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                                        <Clock className="w-3.5 h-3.5 text-caramel" />
                                        {item.bookingDate ? new Date(item.bookingDate).toLocaleDateString() : "No date"}
                                     </div>
                                  </div>
                                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                     <div className="rounded-2xl border border-sand/40 bg-white p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Patient</p>
                                        <p className="mt-1 text-sm font-bold text-ink">{item.pet?.name || "Unassigned"}</p>
                                     </div>
                                     <div className="rounded-2xl border border-sand/40 bg-white p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Paid</p>
                                        <p className="mt-1 text-sm font-bold text-ink">{formatVnd(item.totalAmount || 0)}</p>
                                     </div>
                                  </div>
                            </div>
                           </div>
                           );
                         })}
                         {(!selectedCustomer.bookings || selectedCustomer.bookings.length === 0) && (
                            <div className="rounded-[2rem] border border-dashed border-sand/60 bg-[#FBF9F2]/40 p-10 text-center">
                              <p className="text-xs font-serif italic text-muted">No treatment records found.</p>
                            </div>
                         )}
                      </div>
                   </div>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center text-center p-20 border-2 border-dashed border-sand/40 rounded-[3rem]">
                   <div>
                      <Users className="w-16 h-16 text-sand mx-auto mb-6" />
                      <h3 className="text-xl font-serif font-bold italic text-ink mb-2">Registry Silent</h3>
                      <p className="text-xs font-bold text-muted">Select a record from the directory to begin inspection.</p>
                   </div>
                </div>
              )}
           </AnimatePresence>
        </section>
      </div>
    </div>
  );
};
