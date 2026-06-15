import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Menu, X, User as UserIcon, LogOut, LayoutDashboard, Calendar, Settings } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Apply theme class to document body
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  // Close dropdowns on route change
  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'provider') return '/provider';
    return '/customer';
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-dark-200/50 dark:border-dark-800/50 bg-white/70 dark:bg-dark-900/70 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/20">
                S
              </span>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-dark-900 to-dark-600 dark:from-white dark:to-dark-300 bg-clip-text text-transparent">
                ServeConnect
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/services"
              className={`text-sm font-medium transition-colors hover:text-brand-500 ${
                location.pathname === '/services'
                  ? 'text-brand-500 font-semibold'
                  : 'text-dark-600 dark:text-dark-300'
              }`}
            >
              Browse Services
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-dark-500 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-dark-900 rounded-full"
                >
                  <img
                    className="h-9 w-9 rounded-full object-cover border border-brand-500/20"
                    src={user?.avatar}
                    alt={user?.name}
                  />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-dark-200/50 dark:border-dark-800/50 bg-white dark:bg-dark-800 p-2 shadow-xl ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-dark-100 dark:border-dark-700 mb-2">
                      <p className="text-sm font-semibold text-dark-900 dark:text-white truncate">{user?.name}</p>
                      <p className="text-xs text-dark-500 dark:text-dark-400 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to={getDashboardLink()}
                      className="flex items-center px-3 py-2 text-sm rounded-lg text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-750 transition-colors"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4 text-dark-500" />
                      Dashboard
                    </Link>

                    {user?.role === 'customer' && (
                      <Link
                        to="/customer/bookings"
                        className="flex items-center px-3 py-2 text-sm rounded-lg text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-750 transition-colors"
                      >
                        <Calendar className="mr-2 h-4 w-4 text-dark-500" />
                        My Bookings
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-dark-700 dark:text-dark-200 hover:text-brand-500 transition-colors px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-brand-600 to-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl hover:opacity-95 shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-dark-500 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-dark-500 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-dark-200/50 dark:border-dark-800/50 bg-white dark:bg-dark-900 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/services"
            className="block px-3 py-2 rounded-lg text-base font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-850"
          >
            Browse Services
          </Link>

          {isAuthenticated ? (
            <>
              <div className="border-t border-dark-100 dark:border-dark-800 my-2 pt-2">
                <div className="px-3 py-2 flex items-center space-x-3 mb-2">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={user?.avatar}
                    alt={user?.name}
                  />
                  <div>
                    <p className="text-sm font-semibold text-dark-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-dark-500 dark:text-dark-400 truncate">{user?.email}</p>
                  </div>
                </div>
                
                <Link
                  to={getDashboardLink()}
                  className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-850"
                >
                  <LayoutDashboard className="mr-3 h-5 w-5 text-dark-400" />
                  Dashboard
                </Link>

                {user?.role === 'customer' && (
                  <Link
                    to="/customer/bookings"
                    className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-850"
                  >
                    <Calendar className="mr-3 h-5 w-5 text-dark-400" />
                    My Bookings
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dark-100 dark:border-dark-850">
              <Link
                to="/login"
                className="flex items-center justify-center px-4 py-2 border border-dark-300 dark:border-dark-700 rounded-xl text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-850"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-500 text-white rounded-xl text-sm font-medium hover:opacity-95"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
