import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { 
  MapPin, 
  ChevronRight, 
  Loader2, 
  Heart,
  ChevronLeft,
  Check,
  Plus,
  Building2,
  Info,
  ShieldCheck
} from "lucide-react";
import { serviceService, Service } from "../../services/service.service";
import { petService, Pet } from "@/services/pet.service";
import { formatVnd } from "@/utils/currency";
import { bookingService } from "@/services/booking.service";
import { toast } from "react-hot-toast";
import {
  format,
  eachDayOfInterval,
  isSameDay,
  startOfToday,
  isBefore,
  addDays,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

type BookingStep = 1 | 2 | 3 | 4;

const morningTimes = ["08:00 - 08:05", "08:05 - 08:10", "08:10 - 08:15", "08:15 - 08:20", "08:20 - 08:25"];
const afternoonTimes = [
  "13:00 - 13:05", "13:05 - 13:10", "13:10 - 13:15", "13:15 - 13:20", "13:20 - 13:25",
  "13:25 - 13:30", "13:30 - 13:35", "13:35 - 13:40", "13:40 - 13:45", "13:45 - 13:50",
  "13:50 - 13:55", "13:55 - 14:00", "14:00 - 14:05", "14:05 - 14:10", "14:10 - 14:15",
  "14:15 - 14:20", "14:20 - 14:25", "14:25 - 14:30", "14:30 - 14:35", "14:35 - 14:40"
];

export default function ServiceBookingPage() {
  const { serviceId } = useParams();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"info" | "wizard">("info");
  const [activeTab, setActiveTab] = useState<"info" | "service">("info");
  
  // Wizard State
  const [step, setStep] = useState<BookingStep>(1);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(startOfToday(), 1));
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [pets, setPets] = useState<Pet[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    if (serviceId) {
      fetchService(serviceId);
    }
  }, [serviceId]);

  useEffect(() => {
    if (isLoggedIn && view === "wizard") {
      petService.getMyPets().then(setPets).catch(() => setPets([]));
    }
  }, [isLoggedIn, view]);

  const fetchService = async (id: string) => {
    try {
      setLoading(true);
      const data = await serviceService.getServiceById(id);
      setService(data);
      if (data.features?.length) setSelectedSpecialty(data.features[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!service || !selectedPetId || !selectedTime) return;
    setIsProcessing(true);
    try {
      const payload = {
        serviceId: service._id,
        petId: selectedPetId,
        bookingDate: format(selectedDate, 'yyyy-MM-dd'),
        bookingTime: selectedTime,
        totalAmount: service.basePrice,
        note: description
      };
      const result = await bookingService.confirmBookingPayOS(payload);
      if (result?.payment?.checkoutUrl) {
        window.location.href = result.payment.checkoutUrl;
      } else {
        toast.error("Failed to generate payment link.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Internal transaction failure.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#FBF9F2]"><Loader2 className="w-10 h-10 animate-spin text-caramel" /></div>;
  if (!service) return <div className="p-20 text-center text-ink font-serif italic text-lg">Facility registration record not found.</div>;

  const renderInfoView = () => (
    <div className="bg-[#FBF9F2] min-h-screen pb-40 font-sans text-ink">
      {/* Main Header Profile */}
      <div className="bg-white">
         <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-end gap-12">
            <div className="relative group">
               <div className="h-44 w-44 rounded-[3.5rem] bg-white border border-sand p-1 shadow-2xl overflow-hidden relative group-hover:scale-105 transition-transform duration-700">
                  <img src={service.images[0] || ""} alt="" className="w-full h-full object-cover rounded-[3rem] grayscale-[0.2] group-hover:grayscale-0 transition-opacity" />
               </div>
               <div className="absolute -top-3 -right-3 h-10 w-10 bg-caramel rounded-2xl flex items-center justify-center text-white shadow-xl z-20">
                  <ShieldCheck className="w-5 h-5" />
               </div>
            </div>
            <div className="flex-1 min-w-0">
               <h1 className="text-4xl md:text-6xl font-serif font-bold italic text-ink mb-6 tracking-tighter leading-none">{service.title}</h1>
               <div className="flex flex-wrap items-center gap-4">
                  <button className="flex items-center gap-2.5 px-8 py-3 bg-warm text-ink rounded-full text-[11px] font-black uppercase tracking-widest border border-sand hover:bg-caramel hover:text-white transition-all">
                     <MapPin className="w-4 h-4" /> Address Info
                  </button>
                  <button className="flex items-center gap-2.5 px-8 py-3 border border-sand text-muted rounded-full text-[11px] font-black uppercase tracking-widest hover:border-ink hover:text-ink transition-all">
                     <Heart className="w-4 h-4" /> Favorite Clinic
                  </button>
               </div>
            </div>
         </div>

         {/* Facility Navigation */}
         <div className="max-w-7xl mx-auto px-6 border-t border-sand/20 flex gap-14">
            {[
               { id: "info", l: "Information" },
               { id: "service", l: "Services" }
            ].map(t => {
               const active = activeTab === t.id;
               return (
                 <button 
                   key={t.id}
                   onClick={() => setActiveTab(t.id as any)}
                   className={`py-6 text-[11px] font-black uppercase tracking-[0.3em] transition-all border-b-4 ${active ? "border-caramel text-ink" : "border-transparent text-muted/30 hover:text-ink"}`}
                 >
                   {t.l}
                 </button>
               )
            })}
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-14 grid gap-16">
         <div className="bg-white rounded-[4.5rem] overflow-hidden shadow-2xl border border-sand/50 group">
            <div className="aspect-[21/9] bg-warm relative overflow-hidden">
               <img src={service.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]" />
               <div className="absolute inset-0 bg-ink/10" />
            </div>
            <div className="py-10 bg-white flex justify-center border-t border-dashed border-sand/30">
               <button 
                 onClick={() => setView("wizard")}
                 className="group flex items-center gap-4 px-12 py-4 bg-caramel text-white rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-caramel/10 hover:bg-ink transition-all hover:-translate-y-1"
               >
                 Book Appointment Now
                 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
         </div>

         <div className="grid md:grid-cols-2 gap-24">
            <section>
               <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-muted/30 mb-8 italic">PNetAI Practitioner Intro</h3>
               <p className="text-xl font-serif font-bold italic text-ink leading-[1.7] opacity-80">
                  {service.description || "A premier healthcare facility certified under the PNetAI global excellence standards for high-performance pet care."}
               </p>
            </section>
            
            <section className="bg-white rounded-[3.5rem] p-12 border border-sand/30 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-caramel/5 rounded-full blur-3xl -translate-y-20 translate-x-20" />
               <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-muted/20 mb-10 italic underline underline-offset-8">Operational Schedule</h3>
               <div className="grid gap-4">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                    <div key={day} className="flex justify-between items-center py-3 border-b border-sand/10 group cursor-default">
                       <span className="text-[11px] font-black uppercase tracking-widest text-muted/40 group-hover:text-caramel transition-colors">{day}</span>
                       <span className="text-xs font-bold text-ink tracking-tight">08:00 AM — 08:00 PM</span>
                    </div>
                  ))}
               </div>
            </section>
         </div>
      </div>
    </div>
  );

  const renderWizardView = () => {
    const days = eachDayOfInterval({ 
      start: startOfMonth(currentMonth), 
      end: endOfMonth(currentMonth) 
    });
    
    return (
      <div className="bg-warm min-h-screen font-sans pb-40 text-ink">
        <header className="bg-white px-10 py-7 flex items-center justify-between border-b border-sand/30 sticky top-0 z-50">
           <div className="max-w-7xl mx-auto w-full flex items-center gap-6">
              <button 
                onClick={() => { if (step > 1) setStep((step-1) as BookingStep); else setView("info"); }} 
                className="h-14 w-14 rounded-[1.5rem] bg-warm flex items-center justify-center text-ink hover:bg-ink hover:text-white transition shadow-sm border border-sand/50"
              >
                 <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex flex-col">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-caramel leading-none mb-2">Protocol Discovery</p>
                 <h2 className="text-xl font-serif font-bold italic tracking-tight">{service.title}</h2>
              </div>
           </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-4 grid lg:grid-cols-12 gap-6 items-start">
           <div className="lg:col-span-8 bg-white rounded-[2rem] shadow-2xl shadow-ink/10 border border-sand/50 overflow-hidden flex flex-col">
              {/* English Wizard Stepper */}
              <div className="px-10 py-4 bg-warm border-b border-sand/30 flex items-center justify-between">
                 {[
                   { s: 1, l: "Specialty" },
                   { s: 2, l: "Date" },
                   { s: 3, l: "Timebox" },
                   { s: 4, l: "Profile" }
                 ].filter(item => item.s <= step).map(item => (
                    <div key={item.s} className={`flex flex-col items-center gap-3 group animate-in fade-in slide-in-from-left-4 duration-500`}>
                       <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border-2 transition-all ${step === item.s ? "border-ink bg-ink text-white" : "bg-emerald-500 border-emerald-500 text-white"}`}>
                          {step > item.s ? <Check className="w-5 h-5" /> : <span className="text-[11px] font-black">{item.s}</span>}
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-widest ${step === item.s ? "text-ink" : "text-muted/20"} hidden md:block`}>{item.l}</span>
                    </div>
                 ))}
              </div>

              <div className="p-5 min-h-[320px]">
                 {step === 1 && (
                    <div className="space-y-6">
                       <h3 className="text-xl font-serif font-bold italic text-ink">Identify specialty area...</h3>
                       <div className="grid sm:grid-cols-2 gap-3">
                          {service.features.map(f => (
                            <button key={f} onClick={() => { setSelectedSpecialty(f); setStep(2); }} className={`group p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${selectedSpecialty === f ? "border-caramel bg-warm/50" : "border-sand/30 bg-white hover:border-caramel/20"}`}>
                               <div className="relative z-10">
                                  <div className="flex justify-between items-center mb-1">
                                     <p className="text-base font-bold text-ink">{f}</p>
                                     <ChevronRight className={`w-4 h-4 transition-all ${selectedSpecialty === f ? "text-caramel translate-x-0" : "text-sand/30 -translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"}`} />
                                  </div>
                                  <p className="text-[11px] font-black uppercase tracking-widest text-caramel">{formatVnd(service.basePrice)}</p>
                               </div>
                               {selectedSpecialty === f && <div className="absolute top-0 right-0 w-24 h-24 bg-caramel/5 rounded-full blur-2xl opacity-50" />}
                            </button>
                          ))}
                       </div>
                    </div>
                 )}

                 {step === 2 && (
                    <div className="space-y-6">
                       <h3 className="text-xl font-serif font-bold italic text-ink">Select appointment date...</h3>
                       <div className="max-w-sm mx-auto">
                          <div className="flex justify-between items-center mb-6">
                             <span className="text-xs font-black uppercase tracking-[0.3em] text-ink">{format(currentMonth, 'MMMM yyyy')}</span>
                             <div className="flex gap-3">
                                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-4 rounded-2xl bg-warm border border-sand/40 hover:bg-white transition"><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-4 rounded-2xl bg-warm border border-sand/40 hover:bg-white transition"><ChevronRight className="w-5 h-5" /></button>
                             </div>
                          </div>
                          <div className="grid grid-cols-7 text-center mb-6 text-[11px] font-black uppercase tracking-widest text-muted/20">
                             {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(d => <div key={d}>{d}</div>)}
                          </div>
                          <div className="grid grid-cols-7 gap-2">
                             {/* Empty slots for day alignment */}
                             {Array.from({ length: (new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 6) % 7 }).map((_, i) => (
                               <div key={`empty-${i}`} className="h-10" />
                             ))}
                             {days.map(d => {
                                const sel = isSameDay(d, selectedDate);
                                const past = isBefore(d, startOfToday());
                                return (
                                  <button key={d.toString()} disabled={past} onClick={() => setSelectedDate(d)} className={`h-10 rounded-xl text-[10px] font-black transition-all border ${sel ? "bg-ink border-ink text-white shadow-lg scale-105 z-10" : past ? "text-muted/10 bg-warm/10 cursor-not-allowed opacity-20 border-transparent" : "bg-white border-sand/30 text-ink hover:border-caramel/40"}`}>
                                     {format(d, 'd')}
                                  </button>
                                )
                             })}
                          </div>
                       </div>
                    </div>
                 )}

                 {step === 3 && (
                    <div className="space-y-6">
                       <h3 className="text-xl font-serif font-bold italic text-ink">Authorized session time...</h3>
                       <div className="space-y-4">
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/20 mb-2 flex items-center gap-2 italic">Morning sessions</p>
                             <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {morningTimes.map(t => (
                                   <button key={t} onClick={() => setSelectedTime(t)} className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${selectedTime === t ? "bg-ink border-ink text-white shadow-md scale-105" : "bg-white border-sand/30 text-muted/60 hover:border-caramel/20"}`}>
                                      {t}
                                   </button>
                                ))}
                             </div>
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/20 mb-2 flex items-center gap-2 italic">Afternoon sessions</p>
                             <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {afternoonTimes.map(t => (
                                   <button key={t} onClick={() => setSelectedTime(t)} className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${selectedTime === t ? "bg-ink border-ink text-white shadow-md scale-105" : "bg-white border-sand/30 text-muted/60 hover:border-caramel/20"}`}>
                                      {t}
                                   </button>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {step === 4 && (
                    <div className="space-y-6">
                       <h3 className="text-xl font-serif font-bold italic text-ink">Companion authorization...</h3>
                       <div className="grid md:grid-cols-2 gap-4">
                          {pets.map(pet => {
                             const sel = selectedPetId === pet._id;
                             return (
                               <button 
                                 key={pet._id} 
                                 onClick={() => setSelectedPetId(pet._id)} 
                                 className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${sel ? "border-ink bg-warm/50 shadow-lg -translate-y-0.5" : "border-sand/30 bg-white hover:border-caramel/20"}`}
                               >
                                  <div className="w-12 h-12 rounded-xl bg-sand/10 flex items-center justify-center border border-sand/20 overflow-hidden shrink-0">
                                     {pet.avatarUrl ? <img src={pet.avatarUrl} className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 opacity-20" />}
                                  </div>
                                  <div className="flex-1 min-w-0 pt-0.5">
                                     <p className="text-base font-bold text-ink mb-0.5 truncate">{pet.name}</p>
                                     <p className="text-[8px] font-black uppercase tracking-[0.1em] text-muted/30">{pet.breed || "Vanguard Profile"}</p>
                                  </div>
                                  {sel && <div className="h-2 w-2 rounded-full bg-caramel mt-2 shadow-md" />}
                               </button>
                             )
                          })}
                          <button className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-sand/30 text-muted/20 hover:text-caramel hover:border-caramel/30 transition-all font-black text-[9px] uppercase tracking-widest bg-warm/10">
                             <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center border border-sand/20">
                                <Plus className="w-4 h-4" />
                             </div>
                             Author New Profile
                          </button>
                       </div>

                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted/20 pl-4">Consultation Notes (Optional)</label>
                          <textarea 
                            className="w-full bg-warm/10 border border-sand/40 rounded-2xl p-4 text-[13px] min-h-[80px] outline-none focus:bg-white focus:border-caramel/30 focus:ring-8 focus:ring-warm transition-all resize-none"
                            placeholder="Detail relevant medical history..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                          />
                       </div>
                    </div>
                 )}


              </div>

              <div className="p-6 bg-warm/50 flex justify-between items-center border-t border-sand/30">
                 <button onClick={() => { if (step > 1) setStep((step-1) as BookingStep); else setView("info"); }} className="px-8 py-3 rounded-full border border-sand text-[10px] font-black uppercase tracking-widest text-muted/40 hover:bg-white hover:text-ink transition shadow-sm">Back</button>
                 {step < 4 ? (
                   <button onClick={() => setStep((step+1) as BookingStep)} disabled={!isLoggedIn || (step === 3 && !selectedTime)} className="group flex items-center gap-4 px-10 py-3 rounded-full bg-ink text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-caramel transition-all disabled:opacity-20 disabled:pointer-events-none shadow-xl">
                      Next Step
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </button>
                 ) : (
                   <button onClick={handleConfirm} disabled={!isLoggedIn || !selectedPetId || isProcessing} className="group flex items-center gap-4 px-10 py-3 rounded-full bg-caramel text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-ink transition-all disabled:opacity-20 disabled:pointer-events-none shadow-xl">
                      {isProcessing ? "Processing..." : "Thanh toán PayOS"}
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                   </button>
                 )}
              </div>
           </div>

           {/* Interactive Sidebar Summary */}
           <aside className="lg:col-span-4 sticky top-24 space-y-6">
              <div className="bg-ink text-white rounded-[2rem] shadow-2xl shadow-ink/30 p-8 overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-caramel/10 rounded-full blur-3xl" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8 italic border-b border-white/5 pb-4 flex items-center gap-3">
                    <Check className="w-4 h-4 text-caramel opacity-50" /> Checkout Docket
                 </h4>
                 
                 <div className="space-y-6 mb-8">
                    {step >= 1 && selectedSpecialty && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                         <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Facility Specialty</p>
                         <p className="text-lg font-bold text-white tracking-tight">{selectedSpecialty}</p>
                      </motion.div>
                    )}
                    
                    {step >= 2 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                         <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Date & Time</p>
                         <p className="text-lg font-bold text-caramel tracking-tight leading-tight">
                            {format(selectedDate, 'MMM d, yyyy')}
                         </p>
                         {step >= 3 && selectedTime && (
                           <p className="text-sm font-bold text-white/40 tracking-tight mt-1">{selectedTime}</p>
                         )}
                      </motion.div>
                    )}

                    {step >= 4 && selectedPetId && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-6 border-t border-white/5">
                         <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Companion Profile</p>
                         <p className="text-lg font-bold text-warm/90 tracking-tight">{pets.find(p => p._id === selectedPetId)?.name}</p>
                      </motion.div>
                    )}
                 </div>

                 {step >= 1 && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-8 border-t-2 border-dashed border-white/5 space-y-3">
                      <div className="flex justify-between items-baseline pt-4 text-2xl font-black text-white">
                         <span className="text-[9px] font-black text-caramel uppercase tracking-[0.3em] mr-3 italic">Total Sync:</span>
                         <span className="tracking-tighter">{formatVnd(service.basePrice)}</span>
                      </div>
                   </motion.div>
                 )}
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-sand/40 shadow-sm flex items-start gap-4">
                 <div className="h-10 w-10 bg-warm rounded-xl flex items-center justify-center text-caramel shrink-0 border border-sand/20">
                    <Info className="w-5 h-5" />
                 </div>
                 <div>
                    <h5 className="text-[9px] font-black uppercase tracking-widest text-ink mb-1">Protocol Notice</h5>
                    <p className="text-[10px] font-medium text-muted/40 leading-relaxed uppercase tracking-tighter">Clinical sync confirmed.</p>
                 </div>
              </div>
           </aside>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {view === "info" ? renderInfoView() : renderWizardView()}
    </AnimatePresence>
  );
}
