import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  CalendarCheck, 
  Award, 
  Bell, 
  ArrowUpRight, 
  Clock, 
  FileText,
  AlertCircle,
  ChevronRight,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { authService, UserProfile } from "@/services/auth.service";
import { bookingService } from "@/services/booking.service";
import apiClient from "@/utils/api.service";

export const ServiceProviderOverview = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [productRevenue, setProductRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const [userData, bookingData, productRevenueData] = await Promise.all([
          authService.getCurrentUser(),
          bookingService.getProviderBookings(),
          apiClient.get(`/orders/provider/product-revenue?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
        ]);
        setUser(userData);
        setBookings(bookingData);
        setProductRevenue(Number(productRevenueData?.data?.productRevenue || 0));
      } catch (error) {
        console.error("Fetch Data Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const now = new Date();
  const monthlyClinicRevenue = bookings
    .filter((b) => {
      if (!(b.status === "confirmed" || b.status === "completed")) return false;
      const bookingDate = new Date(b.bookingDate);
      return (
        bookingDate.getMonth() === now.getMonth() &&
        bookingDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalRevenue = monthlyClinicRevenue + productRevenue;

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  const STAT_CARDS = [
    { 
      id: "revenue", 
      label: "Monthly Revenue", 
      value: `VND ${totalRevenue.toLocaleString()}`, 
      subvalue: "Clinic services + product sales", 
      icon: TrendingUp, 
      color: "bg-emerald-50 text-emerald-600" 
    },
    { 
      id: "bookings", 
      label: "Pending List", 
      value: pendingBookings.toString(), 
      subvalue: "Requires your authorization", 
      icon: CalendarCheck, 
      color: "bg-amber-50 text-amber-600" 
    },
    { 
      id: "credits", 
      label: "Available Credits", 
      value: user?.articleCredits?.toString() || "0", 
      subvalue: "Blog publishing tokens", 
      icon: Award, 
      color: "bg-indigo-50 text-indigo-600" 
    }
  ];

  const notifications = [
    ...(pendingBookings > 0 ? [{
      id: 'pending-alert',
      type: "booking",
      title: "Action Required: Pending Bookings",
      desc: `You have ${pendingBookings} new appointments waiting for confirmation in your queue.`,
      time: "Live",
      priority: "high"
    }] : []),
    { 
      id: 2, 
      type: "legal", 
      title: "Registry Status", 
      desc: user?.providerOnboardingStatus === 'approved' 
        ? "Your atelier is officially certified and visible to the community." 
        : "Your certification is currently under review by our legal team.", 
      time: "System",
      priority: user?.providerOnboardingStatus === 'approved' ? "low" : "medium"
    }
  ];

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
       <Loader2 className="w-10 h-10 animate-spin text-caramel" />
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-caramel mb-2">
            <div className="w-10 h-px bg-caramel"></div>
            Management Atelier
          </div>
          <h1 className="text-4xl font-serif font-bold italic text-ink">
            Business Vitality
          </h1>
          <p className="text-sm font-medium text-muted mt-2">
            Welcome back, <span className="text-ink font-bold">{user?.name}</span>. Monitor your clinic's pulse.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white border border-sand flex items-center justify-center text-ink shadow-sm">
             <Clock className="w-5 h-5" />
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-widest text-muted leading-none mb-1">Clinic Status</p>
             <p className={`text-sm font-bold ${user?.providerOnboardingStatus === 'approved' ? 'text-emerald-600' : 'text-amber-500'}`}>
                {user?.providerOnboardingStatus === 'approved' ? 'Officially Certified' : 'Verification Pending'}
             </p>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STAT_CARDS.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={stat.id}
              className="bg-white rounded-[2.5rem] p-8 border border-sand shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center justify-between mb-8">
                 <div className={`p-4 rounded-2xl ${stat.color}`}>
                   <Icon className="w-6 h-6" />
                 </div>
                 <button className="h-10 w-10 rounded-full bg-warm flex items-center justify-center text-muted group-hover:bg-ink group-hover:text-white transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                 </button>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted/60 mb-2">{stat.label}</p>
              <h2 className="text-2xl font-serif font-bold italic text-ink mb-1">{stat.value}</h2>
              <p className="text-[11px] font-bold text-caramel">{stat.subvalue}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Strategic Alerts */}
        <section className="lg:col-span-12">
          <div className="bg-white rounded-[3rem] border border-sand p-10 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-warm flex items-center justify-center text-ink">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold italic text-ink">Strategic Alerts</h3>
                  <p className="text-xs font-bold text-muted">System notifications & focus cues</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {notifications.length > 0 ? notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className="group flex items-center gap-6 p-6 rounded-[1.5rem] bg-[#FBF9F2]/50 border border-transparent hover:border-sand/50 hover:bg-white transition-all cursor-default"
                >
                  <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${
                    notif.priority === 'high' ? 'bg-rose-50 text-rose-500' : 
                    notif.priority === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                  }`}>
                    {notif.priority === 'high' ? <AlertCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-bold text-ink">{notif.title}</p>
                      <span className="text-[10px] font-medium text-muted/40">— {notif.time}</span>
                    </div>
                    <p className="text-xs font-medium text-muted/80 leading-relaxed max-w-2xl">
                      {notif.desc}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-sand group-hover:text-caramel transition-colors" />
                </div>
              )) : (
                <div className="text-center py-20 bg-warm/20 rounded-[2rem] border border-dashed border-sand">
                   <p className="text-sm font-serif italic text-muted">All targets achieved. No urgent alerts in the queue.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
