import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campus_hub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && localStorage.getItem('campus_hub_token')) {
      localStorage.removeItem('campus_hub_token');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'Request timed out. Please try again.'
        : error.message === 'Network Error'
        ? 'Cannot reach the server. Verify the backend is running on port 5000.'
        : 'An unexpected error occurred.');

    return Promise.reject({
      status,
      message,
      errors: error.response?.data?.errors || null
    });
  }
);

export default axiosClient;
