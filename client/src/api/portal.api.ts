import clientApi from './portal.client';
import type { ApiResponse, Application } from '../types';
import { mapApplication } from './applications.api';

export interface ClientLoginResult {
  fullName: string;
  email: string;
  token: string;
}

/** Authenticate a client against the external login endpoint. */
export async function clientLogin(
  email: string,
  password: string,
): Promise<ClientLoginResult> {
  const { data } = await clientApi.post<ApiResponse<any>>(
    '/auth/client/login',
    { email, password },
  );
  return {
    fullName: data.data.user.fullName,
    email: data.data.user.email,
    token: data.data.accessToken,
  };
}

/** Clear the httpOnly client refresh cookie on the server. */
export async function clientLogout(): Promise<void> {
  try {
    await clientApi.post('/auth/client/logout');
  } catch {
    /* best-effort — local state is cleared regardless */
  }
}

/** Fetch the logged-in client's own applications (status, history, documents). */
export async function getMyApplications(): Promise<Application[]> {
  const { data } = await clientApi.get<ApiResponse<any[]>>(
    '/applications/client/my-applications',
  );
  return (data.data ?? []).map(mapApplication);
}

/**
 * Request a temporary signed download URL for a document the client owns.
 * Returns the URL the browser can open to download the file.
 */
export async function getDocumentDownloadUrl(
  documentId: string,
): Promise<string> {
  const { data } = await clientApi.get<ApiResponse<any>>(
    `/documents/client/${documentId}/download`,
  );
  return data.data.downloadUrl;
}
