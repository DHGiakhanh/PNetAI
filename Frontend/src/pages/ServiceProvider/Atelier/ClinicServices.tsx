import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
   Calendar,
   Clock,
   Users,
   Settings2,
   CheckCircle2,
   MoreVertical,
   Loader2,
   Plus,
   Trash2,
   Edit2,
   Sparkles,
   X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { bookingService } from "@/services/booking.service";
import { serviceService, Service } from "@/services/service.service";
import { authService } from "@/services/auth.service";
import { toast } from "react-hot-toast";
import { formatVnd } from "@/utils/currency";

type SubTab = 'bookings' | 'catalog' | 'config';

export const ClinicServices = () => {
   const [searchParams] = useSearchParams();
   const globalSearch = searchParams.get('search') || "";

   const [activeTab, setActiveTab] = useState<SubTab>('bookings');
   const [bookings, setBookings] = useState<any[]>([]);
   const [services, setServices] = useState<Service[]>([]);
   const [loading, setLoading] = useState(true);
   const [isAdding, setIsAdding] = useState(false);
   const [editingService, setEditingService] = useState<Service | null>(null);
   const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

   // Config state
   const [capacity, setCapacity] = useState(4);
   const [hours, setHours] = useState({ start: "08:00", end: "18:00" });

   // New Service state
   const [newService, setNewService] = useState<Partial<Service>>({
      title: "",
      category: "Medical Clinic",
      basePrice: 0,
      duration: 60,
      description: "",
      features: [],
      images: []
   });

   const fetchData = useCallback(async () => {
      try {
         setLoading(true);
         const userLocal = JSON.parse(localStorage.getItem("user") || "{}");
         const pId = userLocal._id || userLocal.id; // Support both naming conventions

         if (!pId) {
            setServices([]);
            setBookings([]);
            setLoading(false);
            return;
         }

         const [bData, sData, profile] = await Promise.all([
            bookingService.getProviderBookings(),
            serviceService.getServices({
               providerId: pId,
               search: globalSearch,
               limit: 100
            }),
            authService.getCurrentUser()
         ]);
         setBookings(bData);
         setServices(sData.services);
         if (profile.operatingHours) setHours(profile.operatingHours);
         if (profile.bookingCapacity) setCapacity(profile.bookingCapacity);
      } catch {
         toast.error("Records indexing failed.");
      } finally {
         setLoading(false);
      }
   }, [globalSearch]);

   useEffect(() => {
      fetchData();
   }, [fetchData]);

   const handleCreateService = async () => {
      try {
         if (!newService.title || !newService.category || !newService.description || !newService.basePrice) {
            toast.error("Incomplete registry entry. Title, Category, Price and Description are required.");
            return;
         }
         toast.loading("Publishing specialty...", { id: 'svc' });
         await serviceService.createService(newService);
         toast.success("Service officially registered.", { id: 'svc' });
         setIsAdding(false);
         setNewService({ title: "", category: "Medical Clinic", basePrice: 0, duration: 60, description: "", features: [], images: [] });
         fetchData();
      } catch (error: any) {
         toast.error(error.response?.data?.message || "Registry failed.", { id: 'svc' });
      }
   };



   const handleUpdateService = async () => {
      try {
         if (!editingService) return;
         if (!editingService.title || !editingService.category || !editingService.description || !editingService.basePrice) {
            toast.error("Incomplete specification.");
            return;
         }
         toast.loading("Synchronizing updates...", { id: 'svc' });
         await serviceService.updateService(editingService._id, editingService);
         toast.success("Service record updated.", { id: 'svc' });
         setEditingService(null);
         fetchData();
      } catch (error: any) {
         toast.error(error.response?.data?.message || "Update failed.", { id: 'svc' });
      }
   };

   const handleDeleteService = async (id: string) => {
      if (!window.confirm("Are you sure you want to decommission this service specialty? This action cannot be reversed.")) return;
      try {
         toast.loading("Decommissioning clinical record...", { id: 'del' });
         await serviceService.deleteService(id);
         toast.success("Service decommissioned.", { id: 'del' });
         fetchData();
      } catch (error: any) {
         toast.error(error.response?.data?.message || "Decommissioning failed.", { id: 'del' });
      }
   };

   const handleUpdateConfig = async () => {
      try {
         toast.loading("Optimizing facility throughput...", { id: 'cfg' });
         await authService.updateProfile({
            operatingHours: hours,
            bookingCapacity: capacity
         });
         toast.success("Operational logic synchronized.", { id: 'cfg' });
      } catch (error: any) {
         toast.error(error.response?.data?.message || "Configuration failed.", { id: 'cfg' });
      }
   };

   const handleStatusUpdate = async (id: string, status: string) => {
      try {
         await bookingService.updateBookingStatus(id, status);
         setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
         toast.success(`Session ${status}.`);
      } catch (error: any) {
         toast.error(error.response?.data?.message || "Status synchronization failed.");
      }
   };

   const formatDateBadge = (bookingDate: string) => {
      const date = new Date(bookingDate);
      return `${date.getDate()}/${date.getMonth() + 1}`;
   };

   const normalizeTimeRange = (bookingTime: string) => {
      if (!bookingTime) return "";
      const parts = bookingTime.split("-").map((item) => item.trim());
      if (parts.length === 2) return `${parts[0]}-${parts[1]}`;
      return bookingTime;
   };

   if (loading) return (
      <div className="h-96 flex flex-col items-center justify-center">
         <Loader2 className="w-10 h-10 animate-spin text-caramel opacity-20" />
         <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted/30">indexing clinical data...</p>
      </div>
   );

   return (
      <div className="space-y-10 pb-24">
         {/* Editorial Header */}
         <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-4 border-b border-sand/30">
            <div>
               <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-caramel/60 mb-3">
                  <div className="w-12 h-px bg-caramel/30"></div>
                  Facility Operations
               </div>
               <h1 className="text-5xl font-serif font-bold italic text-ink tracking-tight">
                  Atelier & Agenda
               </h1>
            </div>

            <div className="bg-warm/40 p-1.5 rounded-[2rem] flex items-center ring-1 ring-sand/20 shadow-inner backdrop-blur-sm">
               {[
                  { id: 'bookings', label: 'Agenda', icon: Calendar },
                  { id: 'catalog', label: 'Services', icon: Sparkles },
                  { id: 'config', label: 'Config', icon: Settings2 }
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as SubTab)}
                     className={`flex items-center gap-3 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab.id ? 'bg-ink text-white shadow-2xl shadow-ink/20 scale-105' : 'text-muted hover:text-ink hover:bg-white/50'}`}
                  >
                     <tab.icon className="w-3.5 h-3.5" />
                     {tab.label}
                  </button>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-1 gap-12">
            {editingService && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-ink/60 backdrop-blur-md" onClick={() => setEditingService(null)} />
                  <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative bg-[#FBF9F2] w-full max-w-4xl p-12 rounded-[4rem] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar border border-white/20">
                     <button onClick={() => setEditingService(null)} className="absolute top-10 right-10 p-4 hover:bg-warm rounded-full transition"><X className="w-6 h-6 text-muted" /></button>
                     <h2 className="text-3xl font-serif font-bold italic text-ink mb-12">Edit Service Protocol</h2>

                     <div className="grid lg:grid-cols-2 gap-12">
                        <div className="space-y-8">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4 italic">Public Identification</label>
                              <input
                                 type="text"
                                 placeholder="e.g. Specialized Diagnostic Center"
                                 value={editingService.title}
                                 onChange={e => setEditingService(p => p ? ({ ...p, title: e.target.value }) : null)}
                                 className="w-full bg-white border border-sand px-8 py-5 rounded-[2.5rem] outline-none font-bold text-lg shadow-sm"
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4 italic">Market Category</label>
                                 <select
                                    value={editingService.category}
                                    onChange={e => setEditingService(p => p ? ({ ...p, category: e.target.value }) : null)}
                                    className="w-full bg-white border border-sand px-8 py-5 rounded-[2.5rem] outline-none font-bold text-sm appearance-none shadow-sm"
                                 >
                                    <option>Medical Clinic</option>
                                    <option>Spa & Grooming</option>
                                    <option>Wellness Center</option>
                                 </select>
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4 italic">Base Valuation (VND)</label>
                                 <input
                                    type="number"
                                    value={editingService.basePrice}
                                    onChange={e => setEditingService(p => p ? ({ ...p, basePrice: Number(e.target.value) }) : null)}
                                    className="w-full bg-white border border-sand px-8 py-5 rounded-[2.5rem] outline-none font-bold text-lg shadow-sm"
                                 />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4 italic">Time Interval (Minutes)</label>
                              <input
                                 type="number"
                                 value={editingService.duration}
                                 onChange={e => setEditingService(p => p ? ({ ...p, duration: Number(e.target.value) }) : null)}
                                 className="w-full bg-white border border-sand px-8 py-5 rounded-[2.5rem] outline-none font-bold text-lg shadow-sm"
                              />
                           </div>
                        </div>

                        <div className="space-y-10">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4 italic">Executive Summary</label>
                              <textarea
                                 rows={4}
                                 value={editingService.description}
                                 onChange={e => setEditingService(p => p ? ({ ...p, description: e.target.value }) : null)}
                                 className="w-full bg-white border border-sand px-8 py-6 rounded-[2.5rem] outline-none font-medium text-sm leading-relaxed shadow-sm resize-none"
                              />
                           </div>

                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4 italic">Asset Management</label>
                              <div className="flex gap-4 items-center p-6 bg-white border border-sand rounded-[2rem] shadow-sm">
                                 <div className="h-14 w-14 rounded-2xl overflow-hidden border border-sand shrink-0">
                                    <img src={editingService.images[0]} className="w-full h-full object-cover" />
                                 </div>
                                 <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-caramel">Visual Identity</p>
                                    <p className="text-[11px] text-muted font-medium">Click to synchronize new asset</p>
                                 </div>
                                 <label className="p-4 bg-warm hover:bg-ink hover:text-white rounded-full transition-all cursor-pointer">
                                    <input
                                       type="file" className="hidden" accept="image/*"
                                       onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          try {
                                             toast.loading("Uploading visual...", { id: 'img-up' });
                                             const { url } = await serviceService.uploadServiceImage(file);
                                             setEditingService(p => p ? ({ ...p, images: [url] }) : null);
                                             toast.success("Visual registered.", { id: 'img-up' });
                                          } catch (error: any) {
                                             toast.error(error.response?.data?.message || "Upload failed.", { id: 'img-up' });
                                          }
                                       }}
                                    />
                                    <Edit2 className="w-4 h-4" />
                                 </label>
                              </div>
                           </div>

                           <div className="pt-10 flex gap-4">
                              <button onClick={handleUpdateService} className="flex-[2] py-6 rounded-full bg-ink text-white font-black text-xs uppercase tracking-[0.4em] hover:bg-caramel transition shadow-2xl">Commit Protocol</button>
                              <button onClick={() => setEditingService(null)} className="flex-1 py-6 rounded-full border border-sand font-black text-xs uppercase tracking-[0.4em] text-muted hover:bg-warm transition">Abort</button>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               </div>
            )}

            {selectedBooking && (
               <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
                     onClick={() => setSelectedBooking(null)}
                  />
                  <motion.div
                     initial={{ opacity: 0, y: 20, scale: 0.96 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     className="relative w-full max-w-2xl rounded-[2.5rem] border border-sand bg-[#FBF9F2] p-8 shadow-2xl"
                  >
                     <button
                        onClick={() => setSelectedBooking(null)}
                        className="absolute right-6 top-6 rounded-full border border-sand bg-white p-2 text-muted hover:text-ink"
                     >
                        <X className="h-4 w-4" />
                     </button>
                     <h3 className="text-3xl font-serif font-bold italic text-ink">Pet Profile</h3>
                     <p className="mt-1 text-xs font-black uppercase tracking-widest text-caramel">
                        Booking {formatDateBadge(selectedBooking.bookingDate)} · {normalizeTimeRange(selectedBooking.bookingTime)}
                     </p>

                     <div className="mt-6 flex items-center gap-4 rounded-2xl border border-sand bg-white p-4">
                        <div className="h-16 w-16 overflow-hidden rounded-2xl border border-sand bg-warm">
                           {selectedBooking.pet?.avatarUrl ? (
                              <img src={selectedBooking.pet.avatarUrl} alt={selectedBooking.pet?.name || "Pet"} className="h-full w-full object-cover" />
                           ) : (
                              <div className="grid h-full w-full place-items-center text-xs font-bold text-muted">No Photo</div>
                           )}
                        </div>
                        <div>
                           <p className="text-xl font-bold text-ink">{selectedBooking.pet?.name || "Unknown Pet"}</p>
                           <p className="text-xs font-bold uppercase tracking-widest text-muted">
                              {selectedBooking.pet?.species || "Unknown"} {selectedBooking.pet?.breed ? `• ${selectedBooking.pet.breed}` : ""}
                           </p>
                        </div>
                     </div>

                     <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-sand/70 bg-white p-4">
                           <p className="text-[10px] font-black uppercase tracking-widest text-muted">Gender</p>
                           <p className="mt-1 text-sm font-bold text-ink">{selectedBooking.pet?.gender || "Unknown"}</p>
                        </div>
                        <div className="rounded-2xl border border-sand/70 bg-white p-4">
                           <p className="text-[10px] font-black uppercase tracking-widest text-muted">Age / Weight</p>
                           <p className="mt-1 text-sm font-bold text-ink">
                              {selectedBooking.pet?.age ?? "N/A"} yrs · {selectedBooking.pet?.weightKg ?? "N/A"} kg
                           </p>
                        </div>
                        <div className="rounded-2xl border border-sand/70 bg-white p-4">
                           <p className="text-[10px] font-black uppercase tracking-widest text-muted">Health Status</p>
                           <p className="mt-1 text-sm font-bold text-ink">{selectedBooking.pet?.healthStatus || "No data"}</p>
                        </div>
                        <div className="rounded-2xl border border-sand/70 bg-white p-4">
                           <p className="text-[10px] font-black uppercase tracking-widest text-muted">Allergies</p>
                           <p className="mt-1 text-sm font-bold text-ink">{selectedBooking.pet?.allergies || "No data"}</p>
                        </div>
                     </div>

                     <div className="mt-4 rounded-2xl border border-sand/70 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Medical History</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-ink">
                           {selectedBooking.pet?.medicalHistory || "No history recorded yet."}
                        </p>
                     </div>

                     {selectedBooking.pet?.medicalHistoryRecords?.length > 0 && (
                        <div className="mt-4 rounded-2xl border border-sand/70 bg-white p-4">
                           <p className="text-[10px] font-black uppercase tracking-widest text-muted">Clinic Note Timeline</p>
                           <div className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1">
                              {selectedBooking.pet.medicalHistoryRecords
                                 .slice()
                                 .reverse()
                                 .map((record: any, idx: number) => (
                                    <div key={record._id || `${record.createdAt}-${idx}`} className="rounded-xl border border-sand/50 bg-warm/20 p-3">
                                       <p className="text-sm font-semibold text-ink">{record.note}</p>
                                       <p className="mt-1 text-[11px] text-muted">
                                          {record.providerName || "Clinic"} · {record.createdAt ? new Date(record.createdAt).toLocaleString() : ""}
                                       </p>
                                    </div>
                                 ))}
                           </div>
                        </div>
                     )}

                     <div className="mt-4 rounded-2xl border border-sand/70 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Additional Notes</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-ink">
                           {selectedBooking.pet?.notes || "No additional note."}
                        </p>
                     </div>
                  </motion.div>
               </div>
            )}

            {activeTab === 'bookings' && (
               <div className="grid lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-8">
                     <div className="flex items-center justify-between">
                        <h3 className="text-xl font-serif font-bold italic text-ink">Active Sessions</h3>
                        <div className="px-4 py-2 rounded-full bg-warm border border-sand text-[10px] font-black uppercase tracking-widest text-muted">{bookings.length} Registered</div>
                     </div>

                     <div className="space-y-4">
                        {bookings.map((booking) => (
                           <motion.div
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={booking._id}
                              onClick={() => setSelectedBooking(booking)}
                              className="bg-white rounded-[2.5rem] p-8 border border-sand shadow-sm hover:shadow-xl hover:border-caramel/20 transition-all group cursor-pointer"
                           >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                                 <div className="flex items-center gap-8">
                                    <div className={`h-20 w-20 rounded-[1.8rem] flex flex-col items-center justify-center border transition-all ${booking.status === 'confirmed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-lg shadow-emerald-500/10' : 'bg-warm border-sand/50 text-ink opacity-40 group-hover:opacity-100'}`}>
                                       <span className="text-2xl font-serif font-bold leading-none">{formatDateBadge(booking.bookingDate)}</span>
                                       <span className="text-[9px] font-black tracking-tight mt-1">{normalizeTimeRange(booking.bookingTime)}</span>
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-3 mb-2">
                                          <p className="text-lg font-bold text-ink leading-none">{booking.user?.name || "Client Reserved"}</p>
                                          <div className={`w-2 h-2 rounded-full ${booking.status === 'confirmed' ? 'bg-emerald-500 animate-pulse' : 'bg-sand'}`} />
                                       </div>
                                       <div className="flex items-center gap-4">
                                          <p className="text-[11px] font-black uppercase tracking-widest text-caramel/60">{booking.service?.title}</p>
                                          <span className="w-1 h-1 rounded-full bg-sand" />
                                          <p className="text-[10px] font-bold text-muted/40 italic">Patient: {booking.pet?.name || "Private"}</p>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-3">
                                    <AnimatePresence mode="wait">
                                       {booking.status === 'pending' ? (
                                          <div className="flex gap-2">
                                             <button onClick={(event) => { event.stopPropagation(); handleStatusUpdate(booking._id, 'confirmed'); }} className="px-8 py-3 rounded-full bg-ink text-white text-[10px] font-black uppercase tracking-widest hover:bg-caramel transition shadow-xl">Authorize</button>
                                             <button onClick={(event) => { event.stopPropagation(); handleStatusUpdate(booking._id, 'cancelled'); }} className="p-3 rounded-full border border-sand text-muted hover:bg-rose-50 hover:text-rose-600 transition"><Trash2 className="w-4 h-4" /></button>
                                          </div>
                                       ) : booking.status === 'confirmed' ? (
                                          <button onClick={(event) => { event.stopPropagation(); handleStatusUpdate(booking._id, 'completed'); }} className="px-8 py-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition group/done flex items-center gap-3 shadow-lg shadow-emerald-500/5">
                                             <CheckCircle2 className="w-4 h-4" /> Finalize Session
                                          </button>
                                       ) : (
                                          <span className="px-6 py-2.5 rounded-full bg-warm text-[10px] font-black uppercase tracking-widest text-muted/40 italic border border-sand/30">{booking.status}</span>
                                       )}
                                    </AnimatePresence>
                                    <button onClick={(event) => event.stopPropagation()} className="p-4 rounded-full hover:bg-warm text-muted transition border border-transparent hover:border-sand group-hover:rotate-90">
                                       <MoreVertical className="w-5 h-5" />
                                    </button>
                                 </div>
                              </div>
                           </motion.div>
                        ))}
                        {bookings.length === 0 && (
                           <div className="py-32 text-center bg-white rounded-[3rem] border border-sand shadow-inner flex flex-col items-center">
                              <p className="text-xl font-serif italic text-muted/30">Your agenda is currently vacant.</p>
                              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/20 mt-4 animate-pulse">Waiting for network sync...</p>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="lg:col-span-4 space-y-10">
                     <div className="bg-ink text-white rounded-[3rem] p-10 shadow-2xl shadow-ink/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-caramel/10 rounded-full blur-[4rem] group-hover:scale-150 transition-transform duration-1000" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-10 italic">Facility Load Index</h4>
                        <div className="space-y-10 relative z-10">
                           <div>
                              <div className="flex justify-between items-baseline mb-4">
                                 <p className="text-5xl font-serif font-bold italic tracking-tighter">{(bookings.length / 12 * 100).toFixed(0)}<span className="text-xl ml-1">%</span></p>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-caramel">Clinical Pulse</p>
                              </div>
                              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                 <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(bookings.length / 12 * 100, 100)}%` }} className="h-full bg-gradient-to-r from-caramel to-amber-400 rounded-full" />
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-6 bg-white/5 rounded-[1.8rem] border border-white/10 hover:bg-white/10 transition-colors">
                                 <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Total Units</p>
                                 <p className="text-2xl font-bold">{bookings.length}</p>
                              </div>
                              <div className="p-6 bg-white/5 rounded-[1.8rem] border border-white/10 hover:bg-white/10 transition-colors">
                                 <p className="text-[9px] font-black uppercase tracking-widest text-caramel mb-2">Reserved</p>
                                 <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'pending').length}</p>
                              </div>
                           </div>
                        </div>
                     </div>


                  </div>
               </div>
            )}

            {activeTab === 'catalog' && (
               <div className="space-y-12">
                  <div className="flex items-center justify-between">
                     <div>
                        <h3 className="text-2xl font-serif font-bold italic text-ink">Service Portfolio</h3>
                        <p className="text-xs font-bold text-muted">Manage the medical & lifestyle offerings of your facility</p>
                     </div>
                     {!isAdding && (
                        <button onClick={() => setIsAdding(true)} className="flex items-center gap-4 px-10 py-5 rounded-full bg-ink text-white text-[11px] font-black uppercase tracking-[0.3em] hover:bg-caramel transition shadow-xl hover:-translate-y-1">
                           <Plus className="w-4 h-4" /> Register New Asset
                        </button>
                     )}
                  </div>

                  {isAdding && (
                     <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3.5rem] border-2 border-caramel/20 p-12 shadow-2xl relative">
                        <button onClick={() => setIsAdding(false)} className="absolute top-8 right-8 p-4 hover:bg-warm rounded-full transition"><X className="w-6 h-6 text-muted" /></button>
                        <h4 className="text-xl font-serif font-bold italic text-ink mb-12">Draft Technical Specification</h4>

                        <div className="grid lg:grid-cols-2 gap-12">
                           <div className="space-y-8">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4 italic">Public Identification</label>
                                 <input
                                    type="text"
                                    placeholder="e.g. Specialized Diagnostic Center"
                                    value={newService.title}
                                    onChange={e => setNewService(p => ({ ...p, title: e.target.value }))}
                                    className="w-full bg-warm/30 border border-sand px-8 py-5 rounded-[2rem] outline-none font-bold text-lg"
                                 />
                              </div>
                              <div className="grid grid-cols-2 gap-8">
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4 italic">Market Category</label>
                                    <select
                                       value={newService.category}
                                       onChange={e => setNewService(p => ({ ...p, category: e.target.value }))}
                                       className="w-full bg-warm/30 border border-sand px-8 py-5 rounded-[2rem] outline-none font-bold text-sm appearance-none"
                                    >
                                       <option>Medical Clinic</option>
                                       <option>Spa & Grooming</option>
                                       <option>Wellness Center</option>
                                    </select>
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4 italic">Base Valuation (VND)</label>
                                    <input
                                       type="number"
                                       placeholder="0"
                                       value={newService.basePrice || ""}
                                       onChange={e => setNewService(p => ({ ...p, basePrice: Number(e.target.value) }))}
                                       className="w-full bg-warm/30 border border-sand px-8 py-5 rounded-[2rem] outline-none font-bold text-lg"
                                    />
                                 </div>
                              </div>

                              <div className="space-y-3">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4 italic">Time Interval (Minutes)</label>
                                 <input
                                    type="number"
                                    placeholder="60"
                                    value={newService.duration || ""}
                                    onChange={e => setNewService(p => ({ ...p, duration: Number(e.target.value) }))}
                                    className="w-full bg-warm/30 border border-sand px-8 py-5 rounded-[2rem] outline-none font-bold text-lg"
                                 />
                              </div>

                              <div className="space-y-3">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4 italic">Description</label>
                                 <textarea
                                    rows={4}
                                    placeholder="Brief description of the service protocol..."
                                    value={newService.description}
                                    onChange={e => setNewService(p => ({ ...p, description: e.target.value }))}
                                    className="w-full bg-warm/30 border border-sand px-8 py-6 rounded-[2.5rem] outline-none font-medium text-sm leading-relaxed"
                                 />
                              </div>
                           </div>

                           <div className="space-y-10">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4 italic">Service Specialties</label>
                                 <div className="flex gap-4 mb-4">
                                    <input
                                       id="feat-input"
                                       type="text"
                                       placeholder="Add specific specialty area..."
                                       onKeyDown={e => {
                                          if (e.key === 'Enter') {
                                             const val = e.currentTarget.value;
                                             if (val) setNewService(p => ({ ...p, features: [...(p.features || []), val] }));
                                             e.currentTarget.value = "";
                                          }
                                       }}
                                       className="flex-1 bg-warm/30 border border-sand px-8 py-4 rounded-[1.5rem] outline-none font-bold text-sm"
                                    />
                                 </div>
                                 <div className="flex flex-wrap gap-2">
                                    {newService.features?.map(f => (
                                       <span key={f} className="px-4 py-2 bg-ink text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-3">
                                          {f} <button onClick={() => setNewService(p => ({ ...p, features: p.features?.filter(x => x !== f) }))}><X className="w-3 h-3" /></button>
                                       </span>
                                    ))}
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4 italic">Primary Visual Asset </label>
                                 <div className="grid grid-cols-2 gap-4">
                                    {newService.images && newService.images.length > 0 ? (
                                       <div className="relative aspect-square rounded-[1.5rem] overflow-hidden border border-sand shadow-sm group/img">
                                          <img src={newService.images[0]} className="w-full h-full object-cover" />
                                          <button
                                             onClick={() => setNewService(p => ({ ...p, images: [] }))}
                                             className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur rounded-full text-rose-600 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                          >
                                             <Trash2 className="w-4 h-4" />
                                          </button>
                                       </div>
                                    ) : (
                                       <label className="aspect-square rounded-[1.5rem] border-2 border-dashed border-sand/50 hover:border-caramel/40 hover:bg-warm/30 transition-all flex flex-col items-center justify-center cursor-pointer group/upload">
                                          <input
                                             type="file"
                                             className="hidden"
                                             accept="image/*"
                                             onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                try {
                                                   toast.loading("Synchronizing eye-candy...", { id: 'img-up' });
                                                   const { url } = await serviceService.uploadServiceImage(file);
                                                   setNewService(p => ({ ...p, images: [url] }));
                                                   toast.success("Main asset registered.", { id: 'img-up' });
                                                } catch (error: any) {
                                                   toast.error(error.response?.data?.message || "Asset sync failed.", { id: 'img-up' });
                                                }
                                             }}
                                          />
                                          <div className="h-10 w-10 rounded-xl bg-warm flex items-center justify-center text-muted group-hover/upload:text-caramel transition-colors">
                                             <Plus className="w-5 h-5" />
                                          </div>
                                          <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-muted text-center">Assign Highlight <br /> Image</p>
                                       </label>
                                    )}
                                 </div>
                              </div>

                              <div className="flex gap-4 pt-10">
                                 <button onClick={handleCreateService} className="flex-[2] py-6 rounded-full bg-ink text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-caramel transition shadow-2xl">Authorize Entry</button>
                                 <button onClick={() => setIsAdding(false)} className="flex-1 py-6 rounded-full border border-sand font-black text-xs uppercase tracking-[0.3em] text-muted hover:bg-warm transition">Discard Draft</button>
                              </div>
                           </div>
                        </div>
                     </motion.div>
                  )}

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {services.map(s => (
                        <div key={s._id} className="bg-white rounded-[3rem] border border-sand/50 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl hover:border-caramel/20 transition-all">
                           <div className="h-56 bg-warm relative overflow-hidden">
                              <img
                                 src={s.images[0] || "https://images.unsplash.com/photo-1513360309081-38a623659117?q=80&w=600"}
                                 className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                              <div className="absolute bottom-6 left-8 right-8">
                                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-caramel mb-1 italic">{s.category}</p>
                                 <h4 className="text-2xl font-serif font-bold italic text-white leading-tight">{s.title}</h4>
                              </div>
                           </div>
                           <div className="p-8 flex-1 flex flex-col">
                              <div className="flex-1 space-y-6">
                                 <div className="flex justify-between items-baseline">
                                    <p className="text-2xl font-bold text-ink italic">{formatVnd(s.basePrice)}</p>
                                    <span className="text-[10px] font-black text-muted/30 uppercase tracking-widest">Base Rate</span>
                                 </div>
                                 <div className="flex flex-wrap gap-2">
                                    {s.features.slice(0, 3).map(f => (
                                       <span key={f} className="px-3 py-1 bg-warm text-[9px] font-black uppercase tracking-widest text-muted border border-sand/50 rounded-lg">{f}</span>
                                    ))}
                                    {s.features.length > 3 && <span className="text-[10px] font-bold text-muted/30">+{s.features.length - 3}</span>}
                                 </div>
                              </div>
                              <div className="mt-8 pt-8 border-t border-sand/30 flex gap-2">
                                 <button onClick={() => setEditingService(s)} className="flex-1 py-4 rounded-full border border-sand text-[10px] font-black uppercase tracking-widest text-muted hover:bg-ink hover:text-white transition flex items-center justify-center gap-2">
                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                 </button>
                                 <button onClick={() => handleDeleteService(s._id)} className="p-4 rounded-full border border-sand text-muted hover:bg-rose-50 hover:text-rose-600 transition">
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {activeTab === 'config' && (
               <div className="grid md:grid-cols-2 gap-10">
                  <div className="bg-white rounded-[4rem] border border-sand p-12 shadow-sm">
                     <div className="flex items-center gap-8 mb-12">
                        <div className="h-20 w-20 rounded-[2rem] bg-warm flex items-center justify-center text-ink shadow-inner">
                           <Clock className="w-10 h-10" />
                        </div>
                        <div>
                           <h3 className="text-2xl font-serif font-bold italic text-ink">Operational Hours</h3>
                           <p className="text-xs font-bold text-muted">Establish the active window for patient admissions</p>
                        </div>
                     </div>

                     <div className="space-y-12">
                        <div className="grid grid-cols-2 gap-10">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4">Registry Start</label>
                              <input type="time" value={hours.start} onChange={(e) => setHours(prev => ({ ...prev, start: e.target.value }))} className="w-full bg-warm/30 border border-sand px-8 py-6 rounded-[2.5rem] outline-none font-bold text-2xl shadow-inner focus:border-caramel/30 transition-all text-caramel" />
                           </div>
                           <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4">EndOfLine Registry</label>
                              <input type="time" value={hours.end} onChange={(e) => setHours(prev => ({ ...prev, end: e.target.value }))} className="w-full bg-warm/30 border border-sand px-8 py-6 rounded-[2.5rem] outline-none font-bold text-2xl shadow-inner focus:border-caramel/30 transition-all text-ink" />
                           </div>
                        </div>

                        <div className="p-10 rounded-[3rem] bg-warm/20 border border-sand/50 flex items-start gap-8">
                           <Settings2 className="w-6 h-6 text-ink mt-1 opacity-20" />
                           <div>
                              <p className="text-xs font-black uppercase tracking-widest text-ink mb-2">Synchronization Logic</p>
                              <p className="text-[12px] text-muted leading-relaxed font-medium">Any adjustments to these hours will immediately synchronize with the public booking dashboard across the PNetAI global network.</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white rounded-[4rem] border border-sand p-12 shadow-sm flex flex-col">
                     <div className="flex items-center gap-8 mb-12">
                        <div className="h-20 w-20 rounded-[2rem] bg-warm flex items-center justify-center text-ink shadow-inner">
                           <Users className="w-10 h-10" />
                        </div>
                        <div>
                           <h3 className="text-2xl font-serif font-bold italic text-ink">Admission Volume</h3>
                           <p className="text-xs font-bold text-muted">Maximum synchronized bookings per timebox</p>
                        </div>
                     </div>

                     <div className="flex-1 space-y-12 flex flex-col justify-between">
                        <div className="space-y-8">
                           <div className="flex items-center justify-between mb-4">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4">Units per Interval</label>
                              <span className="text-4xl font-serif font-bold italic text-caramel tracking-tighter">{capacity}<span className="text-base ml-2">Patients</span></span>
                           </div>
                           <input
                              type="range" min="1" max="10"
                              value={capacity}
                              onChange={(e) => setCapacity(parseInt(e.target.value))}
                              className="w-full h-2.5 bg-warm rounded-full appearance-none cursor-pointer accent-ink"
                           />
                           <div className="flex justify-between px-2">
                              <span className="text-[10px] font-black text-muted/30">Registry Limit: 1</span>
                              <span className="text-[10px] font-black text-muted/30">Registry Limit: 10</span>
                           </div>
                        </div>

                        <button
                           onClick={handleUpdateConfig}
                           className="w-full py-7 bg-ink text-white rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-caramel transition-all hover:-translate-y-1 active:scale-95 shadow-ink/20"
                        >
                           Commit Configuration
                        </button>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};
