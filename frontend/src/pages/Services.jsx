import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Clock, Tag, ArrowUpDown, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // URL state sync
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';
  
  // Component states
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState(3000);
  const [sort, setSort] = useState('-popularity'); // Default sorting
  const [loading, setLoading] = useState(true);

  // Sync state with URL params
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategory(searchParams.get('category') || '');
  }, [searchParams]);

  // Load Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/services/categories');
        if (response.data && response.data.data.categories) {
          setCategories(response.data.data.categories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Services when filters change
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const params = {
          sort,
          limit: 50,
          price: { lte: maxPrice }
        };
        
        if (search) params.search = search;
        if (category) params.category = category;

        // Flatten price parameters for simple backend filters: price[lte]=...
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        if (category) queryParams.append('category', category);
        if (sort) queryParams.append('sort', sort);
        queryParams.append('price[lte]', maxPrice);

        const response = await api.get(`/services?${queryParams.toString()}`);
        if (response.data && response.data.data.services) {
          setServices(response.data.data.services);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce pricing filter slightly
    const timer = setTimeout(fetchServices, 300);
    return () => clearTimeout(timer);
  }, [search, category, maxPrice, sort]);

  const handleFilterCategory = (catId) => {
    const newParams = new URLSearchParams(searchParams);
    if (catId) {
      newParams.set('category', catId);
      setCategory(catId);
    } else {
      newParams.delete('category');
      setCategory('');
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set('search', val);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleBookNow = (serviceId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/services/${serviceId}` } } });
    } else {
      navigate(`/services/${serviceId}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-dark-900 dark:text-white">Explore Services</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">Book certified and top-rated professionals for your household needs.</p>
        </div>

        {/* Global Search Input */}
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400 dark:text-dark-500">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search for fans, taps, cleaning..."
            value={search}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-4 py-2.5 border border-dark-200 dark:border-dark-800 rounded-xl bg-white dark:bg-dark-850 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* FILTERS SIDEBAR */}
        <aside className="w-full lg:w-64 flex-shrink-0 bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-dark-100 dark:border-dark-800 pb-4">
            <h3 className="font-bold text-dark-900 dark:text-white flex items-center">
              <SlidersHorizontal size={18} className="mr-2 text-brand-500" /> Filters
            </h3>
            {(category || search || maxPrice < 3000) && (
              <button
                onClick={() => {
                  setSearchParams({});
                  setSearch('');
                  setCategory('');
                  setMaxPrice(3000);
                  setSort('-popularity');
                }}
                className="text-xs font-semibold text-brand-500 hover:text-brand-600"
              >
                Reset
              </button>
            )}
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-dark-450 dark:text-dark-500 uppercase tracking-wider">Categories</h4>
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => handleFilterCategory('')}
                className={`text-left text-sm py-1.5 px-2.5 rounded-lg transition-colors font-medium ${
                  !category 
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-350' 
                    : 'text-dark-600 dark:text-dark-350 hover:bg-dark-100 dark:hover:bg-dark-800'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleFilterCategory(cat._id)}
                  className={`text-left text-sm py-1.5 px-2.5 rounded-lg transition-colors font-medium truncate ${
                    category === cat._id 
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-350' 
                      : 'text-dark-600 dark:text-dark-350 hover:bg-dark-100 dark:hover:bg-dark-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Max Price Filter */}
          <div className="space-y-2.5 border-t border-dark-100 dark:border-dark-800 pt-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-semibold text-dark-450 dark:text-dark-500 uppercase tracking-wider">Max Price</h4>
              <span className="text-xs font-bold text-brand-500">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="100"
              max="4000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-dark-200 dark:bg-dark-750 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
          </div>

          {/* Sorting */}
          <div className="space-y-2 border-t border-dark-100 dark:border-dark-800 pt-4">
            <h4 className="text-xs font-semibold text-dark-450 dark:text-dark-500 uppercase tracking-wider">Sort By</h4>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-400">
                <ArrowUpDown size={14} />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="block w-full pl-8 pr-4 py-2 border border-dark-200 dark:border-dark-800 rounded-xl bg-white dark:bg-dark-850 text-dark-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 appearance-none"
              >
                <option value="-popularity" className="bg-white dark:bg-dark-800 text-dark-900 dark:text-white">Popularity</option>
                <option value="price" className="bg-white dark:bg-dark-800 text-dark-900 dark:text-white">Price: Low to High</option>
                <option value="-price" className="bg-white dark:bg-dark-800 text-dark-900 dark:text-white">Price: High to Low</option>
                <option value="duration" className="bg-white dark:bg-dark-800 text-dark-900 dark:text-white">Duration: Shortest</option>
              </select>
            </div>
          </div>
        </aside>

        {/* SERVICES CATALOG */}
        <div className="flex-1 w-full">
          {loading ? (
            // Skeleton Loader Cards Grid
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-6 bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl shadow-sm space-y-4">
                  <div className="w-1/3 h-4 rounded skeleton-shimmer" />
                  <div className="w-3/4 h-6 rounded skeleton-shimmer" />
                  <div className="w-full h-12 rounded skeleton-shimmer" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="w-1/4 h-6 rounded skeleton-shimmer" />
                    <div className="w-1/3 h-10 rounded-xl skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-dark-850 rounded-2xl border border-dark-200/50 dark:border-dark-800/50 p-8">
              <Tag size={48} className="mx-auto text-dark-350 dark:text-dark-600 mb-4" />
              <h3 className="text-lg font-bold text-dark-900 dark:text-white">No Services Found</h3>
              <p className="text-sm text-dark-500 dark:text-dark-400 mt-1 max-w-xs mx-auto">Try resetting your filters or adjusting your search keyword.</p>
            </div>
          ) : (
            // Services Grid
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((srv) => (
                <div
                  key={srv._id}
                  className="p-6 bg-white dark:bg-dark-850 rounded-2xl border border-dark-200/50 dark:border-dark-800/50 hover:border-brand-500/20 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-2xs font-semibold text-brand-600 dark:text-brand-350 bg-brand-500/10 rounded border border-brand-500/20">
                        {srv.category?.name || 'Service'}
                      </span>
                      <span className="text-xs text-dark-500 flex items-center">
                        <Clock size={12} className="mr-1 text-dark-400" /> {srv.duration} min
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-dark-900 dark:text-white">{srv.name}</h3>
                    <p className="text-sm text-dark-600 dark:text-dark-400 font-light line-clamp-2 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-100 dark:border-dark-800/80">
                    <div>
                      <span className="text-2xs text-dark-400 block font-medium uppercase tracking-wider">Price</span>
                      <span className="text-xl font-extrabold text-dark-900 dark:text-white">₹{srv.price}</span>
                    </div>

                    <button
                      onClick={() => handleBookNow(srv._id)}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-500 hover:opacity-95 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-brand-500/5"
                    >
                      Book Now <ChevronRight size={14} className="ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
