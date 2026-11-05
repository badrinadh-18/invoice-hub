import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('invoicehub_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('invoicehub_token'));
  const [loading, setLoading] = useState(true);

  // Verify auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('invoicehub_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('invoicehub_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn('Auth session invalid or expired:', err.response?.data?.error?.message);
        localStorage.removeItem('invoicehub_token');
        localStorage.removeItem('invoicehub_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: userData, token: jwtToken } = res.data;

      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('invoicehub_user', JSON.stringify(userData));
      localStorage.setItem('invoicehub_token', jwtToken);

      toast.success(`Welcome back, ${userData.name}!`);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please check credentials.';
      toast.error(msg);
      throw err;
    }
  };

  const register = async ({ name, email, password, confirmPassword }) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, confirmPassword });
      const { user: userData, token: jwtToken } = res.data;

      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('invoicehub_user', JSON.stringify(userData));
      localStorage.setItem('invoicehub_token', jwtToken);

      toast.success(`Account created successfully! Welcome to InvoiceHub.`);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed. Please check input.';
      toast.error(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('invoicehub_token');
      localStorage.removeItem('invoicehub_user');
      setUser(null);
      setToken(null);
      toast.success('Logged out successfully.');
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('invoicehub_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    refreshUser
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
