import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hcm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error mapping
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If token expired or invalid (401), clear and notify unless it's login/setup
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isSetupRequest = error.config?.url?.includes('/setup/status');

      if (!isLoginRequest && !isSetupRequest) {
        localStorage.removeItem('hcm_token');
        localStorage.removeItem('hcm_user');
        window.dispatchEvent(new CustomEvent('hcm_auth_expired'));
      }
    }

    const customError = {
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'An unexpected error occurred. Please try again.',
      errors: error.response?.data?.errors || [],
      raw: error,
    };

    return Promise.reject(customError);
  }
);

export default apiClient;
