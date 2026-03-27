import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "./layouts/AuthLayout";

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export const ResetPasswordPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormValues) => {
    console.log("Resetting for:", data);
    setTimeout(() => {
      setSuccess(true);
    }, 1500);
  };

  if (success) {
    return (
      <AuthLayout>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-forest/10 text-forest rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.12em] text-caramel font-semibold mb-2.5">
            <div className="w-5 h-[1px] bg-caramel" />
            Complete
          </div>
          <h1 className="font-serif text-[clamp(28px,3vw,40px)] font-bold tracking-tight leading-[1.1] text-ink mb-2">
            Success<em className="text-caramel italic font-normal">ful!</em>
          </h1>
          <p className="text-sm text-muted font-light mb-9 max-w-[280px] mx-auto leading-relaxed">
            Your password has been reset. You can now log in to PawHaus with your new credentials.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-brown hover:bg-ink text-white p-4 rounded-xl font-sans text-sm font-bold shadow-lg shadow-brown/15 transition-all max-w-[300px]"
          >
            Log In Now →
          </button>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={() => navigate("/otp-verify")}
          className="flex items-center gap-1.5 text-[13px] text-muted hover:text-brown transition-colors mb-7 font-medium border-0 bg-transparent cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>

        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-caramel font-semibold mb-2.5">
          <div className="w-5 h-[1px] bg-caramel" />
          Final Step
        </div>
        <h1 className="font-serif text-[clamp(28px,3vw,40px)] font-bold tracking-tight leading-[1.1] text-ink mb-2">
          New <em className="text-caramel italic font-normal">password</em>
        </h1>
        <p className="text-sm text-muted font-light mb-9 leading-relaxed">
          Create a strong password - mix uppercase, numbers, and symbols.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink uppercase tracking-widest leading-none block">
              New password
            </label>
            <div className="relative group">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full p-3.5 border-[1.5px] rounded-2xl bg-white focus:outline-none transition-all font-sans text-sm shadow-sm ${
                  errors.password
                    ? "border-red-500"
                    : "border-sand focus:border-caramel focus:ring-4 focus:ring-caramel/5"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-brown transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-[11px] text-red-500 font-medium">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-ink uppercase tracking-widest leading-none block">
              Confirm new password
            </label>
            <div className="relative">
              <input
                {...register("confirmPassword")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full p-3.5 border-[1.5px] rounded-2xl bg-white focus:outline-none transition-all font-sans text-sm shadow-sm ${
                  errors.confirmPassword ? "border-red-500" : "border-sand"
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-red-500 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-forest hover:bg-[#2A3F2B] text-white p-4 rounded-xl font-sans text-[15px] font-medium transition-all shadow-lg shadow-forest/15 disabled:opacity-70 mt-4 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "Reset Password ✓"
            )}
          </button>
        </form>
      </motion.div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
