import { Link } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export const CheckoutCancel = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[3rem] p-12 text-center max-w-lg w-full shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full blur-[80px] -translate-y-32 translate-x-32" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-8 shadow-inner">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          
          <h2 className="text-3xl font-serif font-bold italic text-ink mb-4">
            Payment Cancelled
          </h2>
          <p className="text-sm font-medium text-muted mb-10 leading-relaxed">
            Your Artisan Subscription payment was cancelled or failed to process. No charges were made to your account.
          </p>

          <Link
            to="/service-provider/subscription"
            className="w-full py-4 rounded-2xl bg-warm text-ink font-bold text-xs uppercase tracking-widest hover:bg-sand transition-all flex items-center justify-center gap-3 shadow-sm border border-sand"
          >
            <ArrowLeft className="w-4 h-4" /> Try Again
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
