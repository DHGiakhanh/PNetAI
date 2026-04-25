import axios from 'axios';

const isLocalHost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

const defaultApiBaseUrl = isLocalHost ? 'http://localhost:9999' : '/api';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(/\/+$/, '');

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      if (config.headers && typeof (config.headers as any).set === 'function') {
        (config.headers as any).set('Content-Type', undefined);
      } else if (config.headers) {
        delete (config.headers as any)['Content-Type'];
      }
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      console.error("Access Forbidden: Redirecting to home.", error.response.data);
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
