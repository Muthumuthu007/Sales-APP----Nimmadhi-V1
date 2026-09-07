import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isLoginRequest = error.config?.url?.replace(/\/$/, '') === '/login';

    if (error.response && error.response.status === 401 && !isLoginRequest) {
      console.warn('Unauthorized - clearing token and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('outletId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
