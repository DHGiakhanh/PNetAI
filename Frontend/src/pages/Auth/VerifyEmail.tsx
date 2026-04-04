import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { authService } from "@/services/auth.service";

const VerifyEmailPage = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setSuccess(false);
        setMessage("Verification token is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await authService.verifyEmail(token);
        setSuccess(true);
        setMessage(response?.message || "Email verified successfully. You can now login.");
      } catch (error: any) {
        setSuccess(false);
        setMessage(error?.response?.data?.message || "Invalid or expired verification link.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-warm via-warm to-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-sand text-center">
        {loading ? (
          <div className="space-y-4">
            <Loader2 className="w-14 h-14 text-brown mx-auto animate-spin" />
            <h1 className="font-serif italic text-2xl font-bold text-ink">Verifying Email</h1>
            <p className="text-muted">{message}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {success ? (
              <CheckCircle className="w-14 h-14 text-green-600 mx-auto" />
            ) : (
              <XCircle className="w-14 h-14 text-red-500 mx-auto" />
            )}
            <h1 className="font-serif italic text-2xl font-bold text-ink">
              {success ? "Email Verified" : "Verification Failed"}
            </h1>
            <p className="text-muted">{message}</p>
            <div className="pt-2">
              {success ? (
                <Link
                  to="/login"
                  className="inline-block bg-brown hover:bg-brown-dark text-white font-semibold py-2.5 px-6 rounded-full text-sm transition"
                >
                  Go to Login
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-block bg-brown hover:bg-brown-dark text-white font-semibold py-2.5 px-6 rounded-full text-sm transition"
                >
                  Back to Register
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
