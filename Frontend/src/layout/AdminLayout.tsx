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
  Settings
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
          { title: "Products", icon: Package, path: "/admin/products" },
          { title: "Categories", icon: Shapes, path: "/admin/categories" },
          { title: "Services", icon: Scissors, path: "/admin/services" },
        ]
      : [
          { title: "Dashboard", icon: LayoutDashboard, path: "/admin", exact: true },
          { title: "User Management", icon: Users, path: "/admin/users" },
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
    <div className="flex h-screen bg-gradient-to-br from-warm via-cream to-warm">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white/85 backdrop-blur-xl border-r border-sand transition-all duration-300 flex flex-col shadow-lg`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sand">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brown flex items-center justify-center text-white font-bold text-sm">
                PE
              </div>
              <h1 className="text-lg font-bold text-ink">
                {isServiceProvider ? "Service Provider Panel" : "Admin Panel"}
              </h1>
            </div>
          ) : (
            <Settings className="w-6 h-6 text-brown" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted hover:text-brown transition"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition ${
                  isActive(item.path, item.exact)
                    ? 'bg-brown text-white shadow-md'
                    : 'text-ink hover:bg-warm hover:text-brown'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-sand p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-brown flex items-center justify-center text-white font-bold">
              A
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-ink text-sm font-medium">{user?.name || "User"}</p>
                <p className="text-muted text-xs">
                  {isServiceProvider ? "Service Provider" : role || "member"}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brown hover:bg-brown-dark text-white rounded-full transition shadow-md"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 bg-white/85 backdrop-blur-xl border-b border-sand flex items-center justify-between px-6 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">
            {menuItems.find((item) => isActive(item.path, item.exact))?.title || 'Admin'}
          </h2>

          <div className="flex items-center gap-4">
            <button className="text-muted hover:text-brown transition">
              <Bell className="w-5 h-5" />
            </button>

            <Link
              to="/"
              className="text-muted hover:text-brown text-sm flex items-center gap-1 transition"
            >
              <ExternalLink className="w-4 h-4" />
              View Site
            </Link>
          </div>
        </header>

        {/* 🔥 QUAN TRỌNG: Outlet thay cho children */}
        <div className="w-full h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
