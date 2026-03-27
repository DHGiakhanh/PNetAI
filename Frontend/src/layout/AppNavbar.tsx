import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Menu,
  ShoppingCart,
  X,
  House,
  Store,
  Scissors,
  Users,
  UserCircle2,
  LogIn,
} from "lucide-react";

type AppNavbarProps = {
  showBackButton?: boolean;
};

type LocalUser = {
  name?: string;
  avatar?: string;
  avatarUrl?: string;
};

function isActive(pathname: string, target: string) {
  if (target === "/") return pathname === "/";
  return pathname.startsWith(target);
}

export function AppNavbar({
  showBackButton = false,
}: AppNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const token = localStorage.getItem("token");
  const isLoggedIn = Boolean(token);
  let user: LocalUser | null = null;
  try {
    const rawUser = localStorage.getItem("user");
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }

  const initials = useMemo(() => {
    const name = user?.name?.trim();
    if (!name) return "PP";
    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [user]);

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b border-pink-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {showBackButton ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-pink-100 bg-white text-gray-700 hover:bg-pink-50"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-pink-500">
            🐾 PNetAI
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link
            to="/"
            className={isActive(location.pathname, "/") ? "text-pink-500" : "text-gray-600 hover:text-pink-500"}
          >
            Home
          </Link>
          <Link
            to="/products"
            className={isActive(location.pathname, "/products") ? "text-pink-500" : "text-gray-600 hover:text-pink-500"}
          >
            Shop
          </Link>
          <Link
            to="/products?category=grooming"
            className={
              location.pathname.startsWith("/services") ||
              location.search.includes("category=grooming") ||
              location.search.includes("category=vet")
                ? "text-pink-500"
                : "text-gray-600 hover:text-pink-500"
            }
          >
            Services
          </Link>
          <Link
            to="/blogs"
            className={isActive(location.pathname, "/blogs") ? "text-pink-500" : "text-gray-600 hover:text-pink-500"}
          >
            Community
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link
                to="/cart"
                className="relative grid h-10 w-10 place-items-center rounded-full border border-pink-100 bg-white text-gray-600 hover:text-pink-500"
                aria-label="Go to cart"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-pink-500 px-1 text-[11px] font-semibold text-white">
                  2
                </span>
              </Link>

              <Link to="/profile" className="hidden items-center gap-2 rounded-full border border-pink-100 bg-white px-2 py-1 hover:bg-pink-50 md:flex">
                {user?.avatar || user?.avatarUrl ? (
                  <img
                    src={user.avatar ?? user.avatarUrl}
                    alt={user?.name ?? "Profile"}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-pink-500 text-xs font-bold text-white">
                    {initials}
                  </span>
                )}
                <span className="pr-2 text-sm font-semibold text-gray-700">
                  {user?.name ?? "Pet Parent"}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden text-gray-600 hover:text-pink-500 md:block">
                Login
              </Link>
              <Link
                to="/register"
                className="hidden rounded-lg bg-pink-500 px-4 py-2 text-white transition hover:bg-pink-600 md:block"
              >
                Sign Up
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="grid h-10 w-10 place-items-center rounded-full border border-pink-100 bg-white text-gray-700 hover:bg-pink-50 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen ? (
        <div className="border-t border-pink-100 bg-white/95 px-4 py-4 md:hidden">
          <div className="grid gap-3">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-pink-50">Home</Link>
            <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-pink-50">Shop</Link>
            <Link to="/products?category=grooming" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-pink-50">Services</Link>
            <Link to="/blogs" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-pink-50">Community</Link>
            {isLoggedIn ? (
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-pink-50">
                {user?.name ?? "My Profile"}
              </Link>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 rounded-lg border border-pink-200 px-3 py-2 text-center text-sm font-semibold text-pink-600">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 rounded-lg bg-pink-500 px-3 py-2 text-center text-sm font-semibold text-white">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-pink-100 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-5">
        <Link to="/" className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/") ? "text-pink-500" : "text-gray-500"}`}>
          <House className="mb-1 h-4 w-4" />
          Home
        </Link>
        <Link to="/products" className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/products") ? "text-pink-500" : "text-gray-500"}`}>
          <Store className="mb-1 h-4 w-4" />
          Shop
        </Link>
        <Link to="/products?category=grooming" className={`flex flex-col items-center py-2 text-[11px] font-semibold ${location.pathname.startsWith("/services") || location.search.includes("category=grooming") || location.search.includes("category=vet") ? "text-pink-500" : "text-gray-500"}`}>
          <Scissors className="mb-1 h-4 w-4" />
          Services
        </Link>
        <Link to="/blogs" className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/blogs") ? "text-pink-500" : "text-gray-500"}`}>
          <Users className="mb-1 h-4 w-4" />
          Community
        </Link>
        <Link to={isLoggedIn ? "/profile" : "/login"} className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/profile") || isActive(location.pathname, "/login") ? "text-pink-500" : "text-gray-500"}`}>
          {isLoggedIn ? <UserCircle2 className="mb-1 h-4 w-4" /> : <LogIn className="mb-1 h-4 w-4" />}
          {isLoggedIn ? "Profile" : "Login"}
        </Link>
      </div>
    </nav>
    </>
  );
}

