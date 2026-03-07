import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { authService } from '../services/auth.service';

export const Register = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-50 via-pink-50 to-cyan-50 flex items-center justify-center px-4">
      <div className="max-w-6xl w-full bg-white/60 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left: Form */}
        <div className="w-full lg:w-1/2 px-8 sm:px-12 py-10">
          <button className="text-sm text-gray-500 mb-8 hover:text-gray-700">
            ← Back to Home
          </button>

          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-pink-500 flex items-center justify-center text-white font-bold">
              PE
            </div>
            <span className="font-semibold text-lg text-gray-800">PetEcho</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Create your account <span className="text-pink-500">🐾</span>
          </h1>
          <p className="text-gray-500 mb-8 max-w-md">
            Join our community to track health, book spas, and chat with our AI
            Vet Assistant.
          </p>

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
            <span>Or register with email</span>
            <div className="flex-1 h-px bg-pink-100" />
          </div>

          <form className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Sarah Connor"
                  className="w-full rounded-xl border border-pink-100 bg-pink-50/60 focus:bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Email / Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email or Phone Number
              </label>
              <input
                type="text"
                placeholder="hello@petecho.com"
                className="w-full rounded-xl border border-pink-100 bg-pink-50/60 focus:bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 placeholder:text-gray-400"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Create a strong password"
                  className="w-full rounded-xl border border-pink-100 bg-pink-50/60 focus:bg-white px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-xs"
                >
                  👁
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Password must be at least 8 characters.
              </p>
            </div>

            {/* Sale Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sale Code (Optional)
              </label>
              <input
                type="text"
                placeholder="Enter referral code"
                className="w-full rounded-xl border border-pink-100 bg-pink-50/60 focus:bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 placeholder:text-gray-400"
              />
            </div>

            <p className="text-xs text-gray-400">
              By clicking Register, you agree to our{" "}
              <span className="text-pink-500 cursor-pointer">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="text-pink-500 cursor-pointer">Privacy Policy</span>.
            </p>

            <button
              type="submit"
              className="w-full mt-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-full shadow-lg shadow-pink-200 text-sm"
            >
              Register Account
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
          <div className="absolute top-10 right-10 bg-white rounded-2xl shadow-lg px-4 py-3 text-xs text-gray-700 w-44">
            <p className="font-semibold mb-1">10k+ Pet Parents</p>
            <p className="text-gray-400">Growing community.</p>
          </div>

          <div className="absolute bottom-10 left-6 bg-white rounded-2xl shadow-lg px-4 py-3 text-xs text-gray-700 w-52">
            <p className="font-semibold mb-1">Welcome Bonus 🎁</p>
            <p className="text-gray-400">
              Get 20% off your first grooming or vet booking when you sign up.
            </p>
          </div>

          <div className="relative w-72 h-96 rounded-[2.2rem] overflow-hidden shadow-2xl bg-blue-200 animate-float">
            <img
              src="https://www.robins.vn/wp-content/uploads/2026/01/anh-con-cho-10.jpg.jpg"
              alt="Cute dog"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};