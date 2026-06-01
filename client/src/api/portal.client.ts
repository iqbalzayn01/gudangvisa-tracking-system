import axios from 'axios';
import type { ApiResponse } from '../types';

/**
 * Axios instance dedicated to the CLIENT tracking portal.
 *
 * Kept separate from the staff `apiClient` so the two sessions never collide:
 * it sends the client access token (`client_auth_token`) and refreshes via the
 * client refresh endpoint instead of the internal one.
 */
const API_BASE_URL =
  import.meta.env.VITE_BASE_URL || 'http://localhost:8000/api';

const clientApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // required for the httpOnly client refresh cookie
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15_000,
});

clientApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('client_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

clientApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/client/refresh`,
          {},
          { withCredentials: true },
        );
        const newToken = refreshResponse.data.data.accessToken;
        localStorage.setItem('client_auth_token', newToken);
        clientApi.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return clientApi(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('client_auth_token');
        localStorage.removeItem('client_auth_user');

        if (
          window.location.pathname.startsWith('/portal') &&
          window.location.pathname !== '/portal/login'
        ) {
          window.location.href = '/portal/login';
        }
      }
    }

    const message: string =
      (error.response?.data as ApiResponse)?.message ??
      error.message ??
      'An unexpected error occurred';

    return Promise.reject(new Error(message));
  },
);

export default clientApi;
