import apiClient from './client';
import type {
  ApiResponse,
  ApplicationDocument,
  AddDocumentPayload,
  ExpiringDocument,
  UploadUrlPayload,
  UploadUrlResponse,
  VerifyDocumentPayload,
} from '../types';
import { mapDoc } from './applications.api';

export async function getUploadUrl(
  payload: UploadUrlPayload,
): Promise<UploadUrlResponse> {
  const { data } = await apiClient.post<ApiResponse<any>>(
    '/documents/upload-url',
    payload,
  );
  return data.data;
}

export async function uploadFileToStorage(
  signedUrl: string,
  file: File,
): Promise<void> {
  await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
}

export async function addDocument(
  payload: AddDocumentPayload,
): Promise<ApplicationDocument> {
  const { data } = await apiClient.post<ApiResponse<any>>('/documents', {
    applicationId: payload.applicationId,
    documentType: payload.documentType,
    fileName: payload.docName,
    storagePath: payload.storagePath,
    issuedDate: payload.issuedDate,
    expiryDate: payload.expiryDate,
  });
  return {
    ...mapDoc(data.data),
    isPublic: payload.isPublic ?? false,
  };
}

export async function getDocumentsByApplication(
  applicationId: string,
): Promise<ApplicationDocument[]> {
  const { data } = await apiClient.get<ApiResponse<any[]>>(
    `/documents/application/${applicationId}`,
  );
  return data.data.map(mapDoc);
}

export async function verifyDocument(
  id: string,
  payload: VerifyDocumentPayload,
): Promise<ApplicationDocument> {
  const { data } = await apiClient.patch<ApiResponse<any>>(
    `/documents/${id}/verify`,
    payload,
  );
  return mapDoc(data.data);
}

/** Documents expiring within `days` (or already expired) for the dashboard. */
export async function getExpiringDocuments(
  days = 30,
): Promise<ExpiringDocument[]> {
  const { data } = await apiClient.get<ApiResponse<any[]>>(
    `/documents/expiring?days=${days}`,
  );
  return (data.data ?? []).map((d: any) => ({
    id: d.id,
    documentType: d.documentType,
    fileName: d.fileName,
    issuedDate: d.issuedDate ?? null,
    expiryDate: d.expiryDate ?? null,
    application: d.application
      ? {
          id: d.application.id,
          referenceNumber: d.application.referenceNumber,
          visaType: d.application.visaType,
          client: d.application.client
            ? {
                id: d.application.client.id,
                fullName: d.application.client.fullName,
              }
            : undefined,
        }
      : undefined,
  }));
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}`);
}
