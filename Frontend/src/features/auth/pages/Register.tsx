import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, Check } from 'lucide-react';
import { authService } from '../services/auth.service';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    saleCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        saleCode: formData.saleCode || undefined
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-pink-50 via-pink-50 to-cyan-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-pink-100 text-center">
          <div className="mb-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-4">Your account has been created successfully.</p>
          {formData.saleCode && (
            <p className="text-sm text-pink-500 mb-2 flex items-center justify-center gap-1">
              <Check className="w-4 h-4" /> Sale code applied: {formData.saleCode}
            </p>
          )}
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-50 via-pink-50 to-cyan-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-6xl w-full bg-white/60 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left: Form */}
        <div className="w-full lg:w-1/2 px-8 sm:px-12 py-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-pink-500 flex items-center justify-center text-white font-bold">
              PE
            </div>
            <span className="font-semibold text-lg text-gray-800">PetEcho</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Create your account
          </h1>
          <p className="text-gray-500 mb-8 max-w-md">
            Join our community to track health, book spas, and chat with our AI Vet Assistant.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Sarah Connor"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-pink-100 bg-pink-50/60 focus:bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 placeholder:text-gray-400"
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="hello@petecho.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-pink-100 bg-pink-50/60 focus:bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 placeholder:text-gray-400"
                required
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-pink-100 bg-pink-50/60 focus:bg-white px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 placeholder:text-gray-400"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Password must be at least 6 characters.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-pink-100 bg-pink-50/60 focus:bg-white px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 placeholder:text-gray-400"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sale Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sale Code <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                name="saleCode"
                placeholder="Enter referral code"
                value={formData.saleCode}
                onChange={handleChange}
                className="w-full rounded-xl border border-pink-100 bg-pink-50/60 focus:bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 placeholder:text-gray-400"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-400">
                If you have a sale representative code, enter it here
              </p>
            </div>

            <p className="text-xs text-gray-400">
              By clicking Register, you agree to our{" "}
              <span className="text-pink-500 cursor-pointer">Terms of Service</span>{" "}
              and{" "}
              <span className="text-pink-500 cursor-pointer">Privacy Policy</span>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-semibold py-3 rounded-full shadow-lg shadow-pink-200 text-sm transition"
            >
              {loading ? 'Creating account...' : 'Register Account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-pink-500 font-medium">
              Log In
            </Link>
          </p>

          <div className="mt-10 flex gap-6 text-xs text-gray-400">
            <button>Help Center</button>
            <button>Contact Support</button>
          </div>
        </div>

        {/* Right: Image / card */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-gradient-to-br from-pink-200 via-pink-100 to-cyan-100 items-center justify-center relative p-10">
          <div className="absolute top-10 right-10 bg-white rounded-2xl shadow-lg px-4 py-3 text-xs text-gray-700 w-44 animate-float">
            <p className="font-semibold mb-1">10k+ Pet Parents</p>
            <p className="text-gray-400">Growing community.</p>
          </div>

          <div className="absolute bottom-5 left-6 bg-white rounded-2xl shadow-lg px-4 py-3 text-xs text-gray-700 w-52 animate-float">
            <p className="font-semibold mb-1">Welcome Bonus</p>
            <p className="text-gray-400">
              Get 20% off your first grooming or vet booking when you sign up.
            </p>
          </div>

          <div className="relative w-96 h-[520px] rounded-[2.2rem] overflow-hidden shadow-2xl bg-blue-200 rotate-3">
            <img
              src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Cute dog"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
