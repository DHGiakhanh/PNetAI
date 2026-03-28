import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  Menu,
  LogOut,
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
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const cartRef = useRef<HTMLDivElement | null>(null);
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

  const cartCount = 2;
  const cartPreviewItems = [
    { id: "1", name: "Natural Shampoo", qty: 1, price: "$18.00" },
    { id: "2", name: "Dental Chew Set", qty: 2, price: "$22.00" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAccountOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(target)) {
        setCartOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setAccountOpen(false);
    setCartOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b border-sand bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {showBackButton ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-sand bg-white text-gray-700 hover:bg-warm"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}

          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-brown">
            🐾 PNetAI
          </Link>
          </div>
    
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link
            to="/"
            className={isActive(location.pathname, "/") ? "text-brown" : "text-gray-600 hover:text-brown"}
          >
            Home
          </Link>
          <Link
            to="/products"
            className={isActive(location.pathname, "/products") ? "text-brown" : "text-gray-600 hover:text-brown"}
          >
            Shop
          </Link>
          <Link
            to="/services"
            className={
              location.pathname.startsWith("/services")
                ? "text-brown"
                : "text-gray-600 hover:text-brown"
            }
          >
            Services
          </Link>
          <Link
            to="/blogs"
            className={isActive(location.pathname, "/blogs") ? "text-brown" : "text-gray-600 hover:text-brown"}
          >
            Community
          </Link>
        </nav>

        <div className="relative flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <button
                type="button"
                onClick={() => setCartOpen((prev) => !prev)}
                className="relative grid h-10 w-10 place-items-center rounded-full border border-sand bg-white text-gray-600 hover:text-brown"
                aria-label="Go to cart"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brown px-1 text-[11px] font-semibold text-white">
                  {cartCount}
                </span>
              </button>

              <div ref={accountRef} className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setAccountOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-sand bg-white px-2 py-1 hover:bg-warm"
                >
                  {user?.avatar || user?.avatarUrl ? (
                    <img
                      src={user.avatar ?? user.avatarUrl}
                      alt={user?.name ?? "Profile"}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-brown text-xs font-bold text-white">
                      {initials}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-gray-700">
                    {user?.name ?? "Pet Parent"}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted transition-transform ${accountOpen ? "rotate-180" : ""}`} />
                </button>

                {accountOpen ? (
                  <div className="absolute right-0 top-12 z-[60] w-44 rounded-2xl border border-sand bg-white p-2 shadow-xl">
                    <Link
                      to="/profile"
                      className="flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-warm"
                    >
                      My Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rust hover:bg-warm"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden text-gray-600 hover:text-brown md:block">
                Login
              </Link>
              <Link
                to="/register"
                className="hidden rounded-lg bg-brown px-4 py-2 text-white transition hover:bg-brown-dark md:block"
              >
                Sign Up
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="grid h-10 w-10 place-items-center rounded-full border border-sand bg-white text-gray-700 hover:bg-warm md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen ? (
        <div className="border-t border-sand bg-white/95 px-4 py-4 md:hidden">
          <div className="grid gap-3">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-warm">Home</Link>
            <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-warm">Shop</Link>
            <Link to="/services" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-warm">Services</Link>
            <Link to="/blogs" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-warm">Community</Link>
            {isLoggedIn ? (
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-warm">
                {user?.name ?? "My Profile"}
              </Link>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 rounded-lg border border-caramel px-3 py-2 text-center text-sm font-semibold text-brown-dark">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 rounded-lg bg-brown px-3 py-2 text-center text-sm font-semibold text-white">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>

    <div
      className={`fixed inset-0 z-[55] bg-black/20 transition-opacity duration-300 ${
        cartOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    />

    <aside
      ref={cartRef}
      className={`fixed right-4 top-20 z-[60] w-[350px] rounded-[24px] border border-sand bg-white p-5 shadow-2xl transition-all duration-300 ${
        cartOpen ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0"
      }`}
      aria-hidden={!cartOpen}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-xl font-bold italic text-ink">Your Cart</h3>
        <button
          type="button"
          onClick={() => setCartOpen(false)}
          className="grid h-8 w-8 place-items-center rounded-full border border-sand text-muted hover:bg-warm"
          aria-label="Close cart"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {cartPreviewItems.map((item) => (
          <div key={item.id} className="rounded-2xl border border-sand bg-warm/40 px-3 py-2">
            <p className="text-sm font-semibold text-ink">{item.name}</p>
            <p className="text-xs text-muted">Qty {item.qty}</p>
            <p className="mt-1 text-sm font-bold text-brown">{item.price}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setCartOpen(false)}
        className="mt-4 w-full rounded-full bg-brown py-2.5 text-sm font-semibold text-white transition hover:bg-brown-dark"
      >
        Checkout
      </button>
    </aside>

    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-sand bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-5">
        <Link to="/" className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/") ? "text-brown" : "text-gray-500"}`}>
          <House className="mb-1 h-4 w-4" />
          Home
        </Link>
        <Link to="/products" className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/products") ? "text-brown" : "text-gray-500"}`}>
          <Store className="mb-1 h-4 w-4" />
          Shop
        </Link>
        <Link to="/services" className={`flex flex-col items-center py-2 text-[11px] font-semibold ${location.pathname.startsWith("/services") ? "text-brown" : "text-gray-500"}`}>
          <Scissors className="mb-1 h-4 w-4" />
          Services
        </Link>
        <Link to="/blogs" className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/blogs") ? "text-brown" : "text-gray-500"}`}>
          <Users className="mb-1 h-4 w-4" />
          Community
        </Link>
        <Link to={isLoggedIn ? "/profile" : "/login"} className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/profile") || isActive(location.pathname, "/login") ? "text-brown" : "text-gray-500"}`}>
          {isLoggedIn ? <UserCircle2 className="mb-1 h-4 w-4" /> : <LogIn className="mb-1 h-4 w-4" />}
          {isLoggedIn ? "Profile" : "Login"}
        </Link>
      </div>
    </nav>
    </>
  );
}
