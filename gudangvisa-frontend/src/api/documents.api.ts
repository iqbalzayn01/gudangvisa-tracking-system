import apiClient from './client';
import type {
  ApiResponse,
  TicketDocument,
  AddDocumentPayload,
  UploadUrlPayload,
  UploadUrlResponse,
} from '../types';

/**
 * Step 1 — Request a signed upload URL from the backend.
 */
export async function getUploadUrl(payload: UploadUrlPayload): Promise<UploadUrlResponse> {
  const { data } = await apiClient.post<ApiResponse<UploadUrlResponse>>(
    '/documents/upload-url',
    payload,
  );
  return data.data;
}

/**
 * Step 2 — Upload the file directly to Supabase Storage using the signed URL.
 * This request bypasses the API server entirely.
 */
export async function uploadFileToStorage(signedUrl: string, file: File): Promise<void> {
  await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
}

/**
 * Step 3 — Attach a document record to a ticket.
 */
export async function addDocument(payload: AddDocumentPayload): Promise<TicketDocument> {
  const { data } = await apiClient.post<ApiResponse<TicketDocument>>('/documents', payload);
  return data.data;
}

/**
 * Fetch all documents for a ticket (with signed download URLs).
 */
export async function getDocumentsByTicket(ticketId: string): Promise<TicketDocument[]> {
  const { data } = await apiClient.get<ApiResponse<TicketDocument[]>>(
    `/documents/ticket/${ticketId}`,
  );
  return data.data;
}

/**
 * Delete a document (DB record + storage file). Admin only.
 */
export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}`);
}
