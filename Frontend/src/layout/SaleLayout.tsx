import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CheckCircle2, LogOut, UserCircle2, Users } from "lucide-react";

export default function SaleLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm via-cream to-warm">
      <aside className="fixed inset-y-0 left-0 z-40 w-72 border-r border-sand bg-white/90 backdrop-blur-xl">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-2 border-b border-sand px-5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-brown text-sm font-bold text-white">
              SL
            </div>
            <h1 className="text-base font-bold text-ink">Sale Panel</h1>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            <NavLink
              to="/sale/providers"
              className={({ isActive }) =>
                `mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? "bg-brown text-white" : "text-ink hover:bg-warm"
                }`
              }
            >
              <Users className="h-5 w-5" />
              Providers You Manage
            </NavLink>
            <NavLink
              to="/sale/approvals/accounts"
              end
              className={({ isActive }) =>
                `mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? "bg-brown text-white" : "text-ink hover:bg-warm"
                }`
              }
            >
              <CheckCircle2 className="h-5 w-5" />
              Account Approvals
            </NavLink>
            <NavLink
              to="/sale/approvals/legal"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? "bg-brown text-white" : "text-ink hover:bg-warm"
                }`
              }
            >
              <CheckCircle2 className="h-5 w-5" />
              Legal Approvals
            </NavLink>
            <NavLink
              to="/sale/profile"
              className={({ isActive }) =>
                `mt-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? "bg-brown text-white" : "text-ink hover:bg-warm"
                }`
              }
            >
              <UserCircle2 className="h-5 w-5" />
              My Profile
            </NavLink>
          </nav>

          <div className="border-t border-sand p-4">
            <p className="text-sm font-semibold text-ink">{user?.name || "Sale User"}</p>
            <p className="mb-3 text-xs text-muted">Sale Representative</p>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brown px-3 py-2 text-white hover:bg-brown-dark"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-72 min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-sand bg-white/85 px-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-ink">Sale Workspace</h2>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Service Provider
          </span>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
