import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, Star, Trash2, Shield, PlusCircle, Clock, CheckCircle, FileText, XCircle, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState('overview'); // overview, bookings, addresses, settings

  // Data States
  const [bookings, setBookings] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Address creation form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrTitle, setAddrTitle] = useState('Home');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');

  // Review dialog states
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Fetch initial data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const bRes = await api.get('/bookings/customer');
      setBookings(bRes.data.data.bookings || []);

      const aRes = await api.get('/addresses');
      setAddresses(aRes.data.data.addresses || []);
    } catch (err) {
      console.error('Error loading customer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Socket listener for real-time booking updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (updatedBooking) => {
      setBookings((prev) => 
        prev.map((b) => (b._id === updatedBooking._id ? { ...b, ...updatedBooking } : b))
      );
    };

    socket.on('booking-update', handleUpdate);
    return () => {
      socket.off('booking-update', handleUpdate);
    };
  }, [socket]);

  // Cancel Booking
  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const response = await api.patch(`/bookings/${id}/cancel`);
      const updated = response.data.data.booking;
      setBookings(prev => prev.map(b => b._id === id ? { ...b, ...updated } : b));
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed');
    }
  };

  // Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return setReviewError('Please write a comment.');

    try {
      setReviewError('');
      await api.post('/reviews', {
        bookingId: reviewBookingId,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewSuccess('Thank you! Your review has been recorded.');
      setReviewBookingId(null);
      setReviewComment('');
      setReviewRating(5);
      
      // reload data
      loadDashboardData();
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    }
  };

  // Create Address
  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!addrStreet || !addrCity || !addrState || !addrZip) return;

    try {
      const response = await api.post('/addresses', {
        title: addrTitle,
        streetAddress: addrStreet,
        city: addrCity,
        state: addrState,
        zipCode: addrZip
      });
      setAddresses(prev => [...prev, response.data.data.address]);
      setShowAddressForm(false);
      setAddrStreet('');
      setAddrCity('');
      setAddrState('');
      setAddrZip('');
    } catch (err) {
      console.error('Error adding address:', err);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      setAddresses(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  // Make Default Address
  const handleSetDefaultAddress = async (id) => {
    try {
      const response = await api.patch(`/addresses/${id}/default`);
      setAddresses(prev => prev.map(a => a._id === id ? { ...a, isDefault: true } : { ...a, isDefault: false }));
    } catch (err) {
      console.error('Set default address failed:', err);
    }
  };

  // Status Badge Class Builder
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Cancelled': return 'bg-dark-100 text-dark-500 border-dark-200 dark:bg-dark-800 dark:text-dark-450';
      case 'Accepted': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'On The Way':
      case 'Started': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Assigned': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-dark-200 text-dark-500 dark:bg-dark-800';
    }
  };

  const activeBookings = bookings.filter(b => !['Completed', 'Cancelled'].includes(b.status));
  const pastBookings = bookings.filter(b => ['Completed', 'Cancelled'].includes(b.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* SIDE BAR NAVIGATION */}
        <aside className="w-full md:w-60 bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="px-3 py-2 border-b border-dark-100 dark:border-dark-800 mb-4">
            <h2 className="font-bold text-dark-900 dark:text-white text-base truncate">{user?.name}</h2>
            <span className="text-2xs font-semibold text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 mt-1 inline-block uppercase">Customer</span>
          </div>

          {[
            { id: 'overview', label: 'Overview', icon: CheckCircle },
            { id: 'bookings', label: 'My Bookings', icon: Calendar },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800'
              }`}
            >
              <tab.icon size={16} className="mr-3" />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* DASHBOARD CONTENT PANEL */}
        <main className="flex-grow w-full space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: 'Total Appointments', value: bookings.length, icon: Calendar, color: 'text-brand-500 bg-brand-500/10' },
                  { label: 'Active Jobs', value: activeBookings.length, icon: Clock, color: 'text-yellow-500 bg-yellow-500/10' },
                  { label: 'Saved Locations', value: addresses.length, icon: MapPin, color: 'text-blue-500 bg-blue-500/10' }
                ].map((stat, idx) => (
                  <div key={idx} className="p-6 bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl shadow-sm flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                      <stat.icon size={22} />
                    </div>
                    <div>
                      <span className="text-2xs font-medium uppercase tracking-wider text-dark-450 dark:text-dark-500">{stat.label}</span>
                      <p className="text-2xl font-extrabold text-dark-900 dark:text-white mt-0.5">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Booking Tracker */}
              {activeBookings.length > 0 && (
                <div className="p-6 bg-white dark:bg-dark-850 border border-brand-500/20 rounded-2xl shadow-premium space-y-4">
                  <div className="flex items-center justify-between border-b border-dark-100 dark:border-dark-800 pb-3">
                    <div>
                      <span className="text-2xs font-bold text-brand-500 uppercase tracking-widest">Active Assignment Tracker</span>
                      <h3 className="text-lg font-bold text-dark-900 dark:text-white mt-0.5">
                        {activeBookings[0].service?.name}
                      </h3>
                    </div>
                    <span className={`px-2.5 py-1 text-2xs font-semibold border rounded-lg uppercase tracking-wider ${getStatusBadgeClass(activeBookings[0].status)}`}>
                      {activeBookings[0].status}
                    </span>
                  </div>

                  {/* Visual Tracker Bar */}
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {[
                      { label: 'Assigned', active: ['Assigned', 'Accepted', 'On The Way', 'Started', 'Completed'].includes(activeBookings[0].status) },
                      { label: 'Accepted', active: ['Accepted', 'On The Way', 'Started', 'Completed'].includes(activeBookings[0].status) },
                      { label: 'On The Way', active: ['On The Way', 'Started', 'Completed'].includes(activeBookings[0].status) },
                      { label: 'Started', active: ['Started', 'Completed'].includes(activeBookings[0].status) }
                    ].map((step, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className={`h-1.5 rounded-full transition-colors duration-500 ${step.active ? 'bg-brand-500' : 'bg-dark-200 dark:bg-dark-800'}`} />
                        <span className={`text-3xs font-semibold uppercase block text-center ${step.active ? 'text-brand-500' : 'text-dark-400'}`}>{step.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Assigned Provider Details */}
                  {activeBookings[0].provider && (
                    <div className="flex items-center justify-between p-3 bg-dark-50 dark:bg-dark-800 border border-dark-200/50 dark:border-dark-750 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <img src={activeBookings[0].provider.avatar} alt="" className="w-10 h-10 rounded-full border" />
                        <div>
                          <span className="font-bold text-xs text-dark-900 dark:text-white block">{activeBookings[0].provider.name}</span>
                          <span className="text-3xs text-dark-500 block font-light">Your assigned verified technician</span>
                        </div>
                      </div>
                      <a href={`tel:123`} className="text-2xs bg-white dark:bg-dark-700 border border-dark-200 dark:border-dark-700 px-3 py-1.5 rounded-lg font-bold text-dark-700 dark:text-white">Call Pro</a>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Bookings List */}
              <div className="bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-dark-900 dark:text-white">Recent Appointments</h3>
                {bookings.length === 0 ? (
                  <p className="text-sm text-dark-500 font-light py-4 text-center">No service appointments found. Ready to book your first?</p>
                ) : (
                  <div className="divide-y divide-dark-100 dark:divide-dark-800">
                    {bookings.slice(0, 3).map((b) => (
                      <div key={b._id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 text-xs">
                          <h4 className="font-bold text-sm text-dark-900 dark:text-white">{b.service?.name}</h4>
                          <span className="text-dark-500 flex items-center font-light">
                            <Calendar size={12} className="mr-1 text-dark-400" /> {b.scheduleDate ? new Date(b.scheduleDate).toLocaleDateString() : 'N/A'} @ {b.scheduleTime}
                          </span>
                          {b.provider && <span className="text-dark-500 font-light block">Technician: {b.provider.name}</span>}
                        </div>
                        <div className="flex items-center space-x-3 self-end sm:self-center">
                          <span className="text-sm font-extrabold text-dark-900 dark:text-white">₹{b.price}</span>
                          <span className={`px-2 py-0.5 text-3xs font-bold border rounded uppercase tracking-wider ${getStatusBadgeClass(b.status)}`}>
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY BOOKINGS LIST */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-dark-900 dark:text-white">Service Appointments</h3>

              {reviewBookingId && (
                <div className="p-6 bg-white dark:bg-dark-850 border border-brand-500/30 rounded-2xl shadow-xl space-y-4 animate-in fade-in duration-200">
                  <h4 className="font-bold text-dark-900 dark:text-white">Submit Service Review</h4>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Rating Stars</label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star size={24} className={star <= reviewRating ? 'text-yellow-400 fill-current' : 'text-dark-300 dark:text-dark-700'} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Comments</label>
                      <textarea
                        required
                        rows="3"
                        placeholder="Detail your experience with this provider..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full p-3 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <button type="submit" className="bg-brand-500 text-white rounded-lg px-4 py-2 text-xs font-semibold">Post Review</button>
                      <button type="button" onClick={() => setReviewBookingId(null)} className="bg-dark-200 dark:bg-dark-700 rounded-lg px-4 py-2 text-xs font-semibold">Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              {bookings.length === 0 ? (
                <p className="text-sm text-dark-500 font-light text-center py-12 bg-white dark:bg-dark-850 rounded-2xl border">
                  No appointments booked.
                </p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((b) => (
                    <div
                      key={b._id}
                      className="p-6 bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-brand-500/10 transition-all"
                    >
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-bold text-dark-900 dark:text-white">{b.service?.name}</h4>
                          <span className={`px-2 py-0.5 text-3xs font-bold border rounded uppercase tracking-wider ${getStatusBadgeClass(b.status)}`}>
                            {b.status}
                          </span>
                        </div>
                        <p className="text-dark-500 flex items-center font-light">
                          <Calendar size={12} className="mr-1 text-dark-400" /> Date: {b.scheduleDate ? new Date(b.scheduleDate).toLocaleDateString() : 'N/A'} @ {b.scheduleTime}
                        </p>
                        {b.address && (
                          <p className="text-dark-500 flex items-center font-light">
                            <MapPin size={12} className="mr-1 text-dark-400" /> Location: {b.address.streetAddress}, {b.address.city}
                          </p>
                        )}
                        {b.provider && (
                          <div className="flex items-center space-x-2 border-t border-dark-100 dark:border-dark-800 pt-2 mt-2">
                            <img src={b.provider.avatar} className="w-6 h-6 rounded-full" alt="" />
                            <span className="font-semibold text-dark-700 dark:text-dark-300">Technician: {b.provider.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end justify-between gap-3 border-t md:border-t-0 border-dark-100 dark:border-dark-800 pt-3 md:pt-0">
                        <span className="text-lg font-extrabold text-dark-900 dark:text-white">₹{b.price}</span>
                        <div className="flex items-center space-x-2">
                          {/* Cancel button */}
                          {['Pending', 'Assigned', 'Accepted'].includes(b.status) && (
                            <button
                              onClick={() => handleCancelBooking(b._id)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/45 text-red-600 rounded-lg text-xs font-bold transition-all border border-red-200 dark:border-red-900/30"
                            >
                              Cancel Booking
                            </button>
                          )}
                          {/* Review button */}
                          {b.status === 'Completed' && (
                            <button
                              onClick={() => setReviewBookingId(b._id)}
                              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-brand-500/10"
                            >
                              Leave a Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADDRESSES CRUD */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-dark-900 dark:text-white">Saved Addresses</h3>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="flex items-center text-xs font-bold text-brand-500 hover:text-brand-600"
                >
                  <PlusCircle size={14} className="mr-1" /> Add Address
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={handleCreateAddress} className="p-6 bg-white dark:bg-dark-850 rounded-2xl border border-brand-500/20 shadow-premium space-y-4">
                  <h4 className="font-bold text-dark-900 dark:text-white text-sm">Add New Saved Address</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Title</label>
                      <input
                        type="text"
                        placeholder="Home, Work, Parents..."
                        value={addrTitle}
                        onChange={(e) => setAddrTitle(e.target.value)}
                        className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Zip Code</label>
                      <input
                        type="text"
                        placeholder="110011"
                        value={addrZip}
                        onChange={(e) => setAddrZip(e.target.value)}
                        className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Street Address</label>
                    <input
                      type="text"
                      placeholder="Flat 304, Green Apartment, Lane 3"
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-dark-600 dark:text-dark-400">City</label>
                      <input
                        type="text"
                        placeholder="New Delhi"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-dark-600 dark:text-dark-400">State</label>
                      <input
                        type="text"
                        placeholder="Delhi"
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                        className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <button type="submit" className="bg-brand-500 text-white rounded-lg px-4 py-2 text-xs font-semibold">Save Address</button>
                    <button type="button" onClick={() => setShowAddressForm(false)} className="bg-dark-200 dark:bg-dark-700 rounded-lg px-4 py-2 text-xs font-semibold">Cancel</button>
                  </div>
                </form>
              )}

              {addresses.length === 0 ? (
                <p className="text-sm text-dark-500 font-light text-center py-12 bg-white dark:bg-dark-850 rounded-2xl border">
                  No addresses saved yet. Click add address to start.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`p-6 bg-white dark:bg-dark-850 border rounded-2xl shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all ${
                        addr.isDefault
                          ? 'border-brand-500 bg-brand-500/2 dark:bg-brand-500/5'
                          : 'border-dark-200 dark:border-dark-800'
                      }`}
                    >
                      <div className="text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-dark-900 dark:text-white">{addr.title}</span>
                          {addr.isDefault && (
                            <span className="text-3xs font-semibold text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 uppercase tracking-wider">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-dark-550 dark:text-dark-400 font-light leading-relaxed">
                          {addr.streetAddress}, {addr.city}, {addr.state} - {addr.zipCode}
                        </p>
                      </div>

                      <div className="flex justify-between items-center border-t border-dark-100 dark:border-dark-800 pt-3">
                        {!addr.isDefault ? (
                          <button
                            onClick={() => handleSetDefaultAddress(addr._id)}
                            className="text-3xs font-bold text-brand-500 hover:text-brand-600"
                          >
                            Set as Default
                          </button>
                        ) : (
                          <span className="text-3xs text-dark-450 font-bold uppercase">Active Default</span>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(addr._id)}
                          className="text-dark-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
