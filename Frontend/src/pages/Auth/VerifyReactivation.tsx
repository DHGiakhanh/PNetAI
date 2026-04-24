import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Mail } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthLayout } from "./layouts/AuthLayout";
import { authService } from "@/services/auth.service";

export const VerifyReactivation = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(600);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const notice = location.state?.message || "Long time no see! Your account was inactive. Please verify it's you.";
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleVerify = async () => {
    if (!email) {
      setError("Session expired. Please try logging in again.");
      return;
    }

    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const response = await authService.verifyReactivation({ email, otp: code });
      
      // Store token and user as usual
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Redirect based on role
      if (response.user.role === 'admin') {
        navigate('/admin');
      } else if (response.user.role === 'service_provider' || response.user.role === 'shop') {
        navigate('/service-provider');
      } else if (response.user.role === 'sale') {
        navigate('/sale/providers');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Verification failed. Please check the code and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-brown transition-colors mb-7 font-medium border-0 bg-transparent cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-brown font-semibold mb-2.5">
          <ShieldCheck className="w-4 h-4" />
          Security Restoration
        </div>
        <h1 className="font-serif text-[clamp(28px,3vw,40px)] font-bold tracking-tight leading-[1.1] text-gray-900 mb-6">
          Welcome <em className="text-brown italic font-normal">Back</em>
        </h1>

        <div className="p-5 bg-warm border border-sand rounded-2xl mb-8">
           <p className="text-[13px] text-brown-dark font-medium leading-relaxed">
             {notice}
           </p>
           <div className="mt-3 flex items-center gap-2 text-[12px] text-muted font-bold uppercase tracking-wider">
              <Mail className="w-3.5 h-3.5" /> {email}
           </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 text-center font-medium">
            {error}
          </div>
        )}

        <div className="flex gap-2.5 justify-center mb-8">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center font-serif text-2xl font-bold bg-white border-[1.5px] border-sand rounded-2xl focus:outline-none focus:border-caramel focus:bg-warm transition-all outline-none"
            />
          ))}
        </div>

        <div className="text-center text-[13px] text-gray-500 mb-8">
          This secure window expires in <strong className="text-gray-900 font-bold">{formatTime(timer)}</strong>
        </div>

        <button
          onClick={handleVerify}
          disabled={otp.some((v) => v === "") || isVerifying}
          className="w-full bg-ink hover:bg-brown-dark text-white p-4 rounded-xl font-sans text-[15px] font-bold transition-all shadow-lg shadow-ink/20 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            "Reactivate Account →"
          )}
        </button>

        <p className="mt-10 text-[11px] text-muted text-center leading-relaxed">
          For your security, accounts inactive for more than 6 months are temporarily locked. Verification ensures it&apos;s really you.
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default VerifyReactivation;
