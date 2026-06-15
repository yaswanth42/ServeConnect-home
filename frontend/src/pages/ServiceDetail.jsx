import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Tag, MapPin, Calendar, CreditCard, ChevronRight, ArrowLeft, PlusCircle, Check, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  // Data states
  const [service, setService] = useState(null);
  const [related, setRelated] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Wizard states
  const [step, setStep] = useState(1); // 1: Address, 2: Schedule, 3: Confirm/Pay, 4: Matching
  const [selectedAddress, setSelectedAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(null);
  const [matchingStatus, setMatchingStatus] = useState('assigning'); // assigning, matched, failed

  // Inline new address state
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddressTitle, setNewAddressTitle] = useState('Home');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newZip, setNewZip] = useState('');

  // Load details on mount/ID change
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const srvResponse = await api.get(`/services/${id}`);
        setService(srvResponse.data.data.service);
        setRelated(srvResponse.data.data.relatedServices || []);

        // Load reviews for the service provider if assigned, or general reviews
        if (srvResponse.data.data.service) {
          const providerId = srvResponse.data.data.service.category; // fallback
          try {
            const revResponse = await api.get(`/reviews/provider/${providerId}`);
            setReviews(revResponse.data.data.reviews || []);
          } catch (rErr) {
            setReviews([]);
          }
        }

        // Fetch user addresses if logged in
        if (user) {
          const addrResponse = await api.get('/addresses');
          const addrs = addrResponse.data.data.addresses;
          setAddresses(addrs);
          const defAddr = addrs.find(a => a.isDefault);
          if (defAddr) setSelectedAddress(defAddr._id);
          else if (addrs.length > 0) setSelectedAddress(addrs[0]._id);
        }
      } catch (err) {
        console.error('Error fetching service details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, user]);

  // Socket listener for booking updates during matching step
  useEffect(() => {
    if (!socket || !booking) return;

    const handleBookingUpdate = (updatedBooking) => {
      if (updatedBooking._id === booking._id) {
        setBooking(updatedBooking);
        if (updatedBooking.status === 'Assigned' || updatedBooking.status === 'Accepted') {
          setMatchingStatus('matched');
        } else if (updatedBooking.status === 'Pending') {
          // Assignment failed (no providers found)
          setMatchingStatus('failed');
        }
      }
    };

    socket.on('booking-update', handleBookingUpdate);
    return () => {
      socket.off('booking-update', handleBookingUpdate);
    };
  }, [socket, booking]);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!newStreet || !newCity || !newState || !newZip) return;

    try {
      const response = await api.post('/addresses', {
        title: newAddressTitle,
        streetAddress: newStreet,
        city: newCity,
        state: newState,
        zipCode: newZip
      });
      const newAddr = response.data.data.address;
      setAddresses(prev => [...prev, newAddr]);
      setSelectedAddress(newAddr._id);
      setShowNewAddressForm(false);
      // Reset fields
      setNewStreet('');
      setNewCity('');
      setNewState('');
      setNewZip('');
    } catch (err) {
      console.error('Error adding address:', err);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setStep(4);
      setMatchingStatus('assigning');
      
      const response = await api.post('/bookings', {
        serviceId: service._id,
        addressId: selectedAddress,
        scheduleDate: date,
        scheduleTime: time,
        paymentMethod,
        notes
      });
      
      const newBooking = response.data.data.booking;
      setBooking(newBooking);

      // Check status immediately
      if (newBooking.status === 'Assigned' || newBooking.status === 'Accepted') {
        setMatchingStatus('matched');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setMatchingStatus('failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-dark-50 dark:bg-dark-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand-500 mx-auto" />
          <p className="text-sm text-dark-500">Loading service specifications...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-dark-50 dark:bg-dark-900">
        <h3 className="text-xl font-bold text-dark-900 dark:text-white">Service Not Found</h3>
        <p className="text-dark-500 dark:text-dark-400 mt-1">The requested service details are unavailable.</p>
        <Link to="/services" className="mt-4 text-brand-500 font-semibold flex items-center">
          <ArrowLeft size={16} className="mr-1" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const selectedAddrObj = addresses.find(a => a._id === selectedAddress);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      <Link to="/services" className="inline-flex items-center text-sm font-semibold text-dark-500 hover:text-brand-500 mb-6 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Services
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT TWO COLUMNS: Service Details & Reviews */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-dark-850 rounded-2xl border border-dark-200/50 dark:border-dark-800/50 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-350 bg-brand-500/10 border border-brand-500/25 rounded-lg">
                {service.category?.name}
              </span>
              <span className="text-sm text-dark-500 flex items-center">
                <Clock size={16} className="mr-1 text-dark-400" /> {service.duration} min
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-dark-900 dark:text-white leading-tight">
              {service.name}
            </h1>

            <div className="border-t border-dark-100 dark:border-dark-800 pt-6">
              <h3 className="font-bold text-dark-900 dark:text-white mb-2">Description</h3>
              <p className="text-dark-600 dark:text-dark-350 font-light leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {service.description}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-dark-100 dark:border-dark-800 pt-6">
              <div>
                <span className="text-xs text-dark-400 block font-medium uppercase tracking-wider">Flat rate</span>
                <span className="text-3xl font-extrabold text-dark-900 dark:text-white">₹{service.price}</span>
              </div>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="bg-white dark:bg-dark-850 rounded-2xl border border-dark-200/50 dark:border-dark-800/50 p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-dark-900 dark:text-white">Customer Reviews ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-dark-550 dark:text-dark-400 font-light">No reviews yet for this category. Be the first to rate!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev._id} className="border-b border-dark-100 dark:border-dark-800/60 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <img src={rev.customer?.avatar} alt={rev.customer?.name} className="w-8 h-8 rounded-full" />
                        <h4 className="text-sm font-bold text-dark-900 dark:text-white">{rev.customer?.name}</h4>
                      </div>
                      <div className="flex text-yellow-400">
                        {[...Array(rev.rating)].map((_, i) => <Check key={i} size={12} className="text-yellow-400 fill-current" />)}
                      </div>
                    </div>
                    <p className="text-xs text-dark-550 dark:text-dark-350 italic font-light">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT ONE COLUMN: Booking Wizard */}
        <div className="bg-white dark:bg-dark-850 rounded-2xl border border-brand-500/20 dark:border-dark-800/50 p-6 shadow-premium sticky top-24">
          <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-4 border-b border-dark-100 dark:border-dark-800 pb-3">
            {step === 4 ? 'Matching Pro' : 'Booking Wizard'}
          </h3>

          {!user ? (
            <div className="text-center py-6 space-y-4">
              <p className="text-sm text-dark-550 dark:text-dark-400">Please sign in as a customer to book this service.</p>
              <Link
                to="/login"
                state={{ from: { pathname: `/services/${service._id}` } }}
                className="w-full block text-center py-3 bg-brand-500 text-white rounded-xl font-bold text-sm hover:bg-brand-600 transition-colors"
              >
                Sign In to Book
              </Link>
            </div>
          ) : user.role !== 'customer' ? (
            <div className="text-center py-6 text-sm text-red-600 dark:text-red-400 font-medium">
              Only customer accounts can book services.
            </div>
          ) : (
            <div className="space-y-6">
              {/* STEP 1: ADDRESS */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2">1. Select Address</p>
                  {showNewAddressForm ? (
                    <form onSubmit={handleCreateAddress} className="space-y-3 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl border border-dark-200 dark:border-dark-750">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Title (e.g. Home)"
                          value={newAddressTitle}
                          onChange={(e) => setNewAddressTitle(e.target.value)}
                          className="p-2 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-850 text-dark-900 dark:text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Zip Code"
                          value={newZip}
                          onChange={(e) => setNewZip(e.target.value)}
                          className="p-2 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-850 text-dark-900 dark:text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                          required
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Street Address"
                        value={newStreet}
                        onChange={(e) => setNewStreet(e.target.value)}
                        className="w-full p-2 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-850 text-dark-900 dark:text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="City"
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          className="p-2 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-850 text-dark-900 dark:text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                          required
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={newState}
                          onChange={(e) => setNewState(e.target.value)}
                          className="p-2 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-850 text-dark-900 dark:text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                          required
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button type="submit" className="flex-1 bg-brand-500 text-white rounded-lg py-1.5 text-xs font-semibold">Save</button>
                        <button type="button" onClick={() => setShowNewAddressForm(false)} className="flex-1 bg-dark-200 dark:bg-dark-700 rounded-lg py-1.5 text-xs font-semibold">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {addresses.map((addr) => (
                        <label
                          key={addr._id}
                          className={`flex items-start p-3 border rounded-xl cursor-pointer hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors ${
                            selectedAddress === addr._id
                              ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10'
                              : 'border-dark-200 dark:border-dark-800'
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            checked={selectedAddress === addr._id}
                            onChange={() => setSelectedAddress(addr._id)}
                            className="mt-1 mr-3 accent-brand-500"
                          />
                          <div className="text-xs">
                            <span className="font-bold text-dark-900 dark:text-white block">{addr.title}</span>
                            <span className="text-dark-500 dark:text-dark-400 font-light block mt-0.5">{addr.streetAddress}, {addr.city}</span>
                          </div>
                        </label>
                      ))}
                      <button
                        onClick={() => setShowNewAddressForm(true)}
                        className="w-full flex items-center justify-center p-3 border border-dashed border-dark-300 dark:border-dark-750 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl text-xs font-semibold text-brand-500 transition-colors"
                      >
                        <PlusCircle size={14} className="mr-1" /> Add New Address
                      </button>
                    </div>
                  )}

                  <button
                    disabled={!selectedAddress}
                    onClick={() => setStep(2)}
                    className="w-full flex items-center justify-center py-2.5 bg-gradient-to-r from-brand-600 to-indigo-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40"
                  >
                    Select Schedule <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              )}

              {/* STEP 2: SCHEDULE */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2">2. Choose Date & Time</p>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Appointment Date</label>
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 text-dark-900 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Available Time Slots</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['09:00', '11:00', '14:00', '16:00', '18:00'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTime(t)}
                          className={`py-2 px-1 text-center text-xs font-semibold border rounded-lg transition-colors ${
                            time === t
                              ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-350'
                              : 'border-dark-200 dark:border-dark-800 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-800'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-2.5 border border-dark-200 dark:border-dark-750 text-dark-800 dark:text-white rounded-xl text-xs font-semibold"
                    >
                      Back
                    </button>
                    <button
                      disabled={!date || !time}
                      onClick={() => setStep(3)}
                      className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-40"
                    >
                      Summary
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CONFIRM & PAY */}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2">3. Confirmation</p>
                  
                  <div className="p-3 bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-750 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between font-semibold"><span className="text-dark-500">Service:</span> <span className="text-dark-900 dark:text-white">{service.name}</span></div>
                    <div className="flex justify-between font-semibold"><span className="text-dark-500">Date/Time:</span> <span className="text-dark-900 dark:text-white">{date} @ {time}</span></div>
                    <div className="flex justify-between font-semibold"><span className="text-dark-500">Price:</span> <span className="text-brand-500 font-bold">₹{service.price}</span></div>
                    {selectedAddrObj && (
                      <div className="border-t border-dark-200 dark:border-dark-700 pt-2 font-semibold">
                        <span className="text-dark-500 block">Address:</span>
                        <span className="text-dark-700 dark:text-dark-300 block font-light mt-0.5">{selectedAddrObj.streetAddress}, {selectedAddrObj.city}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Payment Option</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Cash', 'Razorpay'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`py-2 px-1 text-center text-xs font-semibold border rounded-lg transition-colors ${
                            paymentMethod === method
                              ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-350'
                              : 'border-dark-200 dark:border-dark-800 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-800'
                          }`}
                        >
                          {method === 'Cash' ? 'Pay Cash after Job' : 'Pay Online (Mock)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Instructions for provider (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 text-dark-900 dark:text-white rounded-xl text-xs focus:outline-none"
                  />

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-2.5 border border-dark-200 dark:border-dark-750 text-dark-800 dark:text-white rounded-xl text-xs font-semibold"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/10"
                    >
                      Book & Assign
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: SOCKET MATCHING SCREEN */}
              {step === 4 && (
                <div className="text-center py-6 space-y-4">
                  {matchingStatus === 'assigning' && (
                    <>
                      <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto" />
                      <h4 className="font-bold text-dark-900 dark:text-white">Finding a Professional...</h4>
                      <p className="text-xs text-dark-500 dark:text-dark-400 font-light leading-relaxed max-w-xs mx-auto">
                        Our engine is analyzing local verified AC/plumbing experts to find the highest rated provider for your time slot.
                      </p>
                    </>
                  )}

                  {matchingStatus === 'matched' && (
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 text-green-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                        ✓
                      </div>
                      <h4 className="font-bold text-dark-900 dark:text-white">Provider Assigned!</h4>
                      <div className="p-3 bg-dark-50 dark:bg-dark-800 rounded-xl border border-dark-200 dark:border-dark-750 text-left space-y-1">
                        <span className="text-2xs text-dark-400 font-bold block uppercase">Assigned Provider</span>
                        <div className="flex items-center space-x-2 pt-1">
                          <img src={booking?.provider?.avatar} alt={booking?.provider?.name} className="w-8 h-8 rounded-full border" />
                          <div>
                            <span className="font-bold text-xs text-dark-900 dark:text-white block">{booking?.provider?.name}</span>
                            <span className="text-2xs text-dark-500 dark:text-dark-400 block">Status: Assigned & Ready</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/customer')}
                        className="w-full py-2.5 bg-brand-500 text-white rounded-xl text-xs font-bold"
                      >
                        Go to Dashboard
                      </button>
                    </div>
                  )}

                  {matchingStatus === 'failed' && (
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mx-auto font-bold">
                        ✕
                      </div>
                      <h4 className="font-bold text-dark-900 dark:text-white">Busy right now</h4>
                      <p className="text-xs text-dark-550 dark:text-dark-400 leading-relaxed font-light">
                        We could not find an available provider for this time slot. We have kept your booking in a pending state and will alert you once a technician accepts.
                      </p>
                      <button
                        onClick={() => navigate('/customer')}
                        className="w-full py-2 bg-dark-200 dark:bg-dark-800 text-dark-800 dark:text-white rounded-xl text-xs font-semibold"
                      >
                        View Bookings
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
