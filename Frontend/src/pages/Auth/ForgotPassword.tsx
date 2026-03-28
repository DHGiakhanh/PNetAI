import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "./layouts/AuthLayout";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormValues) => {
    console.log("Forgot password for:", data);
    navigate("/otp-verify", { state: { email: data.email, from: "forgot" } });
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-brown transition-colors mb-7 font-medium border-0 bg-transparent cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Log In
        </button>

        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-brown font-semibold mb-2.5">
          <div className="w-5 h-[1px] bg-brown" />
          Recovery Link
        </div>
        <h1 className="font-serif text-[clamp(28px,3vw,40px)] font-bold tracking-tight leading-[1.1] text-gray-900 mb-2">
          Forgot <em className="text-brown italic font-normal">password?</em>
        </h1>
        <p className="text-sm text-gray-600 font-light mb-9 leading-relaxed">
          Don&apos;t worry! Enter your registered email. We&apos;ll send an OTP to verify your identity.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-800 uppercase tracking-widest leading-none block">
              Registered Email
            </label>
            <div className="relative group">
              <input
                {...register("email")}
                type="email"
                placeholder="you@email.com"
                className={`w-full p-3.5 border-[1.5px] rounded-2xl bg-white focus:outline-none transition-all font-sans text-sm shadow-sm ${
                  errors.email
                    ? "border-red-500"
                    : "border-sand focus:border-caramel focus:ring-4 focus:ring-sand"
                }`}
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brown transition-colors" />
            </div>
            {errors.email && <p className="text-[11px] text-red-500 font-medium">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brown hover:bg-brown-dark text-white p-4 rounded-xl font-sans text-[15px] font-medium transition-all shadow-lg shadow-brown/20 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "Send OTP →"
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          <Link to="/login" className="text-[13px] font-medium text-gray-500 hover:text-brown transition-colors">
            Cancel
          </Link>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export const ForgotPassword = ForgotPasswordPage;

export default ForgotPasswordPage;
