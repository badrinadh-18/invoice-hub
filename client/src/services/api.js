import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('invoicehub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors uniformly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const code = error.response.data?.error?.code;
      if (code === 'INVALID_TOKEN' || code === 'UNAUTHORIZED') {
        localStorage.removeItem('invoicehub_token');
        localStorage.removeItem('invoicehub_user');
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register') && window.location.pathname !== '/') {
          window.location.href = '/login?expired=1';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
