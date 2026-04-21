import { useEffect, useState } from "react";
import { 
  Zap, 
  Award, 
  Crown, 
  CheckCircle2, 
  ArrowRight, 
  CreditCard, 
  QrCode,
  ChevronRight,
  TrendingUp,
  X,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authService, UserProfile } from "@/services/auth.service";
import { formatVnd } from "@/utils/currency";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    type: 'Tier',
    price: 0,
    credits: '5 Articles/mo',
    features: ['Basic Profile', 'Service Registration', 'Community Access', 'Community Posts'],
    color: 'bg-warm text-muted',
    accent: 'bg-sand',
    icon: Zap
  },
  {
    id: 'silver',
    name: 'Silver',
    type: 'Tier',
    price: 50000,
    credits: '25 Articles/mo',
    features: ['Silver Profile Badge', 'Priority Service Listing', 'Basic Analytics', 'Advanced Scheduling', 'Zalo Reminders'],
    color: 'bg-slate-50 text-slate-800',
    accent: 'bg-slate-200',
    recommended: false,
    icon: Award
  },
  {
    id: 'gold',
    name: 'Gold',
    type: 'Tier',
    price: 100000,
    credits: 'Unlimited',
    features: ['Gold Profile Badge', 'Top-of-Search Placement', 'Full Strategic Insights', 'Custom Domain Support', '24/7 Priority Support', 'Dedicated Account Manager'],
    color: 'bg-amber-50 text-amber-800',
    accent: 'bg-amber-400',
    recommended: true,
    icon: Crown
  }
];

export const Subscription = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await authService.getCurrentUser();
        setUser(data);
      } catch (error) {
        console.error("Failed to fetch user subscription info");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const selectedPlan = PLANS.find(p => p.id === showCheckout);
  const currentPlan = PLANS.find(p => p.id === (user?.subscriptionPlan || 'free'));

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
       <Loader2 className="w-10 h-10 animate-spin text-caramel" />
    </div>
  );

  const handlePayOSCheckout = async () => {
    if (!showCheckout) return;
    setIsProcessing(true);
    try {
      const { data } = await apiClient.post("/subscriptions/checkout/payos", {
        planId: showCheckout
      });
      if (data?.payment?.checkoutUrl) {
         window.location.href = data.payment.checkoutUrl;
      } else {
         toast.error("Failed to generate payment link.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Payment initiation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Current Status Bar */}
      <section className="bg-ink text-white rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
         <div className="absolute top-0 right-0 w-96 h-96 bg-caramel/10 rounded-full blur-[100px] -translate-y-48 translate-x-48" />
         
         <div className="relative z-10 flex items-center gap-8">
            <div className={`h-24 w-24 rounded-[2.5rem] flex items-center justify-center shadow-xl ${
              currentPlan?.id === 'gold' ? 'bg-caramel' : currentPlan?.id === 'silver' ? 'bg-slate-400' : 'bg-sand'
            }`}>
               {currentPlan?.icon ? <currentPlan.icon className="w-12 h-12 text-white" /> : <Zap className="w-12 h-12 text-white" />}
            </div>
            <div>
               <div className="flex items-center gap-3 text-caramel mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Current Atelier Tier</span>
                  <div className="h-px w-8 bg-caramel" />
               </div>
               <h2 className="text-4xl font-serif font-bold italic">{currentPlan?.name} {currentPlan?.type} Package</h2>
               <p className="text-sm font-medium text-white/40 mt-1 flex items-center gap-2">
                  Atelier status: <span className="text-white uppercase font-black tracking-widest">{user?.subscriptionPlan || 'Free'}</span>
               </p>
            </div>
         </div>

         <div className="relative z-10 flex items-center gap-10">
            <div className="text-right">
               <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Available Credits</p>
               <p className="text-3xl font-serif font-bold italic text-white flex items-center justify-end gap-3">
                  {user?.articleCredits} <span className="text-xs font-serif font-medium text-caramel">Tokens</span>
               </p>
            </div>
            <button className="h-16 w-16 rounded-full bg-white/10 hover:bg-caramel hover:scale-110 transition-all flex items-center justify-center text-white border border-white/10">
               <TrendingUp className="w-6 h-6" />
            </button>
         </div>
      </section>

      {/* Upgrade Call-to-Action */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
         <h3 className="text-3xl font-serif font-bold italic text-ink">Elevate Your Practice</h3>
         <p className="text-[13px] font-medium text-muted leading-relaxed">Choose the tier that reflects your studio's ambition. Unlock diagnostic tools, priority visibility, and unlimited storytelling.</p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {PLANS.map((plan, idx) => {
           const Icon = plan.icon;
           const isCurrent = plan.id === (user?.subscriptionPlan || 'free');
           return (
             <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.1 }}
               key={plan.id}
               className={`relative bg-white rounded-[3.5rem] p-10 border border-sand shadow-sm hover:shadow-2xl transition-all flex flex-col ${plan.recommended ? 'ring-2 ring-caramel shadow-caramel/5 scale-105 z-10' : ''}`}
             >
                {plan.recommended && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-caramel text-white px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">
                    Recommended Choice
                  </div>
                )}

                <div className="mb-10 flex items-start justify-between">
                   <div>
                      <h4 className="text-2xl font-serif font-bold italic text-ink">{plan.name}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-1">{plan.type} Tier</p>
                   </div>
                   <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${plan.color}`}>
                      <Icon className="w-6 h-6" />
                   </div>
                </div>

                <div className="mb-10">
                   <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-serif font-bold italic text-ink">{formatVnd(plan.price)}</span>
                      {plan.price > 0 && <span className="text-[11px] font-bold text-muted uppercase tracking-widest">/ Month</span>}
                   </div>
                   <p className="text-[11px] font-bold text-caramel mt-2">{plan.credits}</p>
                </div>

                <div className="flex-1 space-y-4 mb-12">
                   {plan.features.map(f => (
                     <div key={f} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-caramel mt-0.5 shrink-0" />
                        <span className="text-[13px] font-medium text-muted/80">{f}</span>
                     </div>
                   ))}
                </div>

                <button 
                  onClick={() => !isCurrent && setShowCheckout(plan.id)}
                  disabled={isCurrent}
                  className={`w-full py-5 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
                    isCurrent ? 'bg-emerald-50 text-emerald-600' :
                    plan.recommended ? 'bg-ink text-white hover:bg-caramel shadow-xl shadow-ink/10' : 'bg-warm text-ink hover:bg-sand/30'
                  }`}
                >
                   {isCurrent ? 'Current Plan' : `Subscribe ${plan.name}`} {!isCurrent && <ArrowRight className="w-4 h-4" />}
                </button>
             </motion.div>
           )
         })}
      </div>



      {/* Checkout Modal (Simulated PayOS integration) */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCheckout(null)}
              className="absolute inset-0 bg-ink/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[4rem] p-12 shadow-2xl overflow-hidden border border-sand/50"
            >
               <button onClick={() => setShowCheckout(null)} className="absolute top-10 right-10 p-3 hover:bg-rose-50 text-muted hover:text-rose-600 rounded-full transition-all group/close">
                  <X className="w-5 h-5 group-hover/close:rotate-90 transition-transform" />
               </button>
               
               <div className="flex flex-col items-center text-center mb-12">
                  <div className="h-16 w-16 rounded-[1.5rem] bg-caramel/10 flex items-center justify-center text-caramel mb-6">
                     <CreditCard className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-serif font-bold italic text-ink mb-2">Authorize Registry Upgrade</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted/60 italic">Securing {selectedPlan?.name} protocol for your atelier</p>
               </div>

               <div className="bg-warm/30 rounded-[2.5rem] p-10 mb-10 space-y-6 border border-sand/20 shadow-inner">
                  <div className="flex justify-between items-center">
                     <p className="text-[11px] font-black uppercase tracking-widest text-muted">{selectedPlan?.name} Tier Licensing</p>
                     <p className="text-lg font-bold text-ink italic">{formatVnd(selectedPlan?.price || 0)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                     <p className="text-[11px] font-black uppercase tracking-widest text-muted">Processing Protocol</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Encrypted / Free</p>
                  </div>
                  <div className="h-px bg-sand/30" />
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-ink">Total Valuation</span>
                     <span className="text-3xl font-serif font-bold italic text-caramel">{formatVnd(selectedPlan?.price || 0)}</span>
                  </div>
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted text-center mb-6">Settlement Method</p>
                  <button 
                     disabled={isProcessing}
                     onClick={handlePayOSCheckout} 
                     className="w-full py-5 rounded-2xl border-2 border-caramel bg-caramel/5 flex items-center justify-between px-8 group disabled:opacity-50"
                  >
                     <div className="flex items-center gap-4 text-left">
                        {isProcessing ? <Loader2 className="w-6 h-6 text-caramel animate-spin" /> : <QrCode className="w-6 h-6 text-caramel" />}
                        <div>
                           <p className="text-sm font-bold text-ink">PayOS Smart QR</p>
                           <p className="text-[10px] font-medium text-muted">Instant Vietnamese Bank Transfer</p>
                        </div>
                     </div>
                     <ChevronRight className="w-4 h-4 text-caramel" />
                  </button>
                  <button className="w-full py-5 rounded-2xl border border-sand hover:bg-warm transition flex items-center justify-between px-8">
                     <div className="flex items-center gap-4 text-left">
                        <CreditCard className="w-6 h-6 text-muted" />
                        <div>
                           <p className="text-sm font-bold text-ink">International Card</p>
                           <p className="text-[10px] font-medium text-muted">Visa, Mastercard, AMEX</p>
                        </div>
                     </div>
                     <ChevronRight className="w-4 h-4 text-sand" />
                  </button>
               </div>

               <p className="mt-10 text-[9px] font-medium text-muted/60 text-center uppercase tracking-widest italic">
                  Registry will update automatically upon confirmation.
               </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
