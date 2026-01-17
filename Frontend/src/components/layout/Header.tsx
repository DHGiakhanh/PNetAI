import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <header className="bg-gray-900 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/">
            <h1 className="text-2xl font-bold text-white">My App</h1>
          </Link>
          <nav className="flex gap-6">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
              Login
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
