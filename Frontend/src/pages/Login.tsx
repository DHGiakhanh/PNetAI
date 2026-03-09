import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { authService } from '../services/auth.service';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gradient-to-r from-pink-50 via-pink-50 to-cyan-50 flex items-center justify-center px-4">
      <div className="max-w-6xl w-full bg-white/60 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left: Form */}
        <div className="w-full lg:w-1/2 px-8 sm:px-12 py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-pink-500 flex items-center justify-center text-white font-bold">
                PE
              </div>
              <span className="font-semibold text-lg text-gray-800">
                PetEcho
              </span>
            </div>
            <button className="text-xs text-gray-500 flex items-center gap-1">
              English ▼
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Welcome back to your pet&apos;s favorite place!{" "}
            <span className="text-pink-500">🐾</span>
          </h1>
          <p className="text-gray-500 mb-8 max-w-md">
            Log in to track health, book spas, and chat with our AI Vet
            Assistant.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Social buttons */}
          <div className="flex gap-3 mb-6">
            <button className="flex-1 border border-pink-100 hover:border-pink-300 text-gray-700 rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm font-medium bg-white">
              <span className="w-5 h-5 rounded-full border" />
              Continue with Google
            </button>
            <button className="flex-1 border border-pink-100 hover:border-pink-300 text-gray-700 rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm font-medium bg-white">
              <span className="w-5 h-5 rounded-full border" />
              Continue with Facebook
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
            <div className="flex-1 h-px bg-pink-100" />
            <span>Or continue with email</span>
            <div className="flex-1 h-px bg-pink-100" />
          </div>

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
                  className="w-full rounded-xl border border-pink-100 bg-pink-50/60 focus:bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 placeholder:text-gray-400"
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
                  className="w-full rounded-xl border border-pink-100 bg-pink-50/60 focus:bg-white px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 placeholder:text-gray-400"
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
                  className="rounded border-pink-200 text-pink-500 focus:ring-pink-300"
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-pink-500 font-medium">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-semibold py-3 rounded-full shadow-lg shadow-pink-200 text-sm transition"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-pink-500 font-medium">
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
        <div className="hidden lg:flex w-full lg:w-1/2 bg-gradient-to-br from-pink-200 via-pink-100 to-cyan-100 items-center justify-center relative p-10">
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

          <div className="relative w-80 h-96 rounded-[2.2rem] overflow-hidden shadow-2xl bg-blue-200 animate-float">
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
