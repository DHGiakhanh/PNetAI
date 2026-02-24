import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-white">🛍️ E-Shop</h1>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/products" className="text-gray-300 hover:text-white transition-colors">
              Products
            </Link>
            <Link to="/blogs" className="text-gray-300 hover:text-white transition-colors">
              Blog
            </Link>
            
            {isLoggedIn ? (
              <>
                <Link to="/cart" className="text-gray-300 hover:text-white transition-colors">
                  🛒 Cart
                </Link>
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">Hi, {user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
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
