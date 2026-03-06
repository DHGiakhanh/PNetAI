import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    navigate("/");
  };

  return (
    <header className="w-full bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-pink-500"
          >
            🐾 PNetAI
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6 text-sm font-medium">

            <Link
              to="/"
              className="text-gray-600 hover:text-pink-500 transition"
            >
              Home
            </Link>

            <Link
              to="/products"
              className="text-gray-600 hover:text-pink-500 transition"
            >
              Shop
            </Link>

            <Link
              to="/blogs"
              className="text-gray-600 hover:text-pink-500 transition"
            >
              Community
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  to="/cart"
                  className="text-gray-600 hover:text-pink-500 transition"
                >
                  🛒 Cart
                </Link>

                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-pink-500 transition"
                >
                  Dashboard
                </Link>

                <span className="text-gray-500 text-sm">
                  Hi, {user?.name}
                </span>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-pink-500 transition"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};