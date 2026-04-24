import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Check, 
  Trash2, 
  Clock, 
  CreditCard,
  Search,
  RefreshCw,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  Stethoscope
} from 'lucide-react';
import apiClient from '@/utils/api.service';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

type Notification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId: string;
  createdAt: string;
};

type BookingDetail = {
  _id: string;
  user: { name: string; email: string; phone: string; avatarUrl?: string };
  pet: { name: string; species: string; breed: string; avatarUrl?: string };
  service: { 
    title: string; 
    location: string;
    providerId: { name: string; email: string; phone: string }
  };
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
};

const RefundRequestsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/notifications');
      setNotifications(response.data.notifications);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingDetails = async (id: string) => {
    setIsModalLoading(true);
    try {
      const response = await apiClient.get(`/admin/bookings/${id}`);
      setSelectedBooking(response.data.booking);
    } catch (error) {
      toast.error("Could not fetch booking details");
    } finally {
      setIsModalLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/admin/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      toast.success("Marked as processed");
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const deleteNotification = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this alert?")) return;
    try {
      await apiClient.delete(`/admin/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success("Alert deleted");
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' ? true : filter === 'unread' ? !n.isRead : n.isRead;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-ink tracking-tight flex items-center gap-3">
            Refund Requests <span className="text-caramel">/</span> 
            <span className="text-muted text-xl font-bold">Admin Alerts</span>
          </h1>
          <p className="text-sm font-medium text-muted mt-2">Manage cancellations and pending refund tasks initiated by providers.</p>
        </div>
        
        <button 
          onClick={fetchNotifications}
          className="p-3 bg-white border border-sand rounded-2xl hover:bg-warm transition-all group shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 text-muted group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-amber-50/50 border border-amber-200 rounded-[2rem] p-8 flex items-center gap-6 shadow-sm">
          <div className="h-16 w-16 bg-white rounded-2xl grid place-items-center shadow-sm">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-800/40">Open Requests</p>
            <p className="text-3xl font-black text-amber-900 leading-none mt-1">
              {notifications.filter(n => !n.isRead && n.type === 'refund_request').length}
            </p>
          </div>
        </div>

        <div className="bg-sky-50/50 border border-sky-200 rounded-[2rem] p-8 flex items-center gap-6 shadow-sm">
          <div className="h-16 w-16 bg-white rounded-2xl grid place-items-center shadow-sm">
            <CreditCard className="w-8 h-8 text-sky-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-800/40">Processed (Total)</p>
            <p className="text-3xl font-black text-sky-900 leading-none mt-1">
               {notifications.filter(n => n.isRead).length}
            </p>
          </div>
        </div>

        <div className="bg-rose-50/50 border border-rose-200 rounded-[2rem] p-8 flex items-center gap-6 shadow-sm">
          <div className="h-16 w-16 bg-white rounded-2xl grid place-items-center shadow-sm">
            <Clock className="w-8 h-8 text-rose-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-800/40">Latest Update</p>
            <p className="text-sm font-black text-rose-900 leading-none mt-1">
              {notifications.length > 0 ? new Date(notifications[0].createdAt).toLocaleDateString() : '--'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-sand rounded-[2.5rem] shadow-xl shadow-ink/5 overflow-hidden">
        <div className="p-8 border-b border-sand flex flex-col md:flex-row gap-6 items-center justify-between bg-warm/20">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text" 
              placeholder="Search by ID, name or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-white border border-sand rounded-2xl text-sm font-medium focus:ring-4 focus:ring-brown/5 focus:border-brown transition-all"
            />
          </div>

          <div className="flex bg-warm/50 p-1 rounded-2xl border border-sand">
            {(['all', 'unread', 'read'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`px-8 py-2.5 rounded-xl capitalize text-xs font-black tracking-widest transition-all ${
                  filter === opt 
                    ? 'bg-brown text-white shadow-lg shadow-brown/20' 
                    : 'text-muted hover:text-ink'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-sand">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="p-20 text-center">
                <RefreshCw className="w-10 h-10 text-muted animate-spin mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-muted">Refreshing alert ledger...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-20 text-center">
                <p className="text-sm font-bold text-muted italic">No matching alerts found.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <motion.div
                  layout
                  key={notif._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`p-8 hover:bg-warm/10 transition-colors group relative ${!notif.isRead ? 'bg-white' : 'bg-warm/5 opacity-70'}`}
                >
                  <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                    <div className={`p-4 rounded-2xl ${notif.type === 'refund_request' ? 'bg-amber-100 text-amber-600' : 'bg-sky-100 text-sky-600'}`}>
                      {notif.type === 'refund_request' ? <AlertCircle className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                    </div>

                    <div className="flex-1 space-y-2">
                       <div className="flex items-center gap-3">
                          <h3 className={`text-lg font-black ${notif.type === 'refund_request' ? 'text-amber-800' : 'text-ink'}`}>
                            {notif.title}
                          </h3>
                          {!notif.isRead && (
                             <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[9px] font-black uppercase tracking-widest rounded-full">New Action</span>
                          )}
                       </div>
                       <p className="text-sm font-medium text-ink/70 leading-relaxed max-w-3xl">
                         {notif.message}
                       </p>
                       <div className="flex items-center gap-6 pt-2">
                          <div className="flex items-center gap-2 text-[10px] font-black text-muted/60 uppercase tracking-widest">
                             <Clock className="w-3 h-3" />
                             {new Date(notif.createdAt).toLocaleString()}
                          </div>
                          {notif.relatedId && (
                            <button 
                              onClick={() => fetchBookingDetails(notif.relatedId)}
                              className="flex items-center gap-2 text-[10px] font-black text-caramel uppercase tracking-widest cursor-pointer hover:text-brown transition"
                            >
                               <ExternalLink className="w-3 h-3" />
                               View Order & Contact Details
                            </button>
                          )}
                       </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
                      {!notif.isRead ? (
                        <button
                          onClick={() => markAsRead(notif._id)}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 text-xs font-black uppercase tracking-widest"
                        >
                          <Check className="w-4 h-4" />
                          Mark Processed
                        </button>
                      ) : (
                        <span className="flex items-center justify-center gap-2 px-6 py-3 bg-warm border border-sand text-muted rounded-2xl text-xs font-black uppercase tracking-widest">
                           <Check className="w-4 h-4" />
                           Refunded
                        </span>
                      )}
                      <button
                        onClick={() => deleteNotification(notif._id)}
                        className="p-3 text-muted hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {(selectedBooking || isModalLoading) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#FBF9F2] shadow-2xl rounded-[3rem] overflow-hidden"
            >
              {isModalLoading ? (
                <div className="p-20 text-center">
                   <RefreshCw className="w-12 h-12 text-brown animate-spin mx-auto mb-4" />
                   <p className="text-xs font-black uppercase tracking-widest text-brown">Tuning into data frequency...</p>
                </div>
              ) : selectedBooking && (
                <>
                  <div className="p-8 border-b border-sand bg-white flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                           <CreditCard className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-black text-ink">Refund Dossier</h2>
                     </div>
                     <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-warm rounded-full transition">
                        <X className="w-5 h-5 text-muted" />
                     </button>
                  </div>

                  <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                     <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Customer Identity</h3>
                        <div className="bg-white border border-sand rounded-3xl p-6 flex items-center gap-6">
                           <div className="h-16 w-16 bg-warm rounded-2xl grid place-items-center text-brown font-black text-xl">
                              {selectedBooking.user.name.charAt(0)}
                           </div>
                           <div className="flex-1 space-y-1">
                              <p className="text-lg font-black text-ink">{selectedBooking.user.name}</p>
                              <div className="flex flex-wrap gap-4 pt-1">
                                 <div className="flex items-center gap-2 text-xs font-bold text-muted hover:text-brown transition cursor-pointer">
                                    <Phone className="w-3 h-3 text-caramel" />
                                    {selectedBooking.user.phone || 'No phone'}
                                 </div>
                                 <div className="flex items-center gap-2 text-xs font-bold text-muted hover:text-brown transition cursor-pointer">
                                    <Mail className="w-3 h-3 text-caramel" />
                                    {selectedBooking.user.email}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </section>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-4">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Vitals</h3>
                           <div className="space-y-3">
                              <div className="flex items-center justify-between py-2 border-b border-sand">
                                 <span className="text-[10px] font-bold text-muted uppercase">Amount</span>
                                 <span className="text-sm font-black text-brown">{(selectedBooking.totalAmount || 0).toLocaleString()} VND</span>
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-sand">
                                 <span className="text-[10px] font-bold text-muted uppercase">Method</span>
                                 <span className="text-xs font-black text-ink uppercase tracking-widest">{selectedBooking.paymentMethod}</span>
                              </div>
                              <div className="flex items-center justify-between py-2">
                                 <span className="text-[10px] font-bold text-muted uppercase">Status</span>
                                 <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full">{selectedBooking.status}</span>
                              </div>
                           </div>
                        </section>

                        <section className="space-y-4">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Appointment</h3>
                           <div className="space-y-3">
                              <div className="flex items-center gap-3 text-sm font-bold text-ink">
                                 <Calendar className="w-4 h-4 text-caramel" />
                                 {new Date(selectedBooking.bookingDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-3 text-sm font-bold text-ink">
                                 <Clock className="w-4 h-4 text-caramel" />
                                 {selectedBooking.bookingTime}
                              </div>
                              <div className="flex items-start gap-3 text-sm font-bold text-ink">
                                 <Stethoscope className="w-4 h-4 text-caramel mt-0.5" />
                                 {selectedBooking.service.title}
                              </div>
                           </div>
                        </section>
                     </div>

                     <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Clinic Intelligence</h3>
                        <div className="bg-ink/5 rounded-3xl p-6">
                           <div className="flex justify-between items-start">
                              <div>
                                 <p className="text-xs font-black text-ink uppercase tracking-wider">{selectedBooking.service.providerId.name}</p>
                                 <p className="text-[11px] font-bold text-muted mt-1 flex items-center gap-2">
                                    <MapPin className="w-3 h-3" />
                                    {selectedBooking.service.location}
                                 </p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-bold text-muted italic">Origin of cancellation</p>
                              </div>
                           </div>
                        </div>
                     </section>
                  </div>

                  <div className="p-8 bg-white border-t border-sand flex gap-4">
                     <button 
                        onClick={() => {
                          const msg = `Hello ${selectedBooking.user.name}, we are processing your refund for booking #${selectedBooking._id.slice(-6).toUpperCase()} at ${selectedBooking.service.providerId.name}.`;
                          window.open(`https://wa.me/${selectedBooking.user.phone}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="flex-1 py-4 bg-ink text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brown transition shadow-xl shadow-ink/20"
                     >
                        Contact via WhatsApp
                     </button>
                      <button 
                        onClick={() => {
                          window.location.href = `mailto:${selectedBooking.user.email}?subject=Refund for Booking #${selectedBooking._id.slice(-6).toUpperCase()}&body=Hello ${selectedBooking.user.name}, we are processing your refund.`;
                        }}
                        className="flex-1 py-4 border border-sand bg-warm text-ink rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-sand transition"
                     >
                        Send Email
                     </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RefundRequestsPage;
