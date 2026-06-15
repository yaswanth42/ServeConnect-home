import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, Clock, Star, Users, ChevronDown, Sparkles, CheckCircle, Quote } from 'lucide-react';
import api from '../api/axios';

const STATIC_CATEGORIES = [
  { _id: 'electrician', name: 'Electrician', description: 'Wiring, fixtures, repair', icon: 'Zap' },
  { _id: 'plumber', name: 'Plumber', description: 'Leaking taps, installations', icon: 'Droplet' },
  { _id: 'carpenter', name: 'Carpenter', description: 'Furniture making & repair', icon: 'Hammer' },
  { _id: 'ac-repair', name: 'AC Repair', description: 'Servicing & gas filling', icon: 'Wind' },
  { _id: 'cleaning', name: 'Cleaning', description: 'Full house disinfection', icon: 'Sparkles' },
  { _id: 'salon-at-home', name: 'Salon at Home', description: 'Facials, haircuts, styling', icon: 'Scissors' }
];

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [faqOpen, setFaqOpen] = useState({});

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get('/services/categories');
        if (response.data && response.data.data.categories) {
          setCategories(response.data.data.categories.slice(0, 6)); // Show first 6
        }
      } catch (err) {
        setCategories(STATIC_CATEGORIES);
      }
    };
    loadCategories();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/services');
    }
  };

  const toggleFaq = (index) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const faqs = [
    { q: 'How do you verify your service providers?', a: 'All service providers undergo a background screening, check of credentials, and license verification before approval.' },
    { q: 'What happens if I need to cancel my booking?', a: 'You can cancel or reschedule any booking for free from your Customer Dashboard up to 2 hours before the scheduled appointment.' },
    { q: 'How does automatic provider assignment work?', a: 'When you create a booking, our engine finds all available, approved, and verified providers in your category, sorts them by their rating, and matches the highest rated first.' },
    { q: 'How do I pay for my service?', a: 'We support secure online payments via Razorpay (credit/debit card, UPI, net banking) or Cash on delivery/completion.' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-dark-50 dark:bg-dark-900 transition-colors duration-300">
      {/* Decorative Glow Spots */}
      <div className="glow-spot -top-20 -left-20 w-96 h-96" />
      <div className="glow-spot top-1/3 -right-20 w-80 h-80" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0) 70%)' }} />

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full text-brand-600 dark:text-brand-300 text-xs font-semibold uppercase tracking-wider"
          >
            <Sparkles size={14} />
            <span>Premium Home Service Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-dark-900 via-dark-800 to-brand-600 dark:from-white dark:via-dark-200 dark:to-brand-400 bg-clip-text text-transparent"
          >
            Your Home. Verified Experts.<br />Tap to Book.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="max-w-2xl mx-auto text-base sm:text-xl text-dark-550 dark:text-dark-300 font-light leading-relaxed"
          >
            Connecting homeowners with premium, background-checked plumbers, electricians, housekeepers, and beauticians instantly.
          </motion.p>

          {/* Search Bar Container */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onSubmit={handleSearchSubmit}
            className="max-w-xl mx-auto flex items-center p-1.5 bg-white dark:bg-dark-850 border border-dark-200 dark:border-dark-800 rounded-2xl shadow-xl shadow-brand-500/5 hover:shadow-brand-500/10 focus-within:ring-2 focus-within:ring-brand-500 transition-all"
          >
            <div className="flex-1 flex items-center px-3 space-x-2 text-dark-400 dark:text-dark-500">
              <Search size={20} />
              <input
                type="text"
                placeholder="What service do you need today?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-dark-900 dark:text-white placeholder-dark-400 text-sm sm:text-base py-2"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-brand-600 to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:opacity-95 transition-opacity"
            >
              Search
            </button>
          </motion.form>
        </div>
      </section>

      {/* POPULAR CATEGORIES */}
      <section className="py-16 bg-white dark:bg-dark-900/20 border-y border-dark-200/50 dark:border-dark-800/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <h2 className="text-3xl font-extrabold text-dark-900 dark:text-white">Popular Services</h2>
            <p className="text-dark-500 dark:text-dark-400 font-light">Select from our most frequently booked domestic services</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-6 bg-white dark:bg-dark-850 rounded-2xl border border-dark-200/50 dark:border-dark-800/50 hover:border-brand-500/30 dark:hover:border-brand-500/30 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer"
                onClick={() => navigate(`/services?category=${cat._id}`)}
              >
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 group-hover:bg-brand-500 text-brand-500 group-hover:text-white flex items-center justify-center transition-all">
                  <span className="font-semibold text-lg">{cat.name.charAt(0)}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-dark-900 dark:text-white group-hover:text-brand-500 transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-1 text-sm text-dark-550 dark:text-dark-400 font-light">
                  {cat.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <h2 className="text-3xl font-extrabold text-dark-900 dark:text-white">How it Works</h2>
          <p className="text-dark-500 dark:text-dark-400 font-light">Simple and verified domestic bookings in three simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Pick a Service', desc: 'Select the home service you require, select pricing details, and choose an address.' },
            { step: '02', title: 'Matched Instantly', desc: 'Our assignment engine coordinates and matches the highest rated active provider.' },
            { step: '03', title: 'Service Delivered', desc: 'Pay securely using Razorpay or cash, track booking live, and submit a review.' }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="p-8 bg-white dark:bg-dark-850 rounded-2xl border border-dark-200/50 dark:border-dark-800/50 relative overflow-hidden group shadow-premium"
            >
              <span className="absolute right-4 top-2 text-7xl font-extrabold text-dark-100 dark:text-dark-800/60 select-none group-hover:text-brand-500/10 transition-colors">
                {item.step}
              </span>
              <h3 className="text-xl font-bold text-dark-900 dark:text-white z-10 relative mt-4">{item.title}</h3>
              <p className="mt-3 text-sm text-dark-550 dark:text-dark-400 leading-relaxed font-light z-10 relative">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-gradient-to-tr from-brand-900 to-indigo-950 text-white text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '15,000+', label: 'Happy Customers' },
            { value: '450+', label: 'Verified Service Pros' },
            { value: '25+', label: 'Service Categories' },
            { value: '4.8★', label: 'Average rating' }
          ].map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold">{stat.value}</p>
              <p className="text-xs sm:text-sm text-brand-200 uppercase tracking-wider font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <h2 className="text-3xl font-extrabold text-dark-900 dark:text-white">Customer Reviews</h2>
          <p className="text-dark-500 dark:text-dark-400 font-light">Read feedback from our verified marketplace bookings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Sarah Miller', role: 'Homeowner', text: 'The AC repair technician arrived in 30 minutes, diagnosed the gas leak, and fixed it immediately. Excellent and transparent pricing.' },
            { name: 'David Chen', role: 'Apartment Tenant', text: 'Outstanding cleaning service. The team deep-cleaned my 2 BHK apartment and left it looking brand new. Highly recommend the RO water service too!' },
            { name: 'Elena Rostova', role: 'Working Professional', text: 'Using the beautician service at home is a life saver. The provider was extremely professional, followed all safety protocols, and did an amazing job.' }
          ].map((test, idx) => (
            <div key={idx} className="p-6 bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl shadow-sm space-y-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-sm text-dark-600 dark:text-dark-350 italic font-light">"{test.text}"</p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-dark-200 dark:bg-dark-800 flex items-center justify-center font-bold text-dark-600 dark:text-white">
                  {test.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-dark-900 dark:text-white">{test.name}</h4>
                  <p className="text-xs text-dark-500 dark:text-dark-450">{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-3xl font-extrabold text-dark-900 dark:text-white">Frequently Asked Questions</h2>
          <p className="text-dark-500 dark:text-dark-400 font-light">Everything you need to know about the marketplace</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-dark-200/50 dark:border-dark-800/50 bg-white dark:bg-dark-850 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-dark-900 dark:text-white hover:text-brand-500 focus:outline-none transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown size={18} className={`transform transition-transform ${faqOpen[idx] ? 'rotate-180 text-brand-500' : 'text-dark-400'}`} />
              </button>
              <AnimatePresence>
                {faqOpen[idx] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="p-5 pt-0 text-sm text-dark-600 dark:text-dark-400 font-light leading-relaxed border-t border-dark-100 dark:border-dark-800">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-16 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 bg-white dark:bg-dark-850 rounded-3xl border border-brand-500/20 shadow-premium space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark-900 dark:text-white">Ready to experience ServeConnect?</h2>
          <p className="max-w-md mx-auto text-sm sm:text-base text-dark-550 dark:text-dark-300 font-light">
            Sign up as a customer today to book your first service, or onboard as an approved professional to start earning.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
            <Link to="/signup?role=customer" className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-brand-600 to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/10 hover:opacity-95 text-sm">
              Book a Service
            </Link>
            <Link to="/signup?role=provider" className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-750 text-dark-800 dark:text-white rounded-xl font-bold hover:bg-dark-100 dark:hover:bg-dark-750 text-sm transition-colors">
              Become a Provider
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-12 border-t border-dark-200/50 dark:border-dark-800/50 py-8 text-center text-xs text-dark-500 dark:text-dark-450 bg-white/30 dark:bg-dark-900/20">
        <p>© 2026 ServeConnect Marketplace Inc. All rights reserved.</p>
        <div className="flex justify-center space-x-4 mt-2">
          <a href="#" className="hover:text-brand-500 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-brand-500 transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="#" className="hover:text-brand-500 transition-colors">Support Helpline</a>
        </div>
      </footer>
    </div>
  );
}
