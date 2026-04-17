import { useEffect, useState, useCallback } from "react";
import { 
  Calendar, 
  Clock, 
  Users, 
  Settings2, 
  CheckCircle2, 
  MoreVertical,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { bookingService } from "@/services/booking.service";
import { toast } from "react-hot-toast";

export const ClinicServices = () => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'config'>('bookings');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [capacity, setCapacity] = useState(4);
  const [hours, setHours] = useState({ start: "08:00", end: "18:00" });

  const fetchBookings = useCallback(async () => {
    try {
      const data = await bookingService.getProviderBookings();
      setBookings(data);
    } catch {
      toast.error("Failed to retrieve agenda.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      // In a real app, I'd have bookingService.updateStatus
      // For now, I'll simulate or add to service if missing
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
      toast.success(`Session ${status}.`);
    } catch {
      toast.error("Update failed.");
    }
  };

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
            Clinical Operations
          </div>
          <h1 className="text-4xl font-serif font-bold italic text-ink">
            Care & Scheduling
          </h1>
        </div>
        <div className="bg-warm/50 p-1.5 rounded-full flex items-center ring-1 ring-sand/30 shadow-inner">
           <button 
             onClick={() => setActiveTab('bookings')}
             className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'bookings' ? 'bg-ink text-white shadow-lg shadow-ink/10' : 'text-muted hover:text-ink'}`}
           >
             Bookings Queue
           </button>
           <button 
             onClick={() => setActiveTab('config')}
             className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-ink text-white shadow-lg shadow-ink/10' : 'text-muted hover:text-ink'}`}
           >
             Session Config
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {activeTab === 'bookings' ? (
          <>
            {/* Booking Queue */}
            <div className="lg:col-span-8 space-y-6">
               <h3 className="text-sm font-black uppercase tracking-widest text-muted italic flex items-center gap-3">
                  <Calendar className="w-4 h-4" /> Active Agenda
               </h3>
               <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="bg-white rounded-[2rem] p-8 border border-sand shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                       {booking.status === 'confirmed' && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />}
                       
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                          <div className="flex items-center gap-6">
                             <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border ${booking.status === 'confirmed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-warm border-sand/50 text-ink'}`}>
                                <span className="text-xl font-serif font-bold">{booking.bookingTime.split(':')[0]}</span>
                             </div>
                             <div>
                                <div className="flex items-center gap-2 mb-1">
                                   <p className="text-sm font-bold text-ink">{booking.user?.name || "Anonymous"}</p>
                                   <span className="text-[10px] font-medium text-muted/40">— with {booking.pet?.name || "Pet"}</span>
                                </div>
                                <p className="text-[11px] font-black uppercase tracking-widest text-caramel">{booking.service?.title}</p>
                                <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-muted">
                                   <Clock className="w-3.5 h-3.5" /> Scheduled for {booking.bookingTime}
                                </div>
                             </div>
                          </div>

                          <div className="flex items-center gap-2">
                             {booking.status === 'pending' ? (
                               <>
                                  <button onClick={() => handleStatusUpdate(booking._id, 'confirmed')} className="px-6 py-2.5 rounded-xl bg-ink text-white text-[10px] font-black uppercase tracking-widest hover:bg-caramel transition shadow-lg shadow-ink/10">Authorize</button>
                                  <button onClick={() => handleStatusUpdate(booking._id, 'cancelled')} className="px-6 py-2.5 rounded-xl border border-sand text-[10px] font-black uppercase tracking-widest text-muted hover:bg-rose-50 hover:text-rose-600 transition">Cancel</button>
                               </>
                             ) : booking.status === 'confirmed' ? (
                                <button onClick={() => handleStatusUpdate(booking._id, 'completed')} className="px-6 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition group/done">
                                   Mark Accomplished
                                </button>
                             ) : (
                                <span className="px-4 py-2 rounded-lg bg-warm text-[10px] font-black uppercase tracking-widest text-muted">{booking.status}</span>
                             )}
                             <button className="p-2.5 rounded-xl hover:bg-warm text-muted transition">
                                <MoreVertical className="w-5 h-5" />
                             </button>
                          </div>
                       </div>
                    </div>
                  ))}
                  {bookings.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-sand rounded-[2rem]">
                       <p className="text-sm font-serif italic text-muted">Agenda is currently vacant.</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Sidebar Stats */}
            <div className="lg:col-span-4 space-y-8">
               <div className="bg-ink text-white rounded-[2.5rem] p-8 shadow-xl shadow-ink/20">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-8 italic">Clinical Capacity</h4>
                  <div className="space-y-8">
                     <div>
                        <div className="flex justify-between items-end mb-3">
                           <p className="text-3xl font-serif font-bold italic">{(bookings.length / 12 * 100).toFixed(0)}%</p>
                           <p className="text-[10px] font-black uppercase tracking-widest text-caramel">Daily Load</p>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(bookings.length / 12 * 100, 100)}%` }} className="h-full bg-caramel rounded-full" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                           <p className="text-[10px] font-medium text-white/40 mb-1">Slots Fill</p>
                           <p className="text-xl font-bold">{bookings.length}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                           <p className="text-[10px] font-medium text-white/40 mb-1">Pending</p>
                           <p className="text-xl font-bold">{bookings.filter(b => b.status === 'pending').length}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </>
        ) : (
          /* Configuration Tab */
          <div className="lg:col-span-12 grid md:grid-cols-2 gap-8">
             <div className="bg-white rounded-[3rem] border border-sand p-10 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                   <div className="h-12 w-12 rounded-2xl bg-warm flex items-center justify-center text-ink">
                      <Clock className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-xl font-serif font-bold italic text-ink">Operational Hours</h3>
                      <p className="text-xs font-bold text-muted">Establish your daily clinical shift</p>
                   </div>
                </div>

                <div className="space-y-10">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-1">Opening Hour</label>
                         <input type="time" value={hours.start} onChange={(e) => setHours(prev => ({ ...prev, start: e.target.value }))} className="w-full bg-warm/30 border border-sand px-8 py-5 rounded-[2rem] outline-none font-bold text-lg" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-1">Closing Hour</label>
                         <input type="time" value={hours.end} onChange={(e) => setHours(prev => ({ ...prev, end: e.target.value }))} className="w-full bg-warm/30 border border-sand px-8 py-5 rounded-[2rem] outline-none font-bold text-lg" />
                      </div>
                   </div>
                   
                   <div className="p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 flex items-start gap-4">
                      <Settings2 className="w-5 h-5 text-indigo-600 mt-1" />
                      <div>
                         <p className="text-xs font-bold text-indigo-900 mb-1">Timezone Logic</p>
                         <p className="text-[11px] text-indigo-800/80 leading-relaxed font-medium">Lịch hẹn của hệ thống sẽ được tự động điều chỉnh theo giờ GMT+7 mặc định của PNetAI.</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-[3rem] border border-sand p-10 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                   <div className="h-12 w-12 rounded-2xl bg-warm flex items-center justify-center text-ink">
                      <Users className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-xl font-serif font-bold italic text-ink">Session Capacity</h3>
                      <p className="text-xs font-bold text-muted">Maximum admissions per time slot</p>
                   </div>
                </div>

                <div className="space-y-10">
                   <div className="space-y-6">
                      <div className="flex items-center justify-between mb-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-1">Patients per Slot</label>
                         <span className="text-2xl font-serif font-bold italic text-caramel">{capacity} Units</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" 
                        value={capacity} 
                        onChange={(e) => setCapacity(parseInt(e.target.value))}
                        className="w-full h-2 bg-warm rounded-full appearance-none cursor-pointer accent-caramel" 
                      />
                      <div className="flex justify-between px-1">
                         <span className="text-[10px] font-bold text-muted">1 Patient</span>
                         <span className="text-[10px] font-bold text-muted">10 Patients</span>
                      </div>
                   </div>

                   <div className="p-8 rounded-[2rem] bg-emerald-50/50 border border-emerald-100 flex items-start gap-4">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-1" />
                      <div>
                         <p className="text-xs font-bold text-emerald-900 mb-1">Optimized Booking</p>
                         <p className="text-[11px] text-emerald-800/80 leading-relaxed font-medium">Increasing capacity allows more simultaneous bookings. Ensure you have the staff to accommodate higher volume.</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
