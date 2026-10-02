import axios from 'axios';

const api = axios.create({
  // Hard-coded to exactly 8001 to resolve Vite Environment Variable caching without requiring a complete server restart
  baseURL: 'https://du1y1zjjif5t6.cloudfront.net/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
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
      console.warn('Unauthorized - clearing this tab session and redirecting to login');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('outletId');
      sessionStorage.removeItem('outletName');
      sessionStorage.removeItem('empId');
      sessionStorage.removeItem('empName');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
