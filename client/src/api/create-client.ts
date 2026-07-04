import axios, { type AxiosInstance } from 'axios';
import type { ApiResponse } from '../types';
import { syncToken } from './token-sync';

const API_BASE_URL =
  import.meta.env.VITE_BASE_URL || 'http://localhost:8000/api';

export interface ApiClientOptions {
  /** localStorage key holding the access token. */
  tokenKey: string;
  /** localStorage key holding the cached user object (cleared on hard logout). */
  userKey: string;
  /** Refresh endpoint path relative to the API base, e.g. `/auth/internal/refresh`. */
  refreshPath: string;
  /** Where to send the browser when a refresh ultimately fails. */
  loginRedirect: string;
  /** Redirect to `loginRedirect` only when this returns true for the current path. */
  shouldRedirect?: (pathname: string) => boolean;
}

/**
 * Build an axios instance for one auth domain (staff or client). Both sessions
 * share identical plumbing — bearer-token injection, a 401 → refresh → retry
 * interceptor, and error-message normalization — so the only per-session inputs
 * are the storage keys, the refresh path, and the login redirect.
 */
export function createApiClient(opts: ApiClientOptions): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // required for the httpOnly refresh cookie
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 15_000,
  });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem(opts.tokenKey);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Single-flight refresh: concurrent 401s share ONE refresh request. Without
  // this, N in-flight requests each POST the refresh endpoint and — with
  // server-side refresh-token rotation — invalidate each other, forcing a
  // spurious logout.
  let refreshPromise: Promise<string> | null = null;

  function refreshAccessToken(): Promise<string> {
    if (!refreshPromise) {
      refreshPromise = axios
        .post<ApiResponse<{ accessToken: string }>>(
          `${API_BASE_URL}${opts.refreshPath}`,
          {},
          { withCredentials: true },
        )
        .then((res) => {
          const newToken = res.data.data?.accessToken;
          if (!newToken) throw new Error('No access token in refresh response');
          localStorage.setItem(opts.tokenKey, newToken);
          instance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          syncToken(opts.tokenKey, newToken); // keep the Pinia store in sync
          return newToken;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }
    return refreshPromise;
  }

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;
        try {
          const newToken = await refreshAccessToken();
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return instance(originalRequest);
        } catch {
          localStorage.removeItem(opts.tokenKey);
          localStorage.removeItem(opts.userKey);
          const shouldRedirect = opts.shouldRedirect ?? (() => true);
          if (shouldRedirect(window.location.pathname)) {
            window.location.href = opts.loginRedirect;
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

  return instance;
}
