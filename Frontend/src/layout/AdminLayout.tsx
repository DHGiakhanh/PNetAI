import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package,
  Shapes,
  Scissors,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CreditCard,
  Banknote,
  UserPlus,
  Users2
} from 'lucide-react';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role;
  const isServiceProvider = role === "service_provider" || role === "shop";

  const adminMenuItems = [
    { section: "Main", title: "Overview", icon: LayoutDashboard, path: "/admin", exact: true },
    
    { section: "Users", title: "Sales Team", icon: UserPlus, path: "/admin/users/sales" },
    { section: "Users", title: "Providers", icon: Users2, path: "/admin/users/providers" },
    { section: "Users", title: "Pet Owners", icon: Users, path: "/admin/users/owners" },

    { section: "Finance", title: "Transactions", icon: CreditCard, path: "/admin/finance/transactions" },
    { section: "Finance", title: "Payouts / Ledger", icon: Banknote, path: "/admin/finance/payouts" },

    { section: "Moderation", title: "Blog Queue", icon: BookOpen, path: "/admin/blogs/approvals" },
  ];

  const providerMenuItems = [
    { title: "Overview", icon: LayoutDashboard, path: "/admin", exact: true },
    { title: "Products", icon: Package, path: "/admin/products" },
    { title: "Categories", icon: Shapes, path: "/admin/categories" },
    { title: "Services", icon: Scissors, path: "/admin/services" },
    { title: "Customers Booking", icon: Users, path: "/admin/bookings" },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Grouped Menu for Admin
  const renderAdminNav = () => {
    const sections = ["Main", "Users", "Finance", "Moderation"];
    return sections.map((section) => (
      <div key={section} className="mb-6">
        {sidebarOpen && (
          <p className="px-6 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted/40">
            {section}
          </p>
        )}
        {adminMenuItems
          .filter((item) => item.section === section)
          .map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mx-2 flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200 ${
                  active
                    ? 'bg-brown text-white shadow-lg shadow-brown/20'
                    : 'text-ink hover:bg-warm hover:text-brown'
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-caramel'}`} />
                {sidebarOpen && <span className="text-sm font-medium">{item.title}</span>}
              </Link>
            );
          })}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } border-r border-sand bg-white/70 backdrop-blur-3xl transition-all duration-300 ease-in-out`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-sand px-4">
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-[10px] font-black text-white shadow-xl shadow-ink/10">
                  A
                </div>
                <h1 className="text-xs font-black uppercase tracking-widest text-ink">
                  {isServiceProvider ? "Provider" : "Admin"}
                </h1>
              </div>
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink mx-auto text-[10px] font-black text-white">
                A
              </div>
            )}
            {sidebarOpen && (
               <button
                 onClick={() => setSidebarOpen(!sidebarOpen)}
                 className="p-1 rounded-lg hover:bg-warm text-muted transition"
               >
                 <ChevronLeft className="h-5 w-5" />
               </button>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto py-6">
            {!sidebarOpen && (
               <button
                 onClick={() => setSidebarOpen(true)}
                 className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl mb-6 bg-warm text-muted"
               >
                 <ChevronRight className="h-5 w-5" />
               </button>
            )}
            {isServiceProvider 
              ? providerMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`mx-2 flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                        isActive(item.path, item.exact)
                          ? 'bg-brown text-white shadow-md'
                          : 'text-ink hover:bg-warm'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {sidebarOpen && <span className="font-medium">{item.title}</span>}
                    </Link>
                  );
                })
              : renderAdminNav()
            }
          </nav>

          <div className="border-t border-sand p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink/5 hover:bg-rust hover:text-white px-3 py-3 text-ink transition-all duration-300 group"
            >
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
              {sidebarOpen && <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className={`min-h-screen transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
