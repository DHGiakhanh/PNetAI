import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Boxes, 
  Users, 
  ShieldCheck, 
  Crown, 
  LogOut,
  ChevronRight,
  Bell,
  Sparkles,
  Stethoscope,
  Clock,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { bookingService } from "@/services/booking.service";

const resolveProviderStatus = (value?: string) => {
  if (
    value === "pending_sale_approval" ||
    value === "pending_legal_submission" ||
    value === "pending_legal_approval" ||
    value === "approved"
  ) {
    return value;
  }
  return "pending_legal_submission";
};

export default function ServiceProviderLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const onboardingStatus = resolveProviderStatus(user?.providerOnboardingStatus);
  const isApproved = onboardingStatus === "approved";

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (isApproved) {
      bookingService.getProviderBookings()
        .then((data: any[]) => {
           const transformed = data.map((b: any) => ({
             id: b._id,
             title: "New Service Booking",
             message: `${b.user?.name || 'A client'} reserved ${b.service?.title || 'a service'} at ${b.bookingTime}`,
             time: b.createdAt,
             unread: b.status === 'pending'
           }));
           setNotifications(transformed);
        })
        .catch(console.error);
    }
  }, [isApproved]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { to: "/service-provider", label: "Overview", icon: LayoutDashboard, protected: true },
    { to: "/service-provider/orders", label: "Orders Management", icon: Package, protected: true },
    { to: "/service-provider/products", label: "Product Catalog", icon: Boxes, protected: true },
    { to: "/service-provider/services", label: "Clinic Services", icon: Stethoscope, protected: true },
    { to: "/service-provider/customers", label: "Client Directory", icon: Users, protected: true },
    { to: "/service-provider/profile", label: "Atelier Profile", icon: ShieldCheck, protected: false },
    { to: "/service-provider/subscription", label: "Subscription", icon: Crown, protected: false },
  ];

  const currentPath = navItems.find(item => item.to === location.pathname)?.label || "Atelier Panel";

  return (
    <div className="min-h-screen bg-[#FBF9F2] text-ink selection:bg-caramel/20 selection:text-caramel">
      {/* Premium Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-sand shadow-[20px_0_60px_-15px_rgba(0,0,0,0.03)] hidden lg:block">
        <div className="flex flex-col h-full">
          {/* Brand Identity */}
          <div className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-12 w-12 rounded-[1.25rem] bg-ink flex items-center justify-center shadow-xl shadow-ink/20">
                 <Sparkles className="w-6 h-6 text-caramel" />
              </div>
              <div>
                 <h1 className="text-xl font-serif font-bold italic tracking-tight">Atelier Studio</h1>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted leading-none mt-1">Provider Console</p>
              </div>
            </div>
          </div>

          {/* Navigation Registry */}
          <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isLocked = item.protected && !isApproved;
              
              if (isLocked) return (
                <div key={item.to} className="flex items-center gap-4 px-5 py-4 rounded-2xl text-muted/30 cursor-not-allowed border border-transparent">
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-bold">{item.label}</span>
                </div>
              );

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/service-provider"}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 border ${
                      isActive 
                        ? "bg-ink text-white border-ink shadow-2xl shadow-ink/10" 
                        : "text-muted hover:text-ink hover:bg-warm border-transparent"
                    }`
                  }
                >
                  <div className="flex items-center gap-4">
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1`} />
                </NavLink>
              );
            })}

            {!isApproved && (
              <div className="mt-8 p-6 rounded-[2rem] bg-rose-50 border border-rose-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-2">Certification Required</p>
                <p className="text-xs font-medium text-rose-800 leading-relaxed">
                  Please update your legal documents in <span className="font-bold underline">Atelier Profile</span> to unlock all modules.
                </p>
              </div>
            )}
          </nav>

          {/* User Status Bar */}
          <div className="p-6">
            <div className="p-6 bg-[#FBF9F2] border border-sand rounded-[2.5rem]">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-10 w-10 rounded-xl bg-white border border-sand flex items-center justify-center font-bold text-ink">
                  {user?.name?.[0] || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink truncate">{user?.name || "Practitioner"}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">{user?.role?.replace('_', ' ')}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-full bg-white border border-sand text-[10px] font-black uppercase tracking-widest text-ink hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Studio View */}
      <main className="lg:ml-80 min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-sand px-8 h-20 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-ink">{currentPath}</h2>
           </div>

           <div className="hidden xl:flex items-center gap-8 px-8 py-2 bg-warm/30 rounded-full border border-sand/30 shadow-inner">
              <div className="flex items-center gap-3">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-ink/60">Clinic Live</span>
              </div>
              <div className="h-4 w-px bg-sand/50" />
              <div className="flex items-center gap-3">
                 <Clock className="w-3.5 h-3.5 text-caramel/60" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-ink/60">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="h-4 w-px bg-sand/50" />
              <div className="flex items-center gap-3">
                 <ShieldCheck className="w-3.5 h-3.5 text-caramel/60" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-ink/60">Registry Secure</span>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="relative">
                 <button 
                   onClick={() => setShowNotifications(!showNotifications)}
                   className="h-10 w-10 rounded-full bg-white border border-sand flex items-center justify-center text-ink relative hover:bg-warm transition"
                 >
                    <Bell className="w-5 h-5" />
                    {notifications.some((n: any) => n.unread) && (
                      <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-caramel rounded-full border border-white" />
                    )}
                 </button>
                 
                 <AnimatePresence>
                   {showNotifications && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10, scale: 0.95 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, y: 10, scale: 0.95 }}
                       className="absolute top-full right-0 mt-4 w-80 bg-white rounded-[2rem] border border-sand shadow-2xl overflow-hidden z-50 p-2"
                     >
                        <div className="p-4 border-b border-sand/50">
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink">Recent Alerts</p>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                           {notifications.length === 0 ? (
                             <div className="p-10 text-center">
                                <p className="text-xs font-medium text-muted">Quiet for now...</p>
                             </div>
                           ) : (
                             notifications.map((notif: any) => (
                               <div key={notif.id} className="p-4 hover:bg-warm rounded-2xl transition-colors cursor-pointer group">
                                  <div className="flex justify-between items-start mb-1">
                                     <p className="text-[11px] font-black uppercase tracking-widest text-caramel">{notif.title}</p>
                                     {notif.unread && <div className="h-1.5 w-1.5 rounded-full bg-caramel" />}
                                  </div>
                                  <p className="text-xs font-medium text-ink leading-relaxed mb-1">{notif.message}</p>
                                  <p className="text-[9px] font-bold text-muted/40">{new Date(notif.time).toLocaleString()}</p>
                               </div>
                             ))
                           )}
                        </div>
                        <button className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-muted hover:text-ink transition">Clear History</button>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
           </div>
        </header>

        <div className="px-8 py-10 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
