import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute, RoleRoute } from './components/AuthGuards';

// Page Components
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import CustomerDashboard from './pages/CustomerDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen flex flex-col bg-dark-50 dark:bg-dark-900 text-dark-800 dark:text-dark-100 transition-colors duration-300">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:id" element={<ServiceDetail />} />

                {/* Customer Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<RoleRoute allowedRoles={['customer']} />}>
                    <Route path="/customer" element={<CustomerDashboard />} />
                  </Route>
                </Route>

                {/* Provider Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<RoleRoute allowedRoles={['provider']} />}>
                    <Route path="/provider" element={<ProviderDashboard />} />
                  </Route>
                </Route>

                {/* Admin Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<RoleRoute allowedRoles={['admin']} />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                  </Route>
                </Route>

                {/* Catch-all Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
