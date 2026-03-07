import { Link } from "react-router-dom";

export const ForgotPassword = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-50 via-pink-50 to-cyan-50 flex items-center justify-center px-4">
      <div className="max-w-6xl w-full bg-white/60 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left: Form */}
        <div className="w-full lg:w-1/2 px-8 sm:px-12 py-10">
          {/* Logo */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-pink-500 flex items-center justify-center text-white font-bold">
                logo
              </div>
              <span className="font-semibold text-lg text-gray-800">
                PNetAI
              </span>
            </div>
            <button className="text-xs text-gray-500 flex items-center gap-1">
              English ▼
            </button>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Forgot your password? <span className="text-pink-500"></span>
          </h1>

          <p className="text-gray-500 mb-8 max-w-md">
            No worries! Enter your email and we’ll send you a link to reset your
            password.
          </p>

          {/* Form */}
          <form className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>

              <div className="relative">
                <input
                  type="email"
                  placeholder="alice@example.com"
                  className="w-full rounded-xl border border-pink-100 bg-pink-50/60 focus:bg-white px-4 py-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 placeholder:text-gray-400"
                />

                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  ✉
                </span>
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-full shadow-lg shadow-pink-200 text-sm"
            >
              Send Reset Link
            </button>
          </form>

          {/* Back to login */}
          <p className="mt-6 text-sm text-gray-500">
            Remember your password?{" "}
            <Link to="/login" className="text-pink-500 font-medium">
              Back to Login
            </Link>
          </p>

          {/* Footer */}
          <div className="mt-10 flex gap-6 text-xs text-gray-400">
            <button>Privacy Policy</button>
            <button>Terms of Service</button>
            <button>Help Center</button>
          </div>
        </div>

        {/* Right: Image */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-gradient-to-br from-pink-200 via-pink-100 to-cyan-100 items-center justify-center relative p-10">
          
          <div className="absolute top-10 right-6 bg-white rounded-2xl shadow-lg px-4 py-3 text-xs text-gray-700 w-48">
            <p className="font-semibold mb-1">Password Recovery</p>
            <p className="text-gray-400">
              Secure reset links sent directly to your email.
            </p>
          </div>

          <div className="absolute bottom-12 left-4 bg-white rounded-2xl shadow-lg px-4 py-3 text-xs text-gray-700 w-52">
            <p className="font-semibold mb-1">Safe & Fast</p>
            <p className="text-gray-400">
              Get back to tracking your pet’s health in seconds.
            </p>
          </div>

          <div className="relative w-80 h-96 rounded-[2.2rem] overflow-hidden shadow-2xl bg-blue-200 -rotate-3">
            <img
              src="https://www.robins.vn/wp-content/uploads/2026/01/anh-con-cho-10.jpg.jpg"
              alt="Dog"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};