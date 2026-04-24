import { useState, useEffect } from 'react';
import { 
  Package, 
  Calendar,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Truck,
  Stethoscope,
  ChevronDown
} from 'lucide-react';
import apiClient from '@/utils/api.service';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

type Order = {
  _id: string;
  user: { name: string; email: string };
  totalPrice: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
};

type Booking = {
  _id: string;
  user: { name: string; email: string; phone: string };
  pet: { name: string; species: string };
  service: { 
    title: string; 
    location: string;
    providerId: { name: string }
  };
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

const AdminOrdersPage = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'bookings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'orders' ? '/admin/orders' : '/admin/bookings';
      const response = await apiClient.get(endpoint, {
        params: { page, status, limit: 8 }
      });
      
      if (activeTab === 'orders') {
        setOrders(response.data.orders);
      } else {
        setBookings(response.data.bookings);
      }
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, page, status]);

  const getStatusBadge = (s: string) => {
    switch (s.toLowerCase()) {
      case 'paid':
      case 'confirmed':
      case 'completed':
      case 'success':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">Confirmed</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-widest">Pending</span>;
      case 'shipped':
      case 'delivering':
        return <span className="px-3 py-1 bg-sky-50 text-sky-600 border border-sky-100 rounded-full text-[10px] font-black uppercase tracking-widest">Shipped</span>;
      case 'cancelled':
      case 'failed':
      case 'refunded':
        return <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[10px] font-black uppercase tracking-widest">{s}</span>;
      default:
        return <span className="px-3 py-1 bg-gray-50 text-gray-400 border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest">{s}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold italic text-ink mb-2 leading-tight">Order Atelier</h1>
          <p className="text-muted text-sm font-medium">Monitoring product commerce and service appointment flow across the ecosystem.</p>
        </div>
        
        <div className="flex bg-warm p-1 rounded-2xl border border-sand shadow-inner overflow-hidden">
          <button 
            onClick={() => { setActiveTab('orders'); setPage(1); setStatus(''); }}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'orders' ? 'bg-white text-ink shadow-lg' : 'text-muted hover:text-ink'}`}
          >
            <Package className="w-4 h-4" /> Product Orders
          </button>
          <button 
            onClick={() => { setActiveTab('bookings'); setPage(1); setStatus(''); }}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'bookings' ? 'bg-white text-ink shadow-lg' : 'text-muted hover:text-ink'}`}
          >
            <Calendar className="w-4 h-4" /> Service Bookings
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] border border-sand/50 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
             <input 
               type="text" 
               placeholder="Search identifiers or customer..."
               className="w-full bg-warm/20 border border-sand/30 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold focus:border-caramel transition-all outline-none"
             />
          </div>
          <div className="relative group">
             <select 
               value={status}
               onChange={(e) => { setStatus(e.target.value); setPage(1); }}
               className="appearance-none bg-warm/20 border border-sand/30 rounded-2xl pl-6 pr-10 py-3 text-xs font-black uppercase tracking-widest focus:border-caramel transition-all outline-none"
             >
               <option value="">All Status</option>
               <option value="pending">Pending</option>
               <option value="confirmed">Confirmed</option>
               <option value="completed">Completed</option>
               <option value="cancelled">Cancelled</option>
             </select>
             <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          </div>
        </div>

        <button 
          onClick={fetchData}
          className="p-3 bg-white border border-sand rounded-2xl hover:bg-warm transition-all group"
        >
          <RefreshCw className={`w-4 h-4 text-muted group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Table Atelier */}
      <div className="bg-white rounded-[3rem] border border-sand/50 shadow-xl shadow-ink/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-warm/10 border-b border-sand">
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Identification</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Customer & Logistics</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Economic Value</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Status</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/30">
              <AnimatePresence mode="wait">
                {loading ? (
                  <tr key="loading">
                    <td colSpan={5} className="py-24 text-center">
                       <div className="flex flex-col items-center gap-4">
                          <div className="w-10 h-10 border-4 border-caramel/20 border-t-caramel rounded-full animate-spin" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Retrieving Global Ledger...</p>
                       </div>
                    </td>
                  </tr>
                ) : activeTab === 'orders' ? (
                  orders.length === 0 ? (
                    <tr key="empty-orders"><td colSpan={5} className="py-24 text-center text-muted font-medium italic">No commerce orders found.</td></tr>
                  ) : orders.map((order) => (
                    <motion.tr 
                      key={order._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-warm/5 transition-colors group"
                    >
                      <td className="px-10 py-8">
                        <p className="text-xs font-black text-ink">ORD-{order._id.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] font-medium text-muted mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-ink">{order.user?.name}</span>
                          <span className="text-[10px] font-medium text-muted">{order.user?.email}</span>
                          <div className="flex items-center gap-2 mt-1">
                             <Truck className="w-3 h-3 text-caramel/50" />
                             <span className="text-[9px] font-black text-caramel uppercase tracking-widest">Standard Delivery</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <p className="text-sm font-black text-ink">{(order.totalPrice || 0).toLocaleString()} VND</p>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{order.paymentMethod || 'N/A'}</p>
                      </td>
                      <td className="px-10 py-8">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button className="p-3 rounded-2xl hover:bg-ink hover:text-white transition-all">
                           <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  bookings.length === 0 ? (
                     <tr key="empty-bookings"><td colSpan={5} className="py-24 text-center text-muted font-medium italic">No clinic appointments recorded.</td></tr>
                  ) : bookings.map((booking) => (
                    <motion.tr 
                       key={booking._id}
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="hover:bg-warm/5 transition-colors group"
                    >
                      <td className="px-10 py-8">
                        <p className="text-xs font-black text-ink">BKG-{booking._id.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] font-medium text-muted mt-1">{new Date(booking.bookingDate).toLocaleDateString()}</p>
                        <p className="text-[10px] font-bold text-caramel mt-0.5">{booking.bookingTime}</p>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-ink">{booking.user?.name || 'Unknown User'}</span>
                          <div className="flex items-center gap-2">
                             <Stethoscope className="w-3 h-3 text-sky-500" />
                             <span className="text-[10px] font-black text-muted uppercase tracking-tighter truncate max-w-[120px]">
                               {booking.service?.title || 'Unknown Service'}
                             </span>
                          </div>
                          <span className="text-[9px] font-black text-brown uppercase tracking-widest mt-1">
                             {booking.service?.providerId?.name || 'Unknown Clinic'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <p className="text-sm font-black text-ink">{(booking.totalAmount || 0).toLocaleString()} VND</p>
                        <p className="text-[10px] font-bold text-muted/50 uppercase tracking-widest">Medical Service</p>
                      </td>
                      <td className="px-10 py-8">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button className="p-3 rounded-2xl hover:bg-ink hover:text-white transition-all text-muted">
                           <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination Atelier */}
        <div className="px-10 py-8 bg-warm/5 border-t border-sand flex items-center justify-between">
           <p className="text-[11px] font-bold text-muted uppercase tracking-[0.1em]">
             Entry {page} of {totalPages} in the global ledger
           </p>
           <div className="flex items-center gap-3">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-3 rounded-2xl bg-white border border-sand hover:bg-warm transition-all disabled:opacity-20"
              >
                 <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-3 rounded-2xl bg-white border border-sand hover:bg-warm transition-all disabled:opacity-20"
              >
                 <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
