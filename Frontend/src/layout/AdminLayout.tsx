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
  Bell,
  ExternalLink,
  Settings,
  BookOpen
} from 'lucide-react';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role;
  const isServiceProvider = role === "service_provider" || role === "shop";

  const menuItems =
    isServiceProvider
      ? [
          { title: "Overview", icon: LayoutDashboard, path: "/admin", exact: true },
          { title: "Products", icon: Package, path: "/admin/products" },
          { title: "Categories", icon: Shapes, path: "/admin/categories" },
          { title: "Services", icon: Scissors, path: "/admin/services" },
          { title: "Customers Booking", icon: Users, path: "/admin/bookings" },
        ]
      : [
          { title: "Dashboard", icon: LayoutDashboard, path: "/admin", exact: true },
          { title: "User Management", icon: Users, path: "/admin/users" },
          { title: "Blog Moderation", icon: BookOpen, path: "/admin/blogs/approvals" },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm via-cream to-warm">
      <aside
        className={`fixed inset-y-0 left-0 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } border-r border-sand bg-white/90 backdrop-blur-xl transition-all duration-300`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-sand px-4">
            {sidebarOpen ? (
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-brown text-sm font-bold text-white">
                  PE
                </div>
                <h1 className="text-base font-bold text-ink">
                  {isServiceProvider ? "Service Provider" : "Admin"} Panel
                </h1>
              </div>
            ) : (
              <Settings className="h-5 w-5 text-brown" />
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted transition hover:text-brown"
            >
              {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`mx-2 flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                    isActive(item.path, item.exact)
                      ? 'bg-brown text-white shadow-md'
                      : 'text-ink hover:bg-warm hover:text-brown'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen ? <span className="font-medium">{item.title}</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sand p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-brown font-bold text-white">
                {(user?.name?.[0] || "U").toUpperCase()}
              </div>
              {sidebarOpen ? (
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{user?.name || "User"}</p>
                  <p className="text-xs text-muted">{isServiceProvider ? "Service Provider" : role || "member"}</p>
                </div>
              ) : null}
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brown px-3 py-2 text-white transition hover:bg-brown-dark"
            >
              <LogOut className="h-4 w-4" />
              {sidebarOpen ? <span className="text-sm">Logout</span> : null}
            </button>
          </div>
        </div>
      </aside>

      <main className={`min-h-screen transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-sand bg-white/85 px-6 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-ink">
            {menuItems.find((item) => isActive(item.path, item.exact))?.title || 'Admin'}
          </h2>

          <div className="flex items-center gap-4">
            <button className="text-muted transition hover:text-brown">
              <Bell className="h-5 w-5" />
            </button>
            <Link to="/" className="flex items-center gap-1 text-sm text-muted transition hover:text-brown">
              <ExternalLink className="h-4 w-4" />
              View Site
            </Link>
          </div>
        </header>

        <div className="min-h-[calc(100vh-4rem)] p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
