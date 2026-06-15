import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAccessToken, getAccessToken } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authenticate user check on initial render
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Attempt to refresh token to get a new access token
      const response = await api.post('/auth/refresh');
      const { token, data } = response.data;
      
      setAccessToken(token);
      setUser(data.user);
    } catch (err) {
      setUser(null);
      setAccessToken('');
      // Non-blocking catch: user is simply not logged in
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // Listen for axios authentication expiration event
    const handleAuthExpired = () => {
      setUser(null);
      setAccessToken('');
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      const { token, data } = response.data;
      
      setAccessToken(token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (signupData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.post('/auth/signup', signupData);
      const { token, data } = response.data;
      
      setAccessToken(token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setAccessToken('');
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    signup,
    logout,
    clearError,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
