import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Menu,
  LogOut,
  ShoppingCart,
  X,
  House,
  PawPrint,
  Store,
  Scissors,
  Users,
  LogIn,
  Trash2,
} from "lucide-react";
import { cartService, CartItem, CartProduct } from "../services/cart.service";
import { productService } from "../services/product.service";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

type LocalUser = {
  name?: string;
  avatar?: string;
  avatarUrl?: string;
  role?: string;
};

type CartPreviewItem = {
  id: string;
  name: string;
  qty: number;
  stock: number;
  price: number;
  priceText: string;
  image?: string;
};

function isActive(pathname: string, target: string) {
  if (target === "/") return pathname === "/";
  return pathname.startsWith(target);
}

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function AppNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartPreviewItems, setCartPreviewItems] = useState<CartPreviewItem[]>(
    [],
  );
  const accountRef = useRef<HTMLDivElement | null>(null);
  const cartRef = useRef<HTMLDivElement | null>(null);
  const token = localStorage.getItem("token");
  const isLoggedIn = Boolean(token);
  const [userData, setUserData] = useState<LocalUser | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const syncUser = () => {
    try {
      const rawUser = localStorage.getItem("user");
      setUserData(rawUser ? JSON.parse(rawUser) : null);
    } catch {
      setUserData(null);
    }
  };

  const initials = useMemo(() => {
    const name = userData?.name?.trim();
    if (!name) return "PP";
    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [userData]);

  const syncCart = async () => {
    if (!isLoggedIn) {
      setCartCount(0);
      setCartTotal(0);
      setCartPreviewItems([]);
      return;
    }

    try {
      const cart = await cartService.getCart();
      const items = (cart?.items ?? []) as CartItem[];
      setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
      setCartTotal(cart?.totalAmount ?? 0);

      const preview = items.map((item) => {
        const product = item.product as CartProduct;
        return {
          id: product?._id ?? "",
          name: product?.name ?? "Unknown Treasure",
          qty: item.quantity,
          stock: product?.stock ?? 0,
          price: item.price,
          priceText: formatUsd(item.price * item.quantity),
          image: product?.images?.[0] ?? "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=200&auto=format&fit=crop"
        };
      });
      setCartPreviewItems(preview);
      
      // Auto-select new items or items that were already selected
      setSelectedIds(prev => {
        const currentIds = preview.map(p => p.id);
        if (prev.length === 0 && preview.length > 0) return currentIds;
        return prev.filter(id => currentIds.includes(id));
      });
    } catch {
      setCartCount(0);
      setCartTotal(0);
      setCartPreviewItems([]);
    }
  };

  const handleUpdateQty = async (productId: string, newQty: number) => {
    if (newQty < 1) {
      setConfirmDeleteId(productId);
      return;
    }

    const item = cartPreviewItems.find(it => it.id === productId);
    if (!item) return;

    // Smart Inventory Adjustment
    let targetQty = newQty;
    
    // If we're oversold (7 -> 6 case, stock is 5)
    // We should snap to stock to settle the state
    if (targetQty > item.stock && targetQty < item.qty) {
      targetQty = item.stock;
      toast.success(`Curation adjusted to available stock (${item.stock}).`);
    }

    // Block Increasing if already at or over stock
    if (targetQty > item.qty && targetQty > item.stock) {
      toast.error("Out of stock");
      return;
    }
    
    // Save current items for rollback
    const previousItems = [...cartPreviewItems];
    
    // Optimistic Update
    setCartPreviewItems(prev => prev.map(it => 
      it.id === productId ? { ...it, qty: targetQty, priceText: formatUsd(it.price * targetQty) } : it
    ));

    try {
      await cartService.updateCartItem(productId, targetQty);
      syncCart();
      window.dispatchEvent(new Event("cart:updated"));
    } catch (e: any) {
      // Rollback on failure
      setCartPreviewItems(previousItems);
      const errorMsg = e.response?.data?.message || "Check inventory: This treasure may be in high demand.";
      console.error("Cart Update Error Detail:", e.response?.data);
      toast.error(errorMsg);
      console.error("Update error", e);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      await cartService.removeCartItem(productId);
      syncCart();
      window.dispatchEvent(new Event("cart:updated"));
      toast.success("Item removed from cart");
    } catch (e) {
      console.error("Remove error", e);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleProceedToCheckout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Final re-verification of stock for all selected items
      const selectedItems = cartPreviewItems.filter(it => selectedIds.includes(it.id));
      const latestResults = await Promise.all(
        selectedItems.map(item => productService.getProductById(item.id))
      );

      const conflictItem = selectedItems.find((item, idx) => {
        return item.qty > (latestResults[idx]?.stock || 0);
      });

      if (conflictItem) {
        toast.error("Out of stock");
        syncCart(); // Refresh to show current state
        return;
      }

      setCartOpen(false);
      navigate("/checkout", { state: { selectedIds } });
    } catch (err) {
      toast.error("Sync error, please try again.");
    } finally {
      setLoading(false);
      syncCart();
    }
  };

  const selectedTotal = useMemo(() => {
    return cartPreviewItems
      .filter(item => selectedIds.includes(item.id))
      .reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [cartPreviewItems, selectedIds]);

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
        // Prevent closing cart if clicking on the confirmation modal
        const isConfirmModalClick = (target as HTMLElement).closest('.confirm-modal-overlay');
        if (!isConfirmModalClick) {
          setCartOpen(false);
        }
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

  useEffect(() => {
    syncCart();
    syncUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  useEffect(() => {
    const onCartUpdated = () => {
      syncCart();
    };
    const onUserUpdated = () => {
      syncUser();
    };

    window.addEventListener("cart:updated", onCartUpdated);
    window.addEventListener("user:updated", onUserUpdated);
    return () => {
      window.removeEventListener("cart:updated", onCartUpdated);
      window.removeEventListener("user:updated", onUserUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-sand bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 text-xl font-bold text-brown"
            >
              🐾 PNetAI
            </Link>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link
              to="/"
              className={`inline-flex items-center gap-1.5 ${isActive(location.pathname, "/") ? "text-brown" : "text-gray-600 hover:text-brown"}`}
            >
              <House className="h-4 w-4" />
              Home
            </Link>
            {isLoggedIn ? (
              <Link
                to="/my-pets"
                className={`inline-flex items-center gap-1.5 ${isActive(location.pathname, "/my-pets") ? "text-brown" : "text-gray-600 hover:text-brown"}`}
              >
                <PawPrint className="h-4 w-4" />
                My Pets
              </Link>
            ) : null}
            <Link
              to="/services"
              className={`inline-flex items-center gap-1.5 ${location.pathname.startsWith("/services")
                  ? "text-brown"
                  : "text-gray-600 hover:text-brown"
                }`}
            >
              <Scissors className="h-4 w-4" />
              Services
            </Link>
            <Link
              to="/products"
              className={`inline-flex items-center gap-1.5 ${isActive(location.pathname, "/products") ? "text-brown" : "text-gray-600 hover:text-brown"}`}
            >
              <Store className="h-4 w-4" />
              Shop
            </Link>
            <Link
              to="/blogs"
              className={`inline-flex items-center gap-1.5 ${isActive(location.pathname, "/blogs") ? "text-brown" : "text-gray-600 hover:text-brown"}`}
            >
              <Users className="h-4 w-4" />
              Blog
            </Link>
            {isLoggedIn && userData?.role === "sale" ? (
              <Link
                to="/sale/providers"
                className={`inline-flex items-center gap-1.5 ${isActive(location.pathname, "/sale/providers") ? "text-brown" : "text-gray-600 hover:text-brown"}`}
              >
                <Users className="h-4 w-4" />
                Provider Approvals
              </Link>
            ) : null}
          </nav>

          <div className="relative flex items-center gap-3">
            {isLoggedIn ? (
              <div className="hidden text-right md:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Good Morning
                </p>
                <p className="text-sm font-semibold text-ink">
                  Hi,{" "}
                  <span className="font-serif italic text-brown">
                    {userData?.name ?? "Pet Parent"}
                  </span>
                </p>
              </div>
            ) : null}
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => setCartOpen((prev) => !prev)}
                  className="relative grid h-10 w-10 place-items-center rounded-full border border-sand bg-white text-gray-600 hover:text-brown"
                  aria-label="Go to cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 ? (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brown px-1 text-[11px] font-semibold text-white">
                      {cartCount}
                    </span>
                  ) : null}
                </button>

                <div ref={accountRef} className="relative hidden md:block">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-full border border-sand bg-white px-2 py-1 hover:bg-warm"
                  >
                    {userData?.avatar || userData?.avatarUrl ? (
                      <img
                        src={userData.avatar ?? userData.avatarUrl}
                        alt={userData?.name ?? "Profile"}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-brown text-xs font-bold text-white">
                        {initials}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-gray-700">
                      {userData?.name ?? "Pet Parent"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted transition-transform ${accountOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {accountOpen ? (
                    <div className="absolute right-0 top-12 z-[60] w-44 rounded-2xl border border-sand bg-white p-2 shadow-xl">
                      <Link
                        to="/profile"
                        className="flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-warm"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/my-bookings"
                        className="flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-warm"
                      >
                        My Booking
                      </Link>
                      <Link
                        to="/purchased-products"
                        className="flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-warm"
                      >
                        Purchased Products
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
                <Link
                  to="/login"
                  className="hidden text-gray-600 hover:text-brown md:block"
                >
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
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        {mobileMenuOpen ? (
          <div className="border-t border-sand bg-white/95 px-4 py-4 md:hidden">
            <div className="grid gap-3">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-warm"
              >
                Home
              </Link>
              {isLoggedIn ? (
                <Link
                  to="/my-pets"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-warm"
                >
                  My Pets
                </Link>
              ) : null}
              <Link
                to="/services"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-warm"
              >
                Services
              </Link>
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-warm"
              >
                Shop
              </Link>
              <Link
                to="/blogs"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-warm"
              >
                Blog
              </Link>
              {isLoggedIn && userData?.role === "sale" ? (
                <Link
                  to="/sale/providers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-warm"
                >
                  Provider Approvals
                </Link>
              ) : null}
              {isLoggedIn ? (
                <>
                  <p className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-500">
                    {userData?.name ?? "Pet Parent"}
                  </p>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-warm"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/my-bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-warm"
                  >
                    My Booking
                  </Link>
                  <Link
                    to="/purchased-products"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-warm"
                  >
                    Purchased Products
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-rust hover:bg-warm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-lg border border-caramel px-3 py-2 text-center text-sm font-semibold text-brown-dark"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-lg bg-brown px-3 py-2 text-center text-sm font-semibold text-white"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </header>

      {/* Backdrop with Blur */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-[55] bg-black/10 backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      <motion.aside
        ref={cartRef}
        initial={{ x: "100%" }}
        animate={{ x: cartOpen ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30, restDelta: 0.1 }}
        className="fixed right-0 top-0 bottom-0 z-[60] w-full md:w-[480px] bg-[#FCF9F5] shadow-[-20px_0_80px_rgba(44,36,24,0.1)] flex flex-col overflow-hidden"
      >
        {/* Editorial Header */}
        <div className="px-10 pt-12 pb-8 border-b border-sand/30 flex items-end">
          <div>
            <h3 className="font-serif text-4xl font-bold italic text-ink tracking-tight">
              Your Cart
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dark mt-2 block">
              {cartCount} items carefully curated
            </span>
          </div>
        </div>

        {/* Free Shipping Milestone (Ultra-Thin Minimalist) */}
        <div className="px-10 py-6">
          <p className="text-[11px] font-bold text-ink/70 mb-3 tracking-wide">
            {cartTotal >= 100 
              ? "Your treasures ship free across the atelier." 
              : `Just ${formatUsd(100 - cartTotal)} more to unlock complimentary delivery.`
            }
          </p>
          <div className="h-[2px] w-full bg-sand/20 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (cartTotal / 100) * 100)}%` }}
              className="h-full bg-caramel" 
            />
          </div>
        </div>

        {/* Items List (The Editorial Gallery) */}
        <div className="flex-1 overflow-y-auto px-10 py-4 scrollbar-hide">
          {cartPreviewItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-10 pb-20">
              <div className="w-1.5 h-12 bg-caramel/20 rounded-full mb-8" />
              <h4 className="font-serif text-2xl font-bold italic text-ink mb-4">The atelier is empty</h4>
              <p className="text-sm text-muted italic mb-10 leading-relaxed font-serif">
                The cart is currently empty. Shop our treasures to find something special.
              </p>
              <Link
                to="/products"
                onClick={() => setCartOpen(false)}
                className="bg-ink text-white px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-caramel transition-all duration-300"
              >
                Go to Collections
              </Link>
            </div>
          ) : (
            <div className="space-y-12 pb-12">
              {cartPreviewItems.map((item: any) => (
                <div key={item.id} className="relative group">
                  <div className="flex gap-4 items-center">
                    {/* Checkbox */}
                    <button 
                      onClick={() => toggleSelection(item.id)}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${
                        selectedIds.includes(item.id) 
                          ? "bg-caramel border-caramel shadow-lg shadow-caramel/20" 
                          : "border-sand/60 bg-white"
                      }`}
                    >
                      {selectedIds.includes(item.id) && (
                        <motion.div 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }} 
                          className="w-1.5 h-1.5 bg-white rounded-full" 
                        />
                      )}
                    </button>

                    <div className="flex gap-6 flex-1">
                      {/* Image with soft shadow */}
                      <Link to={`/products/${item.id}`} className="relative flex-shrink-0">
                        <div className="w-20 h-28 rounded-2xl overflow-hidden border border-sand/30 shadow-lg shadow-sand-dark/10 group-hover:-translate-y-1 transition-transform duration-500">
                          <img 
                            src={item.image} 
                            className="w-full h-full object-cover transition-all"
                            alt={item.name}
                          />
                        </div>
                      </Link>

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <Link to={`/products/${item.id}`} className="hover:text-caramel transition-colors">
                              <h4 className="text-base font-serif font-bold italic leading-[1.1] transition-colors text-ink">
                                {item.name}
                              </h4>
                            </Link>
                            <button 
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1.5 bg-white border border-sand/40 rounded-full text-muted hover:text-rust opacity-0 group-hover:opacity-100 transition-all scale-90"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.15em] mb-1">Pet Boutique Collection</p>
                          {item.qty > item.stock && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rust/5 rounded-full border border-rust/10">
                              <span className="w-1.5 h-1.5 bg-rust rounded-full animate-pulse" />
                              <span className="text-[9px] font-bold uppercase text-rust tracking-widest italic">Insufficient Stock</span>
                            </div>
                          )}
                        </div>

                        {/* Quantity Controller */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-5 text-[11px] font-bold text-ink pr-5 border-r border-sand/30">
                            <button 
                              onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                              className="w-4 h-4 flex items-center justify-center hover:text-caramel transition-colors"
                            >
                              -
                            </button>
                            <span className="w-4 text-center">{item.qty}</span>
                            <button 
                              onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                              disabled={item.qty >= item.stock}
                              className={`w-4 h-4 flex items-center justify-center transition-colors ${item.qty >= item.stock ? "opacity-30 cursor-not-allowed" : "hover:text-caramel"}`}
                            >
                              +
                            </button>
                          </div>
                          <span className="text-base font-serif font-bold italic transition-colors text-caramel">
                            {item.priceText}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Global Footer */}
        <div className="px-10 py-12 bg-white border-t border-sand/20 shadow-[0_-15px_50px_rgba(44,36,24,0.04)]">
          <div className="flex justify-between items-center mb-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-1">Estimated selected total</p>
              <h4 className="text-[11px] font-bold text-ink/40">Includes local courier dispatch</h4>
            </div>
            <span className="text-3xl font-serif font-bold italic text-ink tracking-tight">
              {formatUsd(selectedTotal)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={handleProceedToCheckout}
              disabled={selectedIds.length === 0 || loading}
              className="w-full bg-ink text-center text-white py-5 rounded-full text-[11px] font-bold uppercase tracking-[0.25em] hover:bg-caramel transition-all duration-500 shadow-2xl shadow-ink/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? "Syncing Manifest..." : "Proceed to secure checkout"}
            </button>
            <button 
              onClick={() => setCartOpen(false)}
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-ink transition-colors py-2"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </motion.aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-sand bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-5">
          {isLoggedIn ? (
            <>
              <Link
                to="/"
                className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/") ? "text-brown" : "text-gray-500"}`}
              >
                <House className="mb-1 h-4 w-4" />
                Home
              </Link>
              <Link
                to="/my-pets"
                className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/my-pets") ? "text-brown" : "text-gray-500"}`}
              >
                <PawPrint className="mb-1 h-4 w-4" />
                My Pets
              </Link>
              <Link
                to="/services"
                className={`flex flex-col items-center py-2 text-[11px] font-semibold ${location.pathname.startsWith("/services") ? "text-brown" : "text-gray-500"}`}
              >
                <Scissors className="mb-1 h-4 w-4" />
                Services
              </Link>
              <Link
                to="/products"
                className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/products") ? "text-brown" : "text-gray-500"}`}
              >
                <Store className="mb-1 h-4 w-4" />
                Shop
              </Link>
              <Link
                to="/blogs"
                className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/blogs") ? "text-brown" : "text-gray-500"}`}
              >
                <Users className="mb-1 h-4 w-4" />
                Blog
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/") ? "text-brown" : "text-gray-500"}`}
              >
                <House className="mb-1 h-4 w-4" />
                Home
              </Link>
              <Link
                to="/services"
                className={`flex flex-col items-center py-2 text-[11px] font-semibold ${location.pathname.startsWith("/services") ? "text-brown" : "text-gray-500"}`}
              >
                <Scissors className="mb-1 h-4 w-4" />
                Services
              </Link>
              <Link
                to="/products"
                className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/products") ? "text-brown" : "text-gray-500"}`}
              >
                <Store className="mb-1 h-4 w-4" />
                Shop
              </Link>
              <Link
                to="/blogs"
                className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/blogs") ? "text-brown" : "text-gray-500"}`}
              >
                <Users className="mb-1 h-4 w-4" />
                Blog
              </Link>
              <Link
                to="/login"
                className={`flex flex-col items-center py-2 text-[11px] font-semibold ${isActive(location.pathname, "/login") ? "text-brown" : "text-gray-500"}`}
              >
                <LogIn className="mb-1 h-4 w-4" />
                Login
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Premium Confirm Removal Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 confirm-modal-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteId(null)}
              className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative w-full max-w-[340px] rounded-[2.5rem] bg-white p-10 shadow-[0_45px_100px_rgba(44,36,24,0.15)] text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-caramel/10" />
              <div className="mb-8">
                <div className="w-16 h-16 bg-rust/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-7 h-7 text-rust" />
                </div>
                <h4 className="font-serif text-2xl font-bold italic text-ink mb-3 italic">Remove from Cart?</h4>
              </div>

              <div className="grid gap-3">
                <button
                  onClick={() => {
                    handleRemoveItem(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="w-full bg-ink text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-rust transition-all active:scale-[0.98]"
                >
                  Confirm Removal
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="w-full bg-sand/10 text-muted-dark py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-sand/20 transition-all"
                >
                  Keep for now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
