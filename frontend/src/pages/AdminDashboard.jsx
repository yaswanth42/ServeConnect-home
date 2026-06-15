import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Users, DollarSign, ShieldAlert, CheckCircle, XCircle, PlusCircle, AlertCircle, FileText, Settings, Award } from 'lucide-react';
import api from '../api/axios';

export default function AdminDashboard() {
  const { user } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState('overview'); // overview, providers, users, services

  // Data States
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalProviders: 0,
    totalBookings: 0,
    revenue: 0,
    completedJobs: 0,
    cancelledJobs: 0,
    pendingJobs: 0
  });
  const [usersList, setUsersList] = useState([]);
  const [providersList, setProvidersList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Service Creation Form States
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [serviceMessage, setServiceMessage] = useState('');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await api.get('/admin/stats');
      if (statsRes.data && statsRes.data.data.stats) {
        setStats(statsRes.data.data.stats);
      }

      // Fetch users
      const usersRes = await api.get('/admin/users');
      const allUsers = usersRes.data.data.users || [];
      setUsersList(allUsers);
      
      // Filter out providers for separate verification panel
      const providers = allUsers.filter(u => u.role === 'provider' && u.providerProfile);
      setProvidersList(providers);

      // Fetch services & categories
      const catRes = await api.get('/services/categories');
      setCategories(catRes.data.data.categories || []);
      if (catRes.data.data.categories?.length > 0) {
        setNewServiceCategory(catRes.data.data.categories[0]._id);
      }

      const srvRes = await api.get('/services');
      setServicesList(srvRes.data.data.services || []);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Verify Provider
  const handleVerifyProvider = async (profileId, status) => {
    try {
      const response = await api.patch(`/admin/providers/${profileId}/verify`, { status });
      const updatedProfile = response.data.data.profile;

      // Update provider status locally
      setProvidersList(prev => 
        prev.map(p => 
          p.providerProfile._id === profileId 
            ? { ...p, providerProfile: { ...p.providerProfile, status: updatedProfile.status } } 
            : p
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  // Suspend/Activate User
  const handleToggleSuspendUser = async (userId) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/suspend`);
      const updatedUser = response.data.data.user;

      setUsersList(prev => 
        prev.map(u => u._id === userId ? { ...u, isActive: updatedUser.isActive } : u)
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  // Create Service
  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!newServiceName || !newServiceDesc || !newServicePrice || !newServiceDuration || !newServiceCategory) return;

    try {
      setServiceMessage('');
      const response = await api.post('/services', {
        name: newServiceName,
        description: newServiceDesc,
        price: Number(newServicePrice),
        duration: Number(newServiceDuration),
        category: newServiceCategory
      });
      setServicesList(prev => [response.data.data.service, ...prev]);
      setServiceMessage('Service successfully created!');
      setNewServiceName('');
      setNewServiceDesc('');
      setNewServicePrice('');
      setNewServiceDuration('');
      setTimeout(() => setServiceMessage(''), 3000);
      setShowServiceForm(false);
    } catch (err) {
      setServiceMessage('Failed to create service.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* SIDE BAR NAVIGATION */}
        <aside className="w-full md:w-60 bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="px-3 py-2 border-b border-dark-100 dark:border-dark-800 mb-4">
            <h2 className="font-bold text-dark-900 dark:text-white text-base truncate">{user?.name}</h2>
            <span className="text-2xs font-semibold text-red-600 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 mt-1 inline-block uppercase">Administrator</span>
          </div>

          {[
            { id: 'overview', label: 'Overview Metrics', icon: Calendar },
            { id: 'providers', label: 'Verify Providers', icon: Award },
            { id: 'users', label: 'User Controls', icon: Users },
            { id: 'services', label: 'Service Catalog', icon: Settings }
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
          {/* TAB 1: OVERVIEW METRICS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                {[
                  { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-brand-500 bg-brand-500/10' },
                  { label: 'Total Appointments', value: stats.totalBookings, icon: Calendar, color: 'text-blue-500 bg-blue-500/10' },
                  { label: 'Completed Jobs', value: stats.completedJobs, icon: CheckCircle, color: 'text-green-500 bg-green-500/10' },
                  { label: 'Marketplace Revenue', value: `₹${stats.revenue}`, icon: DollarSign, color: 'text-yellow-500 bg-yellow-500/10' }
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

              {/* Status Breakdowns panel */}
              <div className="bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-dark-900 dark:text-white">Active Jobs Breakdown</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-xl border">
                    <span className="text-xs text-dark-550 block">Pending / Assigned</span>
                    <span className="text-2xl font-extrabold text-yellow-500 mt-1 block">{stats.pendingJobs}</span>
                  </div>
                  <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-xl border">
                    <span className="text-xs text-dark-550 block">Completed Jobs</span>
                    <span className="text-2xl font-extrabold text-green-500 mt-1 block">{stats.completedJobs}</span>
                  </div>
                  <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-xl border">
                    <span className="text-xs text-dark-550 block">Cancelled Jobs</span>
                    <span className="text-2xl font-extrabold text-red-500 mt-1 block">{stats.cancelledJobs}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VERIFY PROVIDERS */}
          {activeTab === 'providers' && (
            <div className="bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-dark-900 dark:text-white">Provider Verification Audits</h3>
              
              {providersList.length === 0 ? (
                <p className="text-xs text-dark-500 font-light py-4 text-center">No providers onboarded in the system.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-dark-100 dark:border-dark-850 text-dark-450 uppercase font-semibold">
                        <th className="py-3 px-4">Provider</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Experience</th>
                        <th className="py-3 px-4">Documents</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-100 dark:divide-dark-800">
                      {providersList.map((p) => (
                        <tr key={p._id} className="hover:bg-dark-50/50 dark:hover:bg-dark-800/20">
                          <td className="py-3 px-4 font-bold text-dark-900 dark:text-white">{p.name}</td>
                          <td className="py-3 px-4 font-light">{p.providerProfile?.category?.name || 'AC Repair'}</td>
                          <td className="py-3 px-4 font-light">{p.providerProfile?.experience || 0} years</td>
                          <td className="py-3 px-4">
                            {p.providerProfile?.documents?.length > 0 ? (
                              <a
                                href={p.providerProfile.documents[0].url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-500 hover:underline font-semibold block"
                              >
                                View Doc ({p.providerProfile.documents[0].name})
                              </a>
                            ) : (
                              <span className="text-dark-400 font-light">None Uploaded</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded border text-3xs font-semibold uppercase ${
                              p.providerProfile?.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              p.providerProfile?.status === 'suspended' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            }`}>
                              {p.providerProfile?.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {p.providerProfile?.status !== 'approved' && (
                              <button
                                onClick={() => handleVerifyProvider(p.providerProfile._id, 'approved')}
                                className="bg-green-500 text-white font-bold px-2 py-1 rounded text-3xs shadow-sm hover:opacity-90"
                              >
                                Verify / Approve
                              </button>
                            )}
                            {p.providerProfile?.status !== 'suspended' && (
                              <button
                                onClick={() => handleVerifyProvider(p.providerProfile._id, 'suspended')}
                                className="bg-red-50 text-red-500 border border-red-200 font-semibold px-2 py-1 rounded text-3xs hover:bg-red-100"
                              >
                                Suspend
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: USER CONTROLS */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-dark-900 dark:text-white">User Control Center</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-dark-100 dark:border-dark-850 text-dark-450 uppercase font-semibold">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100 dark:divide-dark-800">
                    {usersList.map((u) => (
                      <tr key={u._id} className="hover:bg-dark-50/50 dark:hover:bg-dark-800/20">
                        <td className="py-3 px-4 font-bold text-dark-900 dark:text-white">{u.name}</td>
                        <td className="py-3 px-4 font-light">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded border text-3xs font-semibold uppercase ${
                            u.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            u.role === 'provider' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                            'bg-brand-500/10 text-brand-500 border-brand-500/20'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded border text-3xs font-semibold uppercase ${
                            u.isActive !== false ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {u.isActive !== false ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleSuspendUser(u._id)}
                              className={`font-bold px-2 py-1 rounded text-3xs ${
                                u.isActive !== false
                                  ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                                  : 'bg-green-500 text-white shadow-sm hover:opacity-90'
                              }`}
                            >
                              {u.isActive !== false ? 'Suspend User' : 'Activate User'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SERVICE CATALOG */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 shadow-sm">
                <div>
                  <h3 className="font-bold text-dark-900 dark:text-white">Marketplace Services</h3>
                  <p className="text-xs font-light text-dark-500 dark:text-dark-400 mt-0.5">Manage domestic service tasks, hourly values, and default durations.</p>
                </div>
                <button
                  onClick={() => setShowServiceForm(!showServiceForm)}
                  className="flex items-center text-xs font-bold text-brand-500 hover:text-brand-600"
                >
                  <PlusCircle size={14} className="mr-1" /> Add Service
                </button>
              </div>

              {showServiceForm && (
                <form onSubmit={handleCreateService} className="p-6 bg-white dark:bg-dark-850 border border-brand-500/20 shadow-premium rounded-2xl space-y-4">
                  <h4 className="font-bold text-dark-900 dark:text-white text-sm">Create New Catalog Service</h4>
                  {serviceMessage && (
                    <div className="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/30 text-brand-600 dark:text-brand-350 text-xs font-semibold">
                      {serviceMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Service Title</label>
                      <input
                        type="text"
                        placeholder="Ceiling Fan Repair"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Service Category</label>
                      <select
                        value={newServiceCategory}
                        onChange={(e) => setNewServiceCategory(e.target.value)}
                        className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none"
                      >
                        {categories.map((c) => <option key={c._id} value={c._id} className="bg-white dark:bg-dark-800 text-dark-900 dark:text-white">{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Service Base Price (₹)</label>
                      <input
                        type="number"
                        placeholder="299"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Default Duration (minutes)</label>
                      <input
                        type="number"
                        placeholder="45"
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(e.target.value)}
                        className="w-full p-2.5 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-dark-600 dark:text-dark-400">Description</label>
                    <textarea
                      rows="3"
                      placeholder="Specify task inclusion details..."
                      value={newServiceDesc}
                      onChange={(e) => setNewServiceDesc(e.target.value)}
                      className="w-full p-3 border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-850 rounded-xl text-xs text-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      required
                    />
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button type="submit" className="bg-brand-500 text-white rounded-lg px-4 py-2 text-xs font-semibold">Create Service</button>
                    <button type="button" onClick={() => setShowServiceForm(false)} className="bg-dark-200 dark:bg-dark-700 rounded-lg px-4 py-2 text-xs font-semibold">Cancel</button>
                  </div>
                </form>
              )}

              {/* Service Table */}
              <div className="bg-white dark:bg-dark-850 border border-dark-200/50 dark:border-dark-800/50 rounded-2xl p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-dark-100 dark:border-dark-850 text-dark-450 uppercase font-semibold">
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100 dark:divide-dark-800">
                    {servicesList.map((srv) => (
                      <tr key={srv._id} className="hover:bg-dark-50/50 dark:hover:bg-dark-800/20">
                        <td className="py-3 px-4 font-bold text-dark-900 dark:text-white">{srv.name}</td>
                        <td className="py-3 px-4 font-light">{srv.category?.name || 'General'}</td>
                        <td className="py-3 px-4 font-extrabold text-dark-800 dark:text-white">₹{srv.price}</td>
                        <td className="py-3 px-4 font-light">{srv.duration} mins</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
