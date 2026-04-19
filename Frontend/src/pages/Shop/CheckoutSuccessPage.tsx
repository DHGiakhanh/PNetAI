import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, PackageCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen bg-[#FBF9F2] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 relative inline-block"
        >
          <div className="w-48 h-48 mx-auto rounded-full bg-emerald-50 flex items-center justify-center relative overflow-hidden shadow-inner">
            <CheckCircle2 className="w-20 h-20 text-emerald-500" />
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute bottom-2 right-2 bg-white p-3 rounded-2xl shadow-xl border border-sand"
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
          Thanh toán thành công!
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted font-serif italic mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Đơn hàng của bạn đã được xác nhận và thanh toán thành công.
          Chúng tôi sẽ gửi thông tin vận chuyển đến email của bạn trong ít phút.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row items-center justify-center gap-4"
        >
          <Link 
            to="/purchased-products" 
            className="bg-ink text-white px-10 py-5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-caramel transition-all shadow-xl flex items-center gap-3"
          >
            Xem đơn hàng <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            to="/products"
            className="text-ink px-10 py-5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] border border-sand hover:bg-white transition-all"
          >
            Tiếp tục mua sắm
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
