import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  ExternalLink,
  Settings
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin',
      exact: true
    },
    {
      title: 'User Management',
      icon: Users,
      path: '/admin/users'
    }
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
    <div className="flex h-screen bg-gradient-to-r from-pink-50 via-pink-50 to-cyan-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white/60 backdrop-blur-xl border-r border-pink-100 transition-all duration-300 flex flex-col shadow-lg`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-pink-100">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-500 flex items-center justify-center text-white font-bold text-sm">
                PE
              </div>
              <h1 className="text-lg font-bold text-gray-800">Admin Panel</h1>
            </div>
          ) : (
            <Settings className="w-6 h-6 text-pink-500" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-pink-500 transition"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition ${
                  isActive(item.path, item.exact)
                    ? 'bg-pink-500 text-white shadow-lg shadow-pink-200'
                    : 'text-gray-700 hover:bg-pink-50 hover:text-pink-500'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-pink-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold">
              A
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-gray-800 text-sm font-medium">Admin</p>
                <p className="text-gray-500 text-xs">Administrator</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full transition shadow-lg shadow-pink-200"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="h-16 bg-white/60 backdrop-blur-xl border-b border-pink-100 flex items-center justify-between px-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">
            {menuItems.find((item) => isActive(item.path, item.exact))?.title || 'Admin'}
          </h2>
          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-pink-500 transition">
              <Bell className="w-5 h-5" />
            </button>
            <Link to="/" className="text-gray-500 hover:text-pink-500 text-sm flex items-center gap-1 transition">
              <ExternalLink className="w-4 h-4" />
              View Site
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
