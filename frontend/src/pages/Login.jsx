import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect to dashboard or previous location
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please enter both email and password.');
    }
    
    try {
      setError('');
      setLoading(true);
      const user = await login(email, password);
      
      // Determine redirection by user role
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'provider') navigate('/provider');
      else navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-stretch bg-dark-50 dark:bg-dark-900 transition-colors duration-300">
      {/* Left Pane - Brand Pitch (Visible on Desktop) */}
      <div className="hidden lg:flex w-1/2 relative bg-dark-900 overflow-hidden items-center justify-center p-12">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/80 to-transparent" />
        
        {/* Glow Spots */}
        <div className="glow-spot top-1/4 left-1/4" />
        <div className="glow-spot bottom-1/4 right-1/4" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)' }} />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-lg text-white space-y-6"
        >
          <span className="px-3 py-1 text-xs font-semibold tracking-wider text-brand-300 uppercase bg-brand-500/10 border border-brand-500/30 rounded-full">
            Premium Marketplace
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-sans leading-tight">
            Connecting You with Verified Service Pros.
          </h1>
          <p className="text-lg text-dark-300 leading-relaxed font-light">
            Book professional plumbers, electricians, cleaners, and beauticians at the tap of a button. Transparency, quality, and luxury at your doorstep.
          </p>
          <div className="flex items-center space-x-6 pt-4">
            <div>
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-sm text-dark-400">Verified Pros</p>
            </div>
            <div className="h-8 w-px bg-dark-700" />
            <div>
              <p className="text-2xl font-bold text-white">4.8★</p>
              <p className="text-sm text-dark-400">Average Rating</p>
            </div>
            <div className="h-8 w-px bg-dark-700" />
            <div>
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="text-sm text-dark-400">Quick Booking</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-dark-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="text-sm text-dark-500 dark:text-dark-400">
              New to ServeConnect?{' '}
              <Link to="/signup" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                Create an account
              </Link>
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400"
            >
              <AlertCircle size={20} className="flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-dark-700 dark:text-dark-350">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-400 dark:text-dark-500">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-dark-200 dark:border-dark-800 rounded-xl bg-white dark:bg-dark-850 text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-dark-700 dark:text-dark-350">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-400 dark:text-dark-500">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-dark-200 dark:border-dark-800 rounded-xl bg-white dark:bg-dark-850 text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-500/10 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-500 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-dark-900 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
