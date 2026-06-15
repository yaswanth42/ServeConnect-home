import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Calendar, Clock, DollarSign, Star, Briefcase, Settings, FileText, CheckCircle, XCircle, ShieldAlert, Award, User, LogOut } from 'lucide-react';
import api from '../api/axios';

export default function ProviderDashboard() {
  const { user, checkAuth } = useAuth();
  const { socket } = useSocket();

  // Tab State
  const [activeTab, setActiveTab] = useState('overview'); // overview, bookings, profile, documents

  // Data States
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile Form States
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('18:00');
  const [profileMessage, setProfileMessage] = useState('');

  // Document Upload States
  const [docType, setDocType] = useState('certificate');
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docMessage, setDocMessage] = useState('');

  const loadProviderData = async () => {
    try {
      setLoading(true);
      const bRes = await api.get('/bookings/provider');
      setBookings(bRes.data.data.bookings || []);

      const pRes = await api.get('/providers/profile');
      const prof = pRes.data.data.profile;
      setProfile(prof);
      
      if (prof) {
        setBio(prof.bio || '');
        setExperience(prof.experience || '');
        setStartHour(prof.workingHours?.start || '09:00');
        setEndHour(prof.workingHours?.end || '18:00');
      }
    } catch (err) {
      console.error('Error loading provider dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviderData();
  }, []);

  // Socket listener for new booking offers & updates
  useEffect(() => {
    if (!socket) return;

    const handleOffer = (newBooking) => {
      setBookings((prev) => [newBooking, ...prev]);
    };

    const handleUpdate = (updatedBooking) => {
      setBookings((prev) => 
        prev.map((b) => (b._id === updatedBooking._id ? { ...b, ...updatedBooking } : b))
      );
    };

    socket.on('booking-offer', handleOffer);
    socket.on('booking-update', handleUpdate);
    
    return () => {
      socket.off('booking-offer', handleOffer);
      socket.off('booking-update', handleUpdate);
    };
  }, [socket]);

  // Toggle Availability
  const handleToggleAvailability = async () => {
    if (!profile) return;
    try {
      const updatedAvail = !profile.isAvailable;
      const response = await api.patch('/providers/profile', {
        isAvailable: updatedAvail
      });
      setProfile(prev => ({ ...prev, isAvailable: updatedAvail }));
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  // Update Profile Settings
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileMessage('');
      const response = await api.patch('/providers/profile', {
        bio,
        experience: Number(experience),
        workingHours: {
          start: startHour,
          end: endHour
        }
      });
      setProfile(response.data.data.profile);
      setProfileMessage('Settings updated successfully!');
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (err) {
      setProfileMessage('Failed to update profile.');
    }
  };

  // Document Upload Submit
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docUrl) return;

    try {
      setDocMessage('');
      const response = await api.post('/providers/profile/documents', {
        type: docType,
        name: docName || `${docType.replace('_', ' ')} Upload`,
        url: docUrl
      });
      setProfile(response.data.data.profile);
      setDocMessage('Document submitted for admin review!');
      setDocName('');
      setDocUrl('');
      setTimeout(() => setDocMessage(''), 3000);
    } catch (err) {
      setDocMessage('Document upload failed.');
    }
  };

  // Accept Booking
  const handleAcceptBooking = async (id) => {
    try {
      const response = await api.patch(`/bookings/${id}/accept`);
      const updated = response.data.data.booking;
      setBookings(prev => prev.map(b => b._id === id ? { ...b, ...updated } : b));
    } catch (err) {
      alert(err.response?.data?.message || 'Accept failed');
    }
  };

  // Reject Booking
  const handleRejectBooking = async (id) => {
    if (!window.confirm('Reject this booking offer?')) return;
    try {
      await api.patch(`/bookings/${id}/reject`);
      // Remove or set status to Rejected
      setBookings(prev => prev.filter(b => b._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Reject failed');
    }
  };

  // Update Booking Job Status (On The Way -> Started -> Completed)
  const handleUpdateJobStatus = async (id, currentStatus) => {
    let nextStatus = '';
    if (currentStatus === 'Accepted') nextStatus = 'On The Way';
    else if (currentStatus === 'On The Way') nextStatus = 'Started';
    else if (currentStatus === 'Started') nextStatus = 'Completed';

    if (!nextStatus) return;

    try {
      const response = await api.patch(`/bookings/${id}/status`, { status: nextStatus });
      const updated = response.data.data.booking;
      setBookings(prev => prev.map(b => b._id === id ? { ...b, ...updated } : b));
    } catch (err) {
      alert(err.response?.data?.message || 'Status transition failed');
    }
  };

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

  // Calculations
  const completedBookings = bookings.filter(b => b.status === 'Completed');
  const pendingOffers = bookings.filter(b => b.status === 'Assigned');
  const activeJobs = bookings.filter(b => ['Accepted', 'On The Way', 'Started'].includes(b.status));
  const totalEarnings = completedBookings.reduce((sum, b) => sum + b.price, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* SIDE BAR NAVIGATION */}
        <aside className="w-full md:w-60 bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="px-3 py-2 border-b border-dark-100 dark:border-dark-800 mb-4">
            <h2 className="font-bold text-dark-900 dark:text-white text-base truncate">{user?.name}</h2>
            <span className="text-2xs font-semibold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 mt-1 inline-block uppercase">Provider</span>
          </div>

          {[
            { id: 'overview', label: 'Dashboard', icon: Calendar },
            { id: 'bookings', label: 'Job History', icon: CheckCircle },
            { id: 'profile', label: 'Availability & Hours', icon: Clock },
            { id: 'documents', label: 'Credentials & ID', icon: FileText }
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

        {/* CONTENT PANEL */}
        <main className="flex-grow w-full space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick stats grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                {[
                  { label: 'Completed Jobs', value: completedBookings.length, icon: CheckCircle, color: 'text-green-500 bg-green-500/10' },
                  { label: 'Net Earnings', value: `₹${totalEarnings}`, icon: DollarSign, color: 'text-brand-500 bg-brand-500/10' },
                  { label: 'Active Jobs', value: activeJobs.length, icon: Clock, color: 'text-purple-500 bg-purple-500/10' },
                  { label: 'Rating Stars', value: `${profile?.rating || '5.0'}★`, icon: Star, color: 'text-yellow-500 bg-yellow-500/10' }
                ].map((stat, idx) => (
                  <div key={idx} className="p-5 bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl shadow-sm flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color} flex-shrink-0`}>
                      <stat.icon size={20} />
                    </div>
                    <div>
                      <span className="text-3xs font-medium uppercase tracking-wider text-dark-450 dark:text-dark-500 block">{stat.label}</span>
                      <p className="text-xl font-extrabold text-dark-900 dark:text-white mt-0.5">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Onboarding Verification Status Alert */}
              {profile?.status === 'pending' && (
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-2xl">
                  <ShieldAlert className="flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold">Profile Verification Pending</p>
                    <p className="font-light mt-0.5">Your profile is currently waiting for administrator verification. You can toggle availability, configure working hours, and upload credential certificates, but you will not receive job matches until approved.</p>
                  </div>
                </div>
              )}

              {/* Availability Fast Toggle */}
              <div className="p-6 bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-bold text-dark-900 dark:text-white">Duty Status</h3>
                  <p className="text-xs font-light text-dark-500 dark:text-dark-400 mt-0.5">Control whether you are currently active and available to accept job bookings.</p>
                </div>
                <button
                  onClick={handleToggleAvailability}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    profile?.isAvailable ? 'bg-brand-500' : 'bg-dark-200 dark:bg-dark-750'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profile?.isAvailable ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Pending Job Offers (Accept/Reject) */}
              {pendingOffers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-dark-900 dark:text-white flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2 animate-ping" /> Pending Job Offers
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingOffers.map((offer) => (
                      <div key={offer._id} className="p-5 bg-white dark:bg-dark-850 border border-yellow-500/20 rounded-2xl shadow-premium space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-2xs font-semibold text-brand-500 block">{offer.service?.name}</span>
                            <span className="text-xs text-dark-500 font-light block mt-0.5">Date: {new Date(offer.scheduleDate).toLocaleDateString()} @ {offer.scheduleTime}</span>
                          </div>
                          <span className="text-base font-extrabold text-dark-900 dark:text-white">₹{offer.price}</span>
                        </div>
                        <div className="flex space-x-2 border-t border-dark-100 dark:border-dark-800 pt-3">
                          <button
                            onClick={() => handleAcceptBooking(offer._id)}
                            className="flex-1 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/10"
                          >
                            Accept Offer
                          </button>
                          <button
                            onClick={() => handleRejectBooking(offer._id)}
                            className="flex-1 py-2 bg-dark-100 dark:bg-dark-800 text-dark-700 dark:text-dark-300 rounded-lg text-xs font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Jobs Tracking Panel */}
              <div className="bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-dark-900 dark:text-white">Active Assignments</h3>
                {activeJobs.length === 0 ? (
                  <p className="text-xs text-dark-500 font-light py-4 text-center">No active jobs in progress. Set status to available to receive bookings.</p>
                ) : (
                  <div className="space-y-4 divide-y divide-dark-150 dark:divide-dark-800">
                    {activeJobs.map((job) => (
                      <div key={job._id} className="pt-4 first:pt-0 flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-dark-900 dark:text-white">{job.service?.name}</h4>
                            <span className={`px-2 py-0.5 text-3xs font-bold border rounded uppercase tracking-wider ${getStatusBadgeClass(job.status)}`}>
                              {job.status}
                            </span>
                          </div>
                          <p className="text-dark-500 font-light block">Client: {job.customer?.name} ({job.customer?.email})</p>
                          {job.address && (
                            <p className="text-dark-500 font-light block">Location: {job.address.streetAddress}, {job.address.city}</p>
                          )}
                          <p className="text-dark-500 font-light block">Scheduled: {new Date(job.scheduleDate).toLocaleDateString()} @ {job.scheduleTime}</p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className="text-base font-extrabold text-dark-900 dark:text-white">₹{job.price}</span>
                          <button
                            onClick={() => handleUpdateJobStatus(job._id, job.status)}
                            className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-500 hover:opacity-95 text-white font-semibold text-xs rounded-xl shadow-md"
                          >
                            {job.status === 'Accepted' && 'Mark On The Way'}
                            {job.status === 'On The Way' && 'Start Service'}
                            {job.status === 'Started' && 'Complete & Capture'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: JOB HISTORY */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-dark-900 dark:text-white">Completed Jobs History</h3>
              {completedBookings.length === 0 ? (
                <p className="text-sm text-dark-500 font-light text-center py-12 bg-white dark:bg-dark-850 rounded-2xl border">
                  No completed jobs in history.
                </p>
              ) : (
                <div className="space-y-4">
                  {completedBookings.map((b) => (
                    <div
                      key={b._id}
                      className="p-6 bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4"
                    >
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-bold text-dark-900 dark:text-white">{b.service?.name}</h4>
                          <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded text-3xs font-bold uppercase tracking-wider">Completed</span>
                        </div>
                        <p className="text-dark-500 font-light">Client: {b.customer?.name}</p>
                        <p className="text-dark-500 font-light">Scheduled: {new Date(b.scheduleDate).toLocaleDateString()} @ {b.scheduleTime}</p>
                        {b.address && <p className="text-dark-500 font-light">Location: {b.address.streetAddress}, {b.address.city}</p>}
                      </div>
                      <div className="flex items-center space-x-3 self-end md:self-center">
                        <span className="text-lg font-extrabold text-dark-900 dark:text-white">₹{b.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFILE & WORKING HOURS */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-dark-900 dark:text-white">On-Duty Configuration</h3>

              {profileMessage && (
                <div className="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/30 text-brand-600 dark:text-brand-350 text-xs font-semibold">
                  {profileMessage}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Primary Service Category</label>
                  <input
                    type="text"
                    disabled
                    value={profile?.category?.name || 'Loading...'}
                    className="w-full p-2.5 bg-dark-100 dark:bg-dark-800 border border-dark-200 dark:border-dark-750 text-dark-500 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="exp" className="text-xs font-bold text-dark-600 dark:text-dark-400">Years of Experience</label>
                    <input
                      id="exp"
                      type="number"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Duty Toggle</label>
                    <input
                      type="text"
                      disabled
                      value={profile?.isAvailable ? 'Available for Bookings' : 'Offline / Busy'}
                      className="w-full p-2.5 bg-dark-100 dark:bg-dark-800 border border-dark-200 dark:border-dark-750 text-dark-500 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-dark-100 dark:border-dark-800 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Shift Start Time</label>
                    <select
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none"
                    >
                      {['07:00', '08:00', '09:00', '10:00', '11:00'].map(h => <option key={h} value={h} className="bg-white dark:bg-dark-800 text-dark-900 dark:text-white">{h}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Shift End Time</label>
                    <select
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none"
                    >
                      {['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map(h => <option key={h} value={h} className="bg-white dark:bg-dark-800 text-dark-900 dark:text-white">{h}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bio" className="text-xs font-bold text-dark-600 dark:text-dark-400">Public Bio Description</label>
                  <textarea
                    id="bio"
                    rows="4"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-3 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="Describe your quality standard, tools, and background..."
                  />
                </div>

                <button
                  type="submit"
                  className="bg-brand-500 text-white rounded-lg px-5 py-2.5 text-xs font-semibold shadow-md"
                >
                  Save Profile Settings
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: DOCUMENTS & CERTIFICATION */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-xl font-bold text-dark-900 dark:text-white">Credentials & Certificates</h3>
                
                {docMessage && (
                  <div className="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/30 text-brand-600 dark:text-brand-350 text-xs font-semibold">
                    {docMessage}
                  </div>
                )}

                <form onSubmit={handleUploadDocument} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Credential Type</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none"
                      >
                        <option value="certificate" className="bg-white dark:bg-dark-800 text-dark-900 dark:text-white">Certification (e.g. Electrician License)</option>
                        <option value="identity_proof" className="bg-white dark:bg-dark-800 text-dark-900 dark:text-white">Identity Proof (Aadhaar / Passport / ID)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Document Name</label>
                      <input
                        type="text"
                        placeholder="Government ID Card"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Document URL link</label>
                    <input
                      type="url"
                      placeholder="https://cloudinary-uploads.com/doc.pdf"
                      value={docUrl}
                      onChange={(e) => setDocUrl(e.target.value)}
                      className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      required
                    />
                    <span className="text-3xs text-dark-400 block font-light leading-normal">
                      Provide a file URL link. In production, this integrates with Cloudinary storage APIs.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="bg-brand-500 text-white rounded-lg px-5 py-2.5 text-xs font-semibold shadow-md"
                  >
                    Submit Document
                  </button>
                </form>
              </div>

              {/* Uploaded Documents List */}
              <div className="bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-dark-900 dark:text-white text-sm">Submitted Documents Verification Logs</h4>
                {(!profile || !profile.documents || profile.documents.length === 0) ? (
                  <p className="text-xs text-dark-500 font-light py-4 text-center">No credentials submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {profile.documents.map((doc) => (
                      <div key={doc._id} className="p-4 bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-750 rounded-xl flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-dark-900 dark:text-white block">{doc.name}</span>
                          <a href={doc.url} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline text-3xs font-semibold block">View Document File</a>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-3xs text-dark-400 font-bold uppercase mr-1">{doc.type.replace('_', ' ')}</span>
                          <span className={`px-2 py-0.5 rounded text-3xs font-semibold border uppercase ${
                            doc.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            doc.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
