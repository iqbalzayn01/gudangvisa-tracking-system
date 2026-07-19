import axios from 'axios';
import type { ApiResponse, Application } from '../types';
import { mapApplication } from './applications.api';

const API_BASE_URL =
  import.meta.env.VITE_BASE_URL || 'http://localhost:8000/api';

/**
 * Bare axios instance for the public, no-auth resi-tracking endpoints.
 * No token injection, no refresh interceptor — these routes never require a
 * session — just the same error-message normalization the other API layers use.
 */
const trackingApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15_000,
});

trackingApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message: string =
      (error.response?.data as ApiResponse)?.message ??
      error.message ??
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  },
);

/** Look up an application's public status/timeline by its reference number ("nomor resi"). */
export async function trackByReference(
  referenceNumber: string,
): Promise<Application> {
  const { data } = await trackingApi.get<ApiResponse<any>>(
    `/applications/track/${encodeURIComponent(referenceNumber)}`,
  );
  return mapApplication(data.data);
}

/**
 * Request a temporary signed download URL for a verified document, once the
 * application is completed. Returns the URL the browser can open to download.
 */
export async function getPublicDownloadUrl(
  referenceNumber: string,
  documentId: string,
): Promise<string> {
  const { data } = await trackingApi.get<ApiResponse<any>>(
    `/documents/track/${encodeURIComponent(referenceNumber)}/documents/${documentId}/download`,
  );
  return data.data.downloadUrl;
}
