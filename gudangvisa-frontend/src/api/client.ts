import axios from 'axios';
import type { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Pre-configured Axios instance for all API calls.
 *
 * - Automatically attaches the JWT token from localStorage.
 * - Redirects to /login on 401 (expired / missing token).
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15_000,
});

// ── Request Interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Response Interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      if (
        !window.location.pathname.startsWith('/tracking') &&
        !window.location.pathname.startsWith('/login')
      ) {
        window.location.href = '/login';
      }
    }

    const message: string =
      (error.response?.data as ApiResponse)?.message ??
      error.message ??
      'An unexpected error occurred';

    return Promise.reject(new Error(message));
  },
);

export default apiClient;
