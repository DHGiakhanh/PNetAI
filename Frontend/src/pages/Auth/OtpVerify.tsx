import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthLayout } from "./layouts/AuthLayout";

export const OtpVerifyPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(120);
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "user@example.com";
  const from = location.state?.from || "signup";
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
    if (otp.some((v) => v === "")) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      if (from === "forgot") {
        navigate("/reset-password");
      } else {
        navigate("/login");
      }
    }, 1500);
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-brown transition-colors mb-7 font-medium border-0 bg-transparent cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Change email
        </button>

        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-brown font-semibold mb-2.5">
          <div className="w-5 h-[1px] bg-brown" />
          Identity Verification
        </div>
        <h1 className="font-serif text-[clamp(28px,3vw,40px)] font-bold tracking-tight leading-[1.1] text-gray-900 mb-2">
          Verify <em className="text-brown italic font-normal">OTP</em>
        </h1>

        <div className="inline-flex items-center gap-2 bg-warm border border-sand rounded-full px-3.5 py-1.5 text-[13px] text-brown-dark font-medium mb-6">
          <Mail className="w-4 h-4" /> {email}
        </div>
        <p className="text-sm text-gray-600 font-light mb-9 leading-relaxed">
          The 6-digit code was sent to your email. Please check your inbox and spam folder.
        </p>

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
          Code expires in <strong className="text-gray-900 font-bold">{formatTime(timer)}</strong>
          <br />
          <button
            disabled={timer > 0}
            className="mt-2 text-brown font-medium hover:underline border-0 bg-transparent cursor-pointer disabled:opacity-50 disabled:no-underline"
            onClick={() => setTimer(120)}
          >
            Resend OTP
          </button>
        </div>

        <button
          onClick={handleVerify}
          disabled={otp.some((v) => v === "") || isVerifying}
          className="w-full bg-brown hover:bg-brown-dark text-white p-4 rounded-xl font-sans text-[15px] font-medium transition-all shadow-lg shadow-brown/20 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            "Confirm →"
          )}
        </button>
      </motion.div>
    </AuthLayout>
  );
};

export default OtpVerifyPage;
