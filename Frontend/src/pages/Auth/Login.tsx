import { useState, FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.successMessage || '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
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
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-warm via-warm to-cream flex items-center justify-center px-4">
      <div className="max-w-6xl w-full bg-white/60 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left: Form */}
        <div className="w-full lg:w-1/2 px-8 sm:px-12 py-10">

          <h1 className="font-serif italic text-3xl sm:text-4xl font-bold text-ink mb-3">
            Welcome back to your pet&apos;s favorite place!{" "}
            <span className="text-brown">🐾</span>
          </h1>
          <p className="text-muted mb-8 max-w-md">
            Log in to track health, book spas, and chat with our AI Vet
            Assistant.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="alice@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-sand bg-warm/60 focus:bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-caramel/40 focus:border-caramel placeholder:text-gray-400"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-sand bg-warm/60 focus:bg-white px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-caramel/40 focus:border-caramel placeholder:text-gray-400"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-xs"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Remember / forgot */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-sand text-brown focus:ring-caramel/40"
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-brown font-medium">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brown hover:bg-brown-dark disabled:bg-sand text-white font-semibold py-3 rounded-full shadow-lg shadow-brown/20 text-sm transition"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="flex items-center gap-4 text-xs text-gray-400 my-6">
            <div className="flex-1 h-px bg-warm" />
            <span>Or continue with</span>
            <div className="flex-1 h-px bg-warm" />
          </div>

          <button className="w-full border border-sand hover:border-caramel text-gray-700 rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm font-medium bg-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                d="M21.805 10.023H12v3.955h5.608c-.242 1.273-.968 2.35-2.063 3.073v2.551h3.338c1.955-1.8 3.122-4.45 3.122-7.602 0-.66-.06-1.295-.2-1.977z"
                fill="#4285F4"
              />
              <path
                d="M12 22c2.82 0 5.188-.928 6.918-2.398l-3.338-2.551c-.928.622-2.115.992-3.58.992-2.75 0-5.077-1.856-5.91-4.353H2.646v2.632A9.999 9.999 0 0012 22z"
                fill="#34A853"
              />
              <path
                d="M6.09 13.69a5.996 5.996 0 010-3.38V7.678H2.646a9.996 9.996 0 000 8.644l3.444-2.632z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.957c1.533 0 2.908.528 3.99 1.565l2.996-2.996C17.183 2.89 14.82 2 12 2a9.999 9.999 0 00-9.354 5.678L6.09 10.31C6.923 7.813 9.25 5.957 12 5.957z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-brown font-medium">
              Create free account
            </Link>
          </p>

          <div className="mt-10 flex gap-6 text-xs text-gray-400">
            <button>Privacy Policy</button>
            <button>Terms of Service</button>
            <button>Help Center</button>
          </div>
        </div>

        {/* Right: Image / cards */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-gradient-to-br from-sand via-warm to-sage items-center justify-center relative p-10">
          <div className="absolute top-10 right-6 bg-white rounded-2xl shadow-lg px-4 py-3 text-xs text-gray-700 w-48">
            <p className="font-semibold mb-1">AI Vet Consult</p>
            <p className="text-gray-400">
              Available 24/7 – &quot;My pet seems off, what should I do?&quot;
            </p>
          </div>

          <div className="absolute bottom-12 left-4 bg-white rounded-2xl shadow-lg px-4 py-3 text-xs text-gray-700 w-52">
            <p className="font-semibold mb-1">Sarah &amp; Mochi ⭐⭐⭐⭐⭐</p>
            <p className="text-gray-400">
              &quot;The grooming booking was so easy. Highly recommend.&quot;
            </p>
          </div>

          <div className="relative w-80 h-96 rounded-[2.2rem] overflow-hidden shadow-2xl bg-sand animate-float">
            <img
              src="https://www.robins.vn/wp-content/uploads/2026/01/anh-con-cho-10.jpg.jpg"
              alt="Dogs walking"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
