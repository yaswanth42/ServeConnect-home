import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Briefcase, Award, AlignLeft, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const FALLBACK_CATEGORIES = [
  { _id: '1', name: 'Electrician' },
  { _id: '2', name: 'Plumber' },
  { _id: '3', name: 'Carpenter' },
  { _id: '4', name: 'AC Repair' },
  { _id: '5', name: 'Cleaning' },
  { _id: '6', name: 'Salon & Beautician at Home' }
];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // customer or provider
  
  // Provider states
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  
  // UI states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch categories for provider dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/auth/categories');
        if (response.data && response.data.data.categories) {
          setCategories(response.data.data.categories);
          if (response.data.data.categories.length > 0) {
            setCategory(response.data.data.categories[0]._id);
          }
        }
      } catch (err) {
        console.warn('Could not fetch categories from server, using fallbacks');
        setCategories(FALLBACK_CATEGORIES);
        setCategory(FALLBACK_CATEGORIES[0]._id);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return setError('Please fill in all basic fields.');
    }
    if (password.length < 8) {
      return setError('Password must be at least 8 characters long.');
    }

    const signupData = {
      name,
      email,
      password,
      role
    };

    if (role === 'provider') {
      if (!category || !experience) {
        return setError('Providers must choose a Category and Experience.');
      }
      signupData.category = category;
      signupData.experience = Number(experience);
      signupData.bio = bio;
    }

    try {
      setError('');
      setLoading(true);
      const user = await signup(signupData);
      
      if (user.role === 'provider') {
        navigate('/provider');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
        
        <div className="glow-spot top-1/4 left-1/4" />
        <div className="glow-spot bottom-1/4 right-1/4" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)' }} />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-lg text-white space-y-6"
        >
          <span className="px-3 py-1 text-xs font-semibold tracking-wider text-brand-300 uppercase bg-brand-500/10 border border-brand-500/30 rounded-full">
            Grow with Us
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-sans leading-tight">
            Join the ServeConnect Community
          </h1>
          <p className="text-lg text-dark-300 leading-relaxed font-light">
            Register as a Customer to book premium home care, or register as a Provider to accept local jobs, configure working hours, and grow your earnings.
          </p>
        </motion.div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:px-16 lg:py-8 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold tracking-tight text-dark-900 dark:text-white">
              Create an Account
            </h2>
            <p className="text-sm text-dark-550 dark:text-dark-400">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                Sign in instead
              </Link>
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400"
            >
              <AlertCircle size={20} className="flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-dark-500 dark:text-dark-450 uppercase tracking-wider">
                Registering As
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-dark-100 dark:bg-dark-850 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setRole('customer'); setError(''); }}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    role === 'customer'
                      ? 'bg-white dark:bg-dark-800 text-dark-900 dark:text-white shadow-sm'
                      : 'text-dark-500 dark:text-dark-400 hover:text-dark-800 dark:hover:text-white'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => { setRole('provider'); setError(''); }}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    role === 'provider'
                      ? 'bg-white dark:bg-dark-800 text-dark-900 dark:text-white shadow-sm'
                      : 'text-dark-500 dark:text-dark-400 hover:text-dark-800 dark:hover:text-white'
                  }`}
                >
                  Service Provider
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-semibold text-dark-700 dark:text-dark-350">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-400 dark:text-dark-500">
                  <User size={18} />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-dark-200 dark:border-dark-800 rounded-xl bg-white dark:bg-dark-850 text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                />
              </div>
            </div>

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
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-dark-200 dark:border-dark-800 rounded-xl bg-white dark:bg-dark-850 text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-dark-700 dark:text-dark-350">
                Password
              </label>
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
                  className="block w-full pl-10 pr-4 py-2.5 border border-dark-200 dark:border-dark-800 rounded-xl bg-white dark:bg-dark-850 text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                />
              </div>
            </div>

            {/* Provider Specific Panel */}
            <AnimatePresence>
              {role === 'provider' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 overflow-hidden border-t border-dark-200 dark:border-dark-800 pt-4 mt-2"
                >
                  <div className="space-y-1.5">
                    <label htmlFor="category" className="text-sm font-semibold text-dark-700 dark:text-dark-350">
                      Service Category
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-400 dark:text-dark-500">
                        <Briefcase size={18} />
                      </div>
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 border border-dark-200 dark:border-dark-800 rounded-xl bg-white dark:bg-dark-850 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm appearance-none"
                      >
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id} className="bg-white dark:bg-dark-800 text-dark-900 dark:text-white">
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="experience" className="text-sm font-semibold text-dark-700 dark:text-dark-350">
                      Years of Experience
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-400 dark:text-dark-500">
                        <Award size={18} />
                      </div>
                      <input
                        id="experience"
                        type="number"
                        min="0"
                        placeholder="e.g. 5"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 border border-dark-200 dark:border-dark-800 rounded-xl bg-white dark:bg-dark-850 text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="bio" className="text-sm font-semibold text-dark-700 dark:text-dark-350">
                      Brief Bio / Business Details
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 pointer-events-none text-dark-400 dark:text-dark-500">
                        <AlignLeft size={18} />
                      </div>
                      <textarea
                        id="bio"
                        rows="3"
                        placeholder="Tell customers about your skills, quality of work, and certifications..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 border border-dark-200 dark:border-dark-800 rounded-xl bg-white dark:bg-dark-850 text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-500/10 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-500 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-dark-900 disabled:opacity-50 transition-all pt-2.5"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Create Account <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
