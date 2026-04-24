import { useState, useMemo, useEffect } from "react";
import { 
  MapPin, 
  Zap, 
  ChevronUp, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  ArrowLeft,
  Home,
  QrCode,
  PackageCheck,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { cartService, CartItem, CartProduct } from "../../services/cart.service";
import { authService } from "../../services/auth.service";
import { productService } from "../../services/product.service";
import apiClient from "@/utils/api.service";
import {
  EXPRESS_SHIPPING_FEE_VND,
  formatVnd,
  FREE_SHIPPING_THRESHOLD_VND,
  STANDARD_SHIPPING_FEE_VND,
} from "@/utils/currency";

// --- Types ---
type ShippingMethod = "standard" | "express";
type PaymentMethod = "cod" | "qr";

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  stock: number;
  image: string;
}

// --- Main Component ---
export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<"checkout" | "success">("checkout");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Data State
  const [cartItems, setCartItems] = useState<CheckoutItem[]>([]);
  const [userData, setUserData] = useState<any>(null);
  
  // Get selection from Navbar state fallback to all if not present
  const selectedIds = location.state?.selectedIds || [];

  // Selection State
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [showVoucher, setShowVoucher] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);

  // Load Data
  useEffect(() => {
    const init = async () => {
      try {
        const [cart, user] = await Promise.all([
          cartService.getCart(),
          authService.getCurrentUser()
        ]);
        
        let items = (cart?.items ?? []).map((item: CartItem) => {
          const product = item.product as CartProduct;
          return {
            id: product?._id ?? "",
            name: product?.name ?? "Unknown Treasure",
            price: item.price,
            qty: item.quantity,
            stock: product?.stock ?? 0,
            image: product?.images?.[0] ?? "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=200&auto=format&fit=crop"
          };
        });

        // STRICTLY filter if state was passed from the Navbar
        if (location.state && Array.isArray(location.state.selectedIds)) {
          items = items.filter((item: CheckoutItem) => selectedIds.includes(item.id));
        }
        
        setCartItems(items);
        setUserData(user);
        
        if (items.length === 0) {
          toast.error("Your selection is empty");
          navigate("/products");
        }
      } catch (err) {
        console.error("Checkout init error", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  // Calculations
  const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0), [cartItems]);
  const shippingFee =
    shippingMethod === "express"
      ? EXPRESS_SHIPPING_FEE_VND
      : subtotal >= FREE_SHIPPING_THRESHOLD_VND
        ? 0
        : STANDARD_SHIPPING_FEE_VND;
  const total = subtotal + shippingFee - discount;

  // Actions
  const handleApplyVoucher = () => {
    if (voucherCode.toUpperCase() === "PAWHAUS") {
      setDiscount(subtotal * 0.1);
      toast.success("Voucher applied! Enjoy 10% off your curation.");
      setShowVoucher(false);
    } else {
      toast.error("Invalid voucher code.");
    }
  };

  const handlePlaceOrder = async () => {
    setProcessing(true);
    
    // 1. REAL-TIME FINAL VERIFICATION (The "Race" Check)
    try {
      setProcessing(true);
      
      // Fetch latest stock for each item in the manifest directly before placing order
      const latestStockResults = await Promise.all(
        cartItems.map(item => productService.getProductById(item.id))
      );

      // Check if any curation is no longer available in the requested quantity
      const conflictItemIdx = cartItems.findIndex((item, idx) => {
        const latestProduct = latestStockResults[idx];
        return item.qty > (latestProduct?.stock || 0);
      });

      if (conflictItemIdx > -1) {
        toast.error("Out of stock");
        setProcessing(false);
        return;
      }
    } catch (err) {
      console.error("Critical Race Condition check failed", err);
      toast.error("Hệ thống đang kiểm tra lại kho hàng, vui lòng thử lại sau giây lát.");
      setProcessing(false);
      return;
    }

    // 2. Process Order via backend
    try {
      const shippingAddress = {
        name: userData?.name || "Customer",
        phone: userData?.phone || "0000000000",
        address: userData?.address || "Vietnam",
      };

      if (paymentMethod === "qr") {
        // PayOS payment flow
        const { data } = await apiClient.post("/orders/checkout/payos", {
          shippingAddress,
          description: `DH PNETAI`,
        });
        if (data?.payment?.checkoutUrl) {
          window.location.href = data.payment.checkoutUrl;
        } else {
          toast.error("Không thể tạo link thanh toán.");
        }
      } else {
        // COD payment flow
        await apiClient.post("/orders/checkout", {
          shippingAddress,
          paymentMethod: "COD",
        });
        setStep("success");
        window.scrollTo(0, 0);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-16 h-16 border-4 border-sand border-t-caramel rounded-full animate-spin" />
        <p className="font-serif italic font-bold text-caramel">Preparing your Delivery Manifest...</p>
      </div>
    </div>
  );

  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#FBF9F2] pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 relative inline-block"
          >
            <div className="w-64 h-64 mx-auto rounded-full bg-caramel/5 flex items-center justify-center relative overflow-hidden">
               {/* Success Illustration (Simplified Pet Icon Container) */}
               <img 
                 src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=400&auto=format&fit=crop" 
                 className="w-48 h-48 rounded-3xl object-cover shadow-2xl rotate-3" 
                 alt="Happy Pet"
               />
               <motion.div 
                 animate={{ rotate: [0, 10, -10, 0] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="absolute bottom-4 right-4 bg-white p-3 rounded-2xl shadow-xl border border-sand"
               >
                 <PackageCheck className="w-6 h-6 text-caramel" />
               </motion.div>
            </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-serif font-bold italic text-ink mb-6"
          >
            A Parcel on its way!
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted font-serif italic mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Your curation is being carefully packed in a signature PawHaus box as we speak. 
            We'll send the tracking manifest to your email in just a moment.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <Link 
              to="/my-bookings" 
              className="bg-ink text-white px-10 py-5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-caramel transition-all shadow-xl"
            >
              Track Order History
            </Link>
            <Link 
              to="/products"
              className="text-ink px-10 py-5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] border border-sand hover:bg-white transition-all"
            >
              Continue Browsing
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F2] pt-12 pb-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-caramel transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </button>
          <div className="text-right">
            <h1 className="font-serif text-4xl md:text-5xl font-bold italic text-ink">Delivery Manifest</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dark mt-2">Personal Curation Checkout</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left Column: Logistics */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Shipping Address */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-caramel/5 rounded-full flex items-center justify-center shadow-inner">
                  <Home className="w-5 h-5 text-caramel" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold italic text-ink italic">Shipping Nest</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Where shall we send your curation?</p>
                </div>
              </div>

              <div className="bg-white border border-sand/30 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex gap-6">
                    <div className="w-14 h-14 bg-sand/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-caramel/60" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink mb-1 uppercase tracking-wider">{userData?.name || "Pet Parent"}</p>
                      <p className="text-[13px] text-muted leading-relaxed max-w-sm">
                        {userData?.address || "No nesting address set in your profile yet."}
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-caramel/5 rounded-full">
                        <span className="w-1 h-1 bg-caramel rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold uppercase text-caramel tracking-widest">Selected Nest</span>
                      </div>
                    </div>
                  </div>
                  <Link to="/profile" className="text-[10px] font-bold uppercase tracking-widest text-caramel hover:underline">Change</Link>
                </div>
              </div>
            </section>

            {/* Shipping Methods */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-caramel/5 rounded-full flex items-center justify-center shadow-inner">
                  <Truck className="w-5 h-5 text-caramel" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold italic text-ink italic">Delivery Cadence</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Select your delivery speed</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setShippingMethod("standard")}
                  className={`relative p-8 rounded-[2.5rem] border-2 text-left transition-all group ${
                    shippingMethod === "standard" 
                      ? "border-caramel bg-white shadow-xl shadow-caramel/5" 
                      : "border-sand/30 hover:border-sand"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                      shippingMethod === "standard" ? "bg-caramel text-white" : "bg-sand/20 text-muted"
                    }`}>
                      <Truck className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-ink">Free</span>
                  </div>
                  <h4 className="font-serif text-lg font-bold italic text-ink">Standard Delivery</h4>
                  <p className="text-[11px] text-muted mt-2 font-medium">3-5 business days across the territory.</p>
                  {shippingMethod === "standard" && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle2 className="w-5 h-5 text-caramel" />
                    </div>
                  )}
                </button>

                <button 
                  onClick={() => setShippingMethod("express")}
                  className={`relative p-8 rounded-[2.5rem] border-2 text-left transition-all group ${
                    shippingMethod === "express" 
                      ? "border-caramel bg-white shadow-xl shadow-caramel/5" 
                      : "border-sand/30 hover:border-sand"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                      shippingMethod === "express" ? "bg-caramel text-white" : "bg-sand/20 text-muted"
                    }`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-ink">{formatVnd(EXPRESS_SHIPPING_FEE_VND)}</span>
                  </div>
                  <h4 className="font-serif text-lg font-bold italic text-ink">Express Manifest</h4>
                  <p className="text-[11px] text-muted mt-2 font-medium">Next-day delivery with premium handling.</p>
                  {shippingMethod === "express" && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle2 className="w-5 h-5 text-caramel" />
                    </div>
                  )}
                </button>
              </div>
            </section>

            {/* Payment Methods */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-caramel/5 rounded-full flex items-center justify-center shadow-inner">
                  <CreditCard className="w-5 h-5 text-caramel" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold italic text-ink italic">Settlement Choice</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Choose your preferred payment</p>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => setPaymentMethod("cod")}
                  className={`w-full flex items-center justify-between p-8 rounded-[2.5rem] border-2 transition-all ${
                    paymentMethod === "cod" ? "border-caramel bg-white" : "border-sand/30"
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-sand/10 rounded-2xl flex items-center justify-center text-caramel">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-serif text-lg font-bold italic text-ink">Courier Collection (COD)</h4>
                      <p className="text-[11px] text-muted font-medium">Settle with the courier upon arrival. Trusted choice.</p>
                    </div>
                  </div>
                  {paymentMethod === "cod" && <CheckCircle2 className="w-5 h-5 text-caramel" />}
                </button>

                <div className="relative overflow-hidden group">
                   <button 
                    onClick={() => setPaymentMethod("qr")}
                    className={`w-full flex items-center justify-between p-8 rounded-[2.5rem] border-2 transition-all ${
                      paymentMethod === "qr" ? "border-caramel bg-white" : "border-sand/30"
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-sand/10 rounded-2xl flex items-center justify-center text-caramel">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-serif text-lg font-bold italic text-ink">Universal Wallet / QR</h4>
                        <p className="text-[11px] text-muted font-medium">Fast settlement with Glassmorphism QR display.</p>
                      </div>
                    </div>
                    {paymentMethod === "qr" && <CheckCircle2 className="w-5 h-5 text-caramel" />}
                  </button>

                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Parcel Summary (Sticky) */}
          <div className="lg:col-span-5 sticky top-12">
            <div className="bg-white border border-sand/50 rounded-[3rem] p-10 shadow-xl shadow-sand-dark/10">
              <h3 className="font-serif text-2xl font-bold italic text-ink mb-10 flex items-center justify-between">
                Parcel Summary
                <span className="text-[11px] font-bold text-muted bg-sand/20 px-3 py-1 rounded-full uppercase italic">{cartItems.length} items</span>
              </h3>

              {/* Minimalist Item List */}
              <div className="space-y-8 mb-12 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-14 h-18 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-sand/20">
                      <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-serif font-bold italic text-ink truncate mb-1">{item.name}</h4>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{item.qty} units × {formatVnd(item.price)}</p>
                    </div>
                    <span className="text-sm font-serif font-semibold text-ink italic">{formatVnd(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Voucher Section */}
              <div className="mb-12">
                <button 
                  onClick={() => setShowVoucher(!showVoucher)}
                  className="flex items-center justify-between w-full text-[10px] font-bold text-ink uppercase tracking-[0.2em] mb-4 hover:text-caramel transition-colors group"
                >
                  HAVE A VOUCHER? 
                  {showVoucher ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />}
                </button>
                
                <AnimatePresence>
                  {showVoucher && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-2 pt-2">
                        <input 
                          type="text" 
                          placeholder="PAWHAUS"
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value)}
                          className="flex-1 bg-[#FBF9F2] p-4 rounded-2xl outline-none border border-sand focus:border-caramel text-xs font-bold transition-all"
                        />
                        <button 
                          onClick={handleApplyVoucher}
                          className="bg-ink text-white px-6 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-caramel transition-all"
                        >
                          Apply
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Financials */}
              <div className="space-y-4 pt-10 border-t border-sand/30">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-serif italic text-muted">Subtotal curation</span>
                  <span className="font-bold text-ink">{formatVnd(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-serif italic text-muted">Shipping cadence</span>
                  <span className="font-bold text-ink">{formatVnd(shippingFee)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-sm text-rust">
                    <span className="font-serif italic">Atelier discount</span>
                    <motion.span 
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.1, 1] }}
                      className="font-bold"
                    >
                      -{formatVnd(discount)}
                    </motion.span>
                  </div>
                )}
                
                <div className="flex justify-between items-end pt-6 mt-6 border-t border-sand/30">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-1">Total Investment</p>
                    <p className="text-[11px] text-ink/40 italic font-serif">Includes calculated local duties</p>
                  </div>
                  <span className="text-4xl font-serif font-bold italic text-ink tracking-tighter">
                    {formatVnd(total)}
                  </span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={processing}
                className="w-full bg-ink text-white py-6 rounded-full text-[11px] font-bold uppercase tracking-[0.25em] mt-12 hover:bg-caramel transition-all duration-500 shadow-2xl relative overflow-hidden group disabled:opacity-50"
              >
                {processing ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Checking Stock...
                  </div>
                ) : (
                  <>
                    Complete Secure Settlement
                    <div className="absolute inset-0 bg-white/10 translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-700" />
                  </>
                )}
              </button>
              
              <p className="text-center text-[10px] text-muted mt-6 font-medium italic">
                Secured by Atelier Industry Certification
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
