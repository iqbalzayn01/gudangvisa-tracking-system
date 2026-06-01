import apiClient from './client';
import type {
  ApiResponse,
  ApplicationDocument,
  AddDocumentPayload,
  UploadUrlPayload,
  UploadUrlResponse,
} from '../types';

export async function getUploadUrl(payload: UploadUrlPayload): Promise<UploadUrlResponse> {
  const { data } = await apiClient.post<ApiResponse<any>>(
    '/documents/upload-url',
    payload,
  );
  return data.data;
}

export async function uploadFileToStorage(signedUrl: string, file: File): Promise<void> {
  await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
}

export async function addDocument(payload: AddDocumentPayload): Promise<ApplicationDocument> {
  const { data } = await apiClient.post<ApiResponse<any>>('/documents', {
    applicationId: payload.applicationId,
    documentType: payload.docType === 'PASSPORT' ? 'passport' : 'other', // fallback map
    fileName: payload.docName,
    filePath: payload.storagePath,
  });
  return {
    id: data.data.id,
    applicationId: data.data.applicationId,
    docName: data.data.fileName,
    docType: payload.docType,
    status: 'IN_REVIEW',
    fileUrl: data.data.filePath,
    isPublic: payload.isPublic ?? true,
    createdAt: data.data.createdAt,
    fileDownloadUrl: data.data.filePath
  };
}

export async function getDocumentsByApplication(applicationId: string): Promise<ApplicationDocument[]> {
  const { data } = await apiClient.get<ApiResponse<any[]>>(
    `/documents/application/${applicationId}`,
  );
  return data.data.map((d: any) => ({
    id: d.id,
    applicationId: d.applicationId,
    docName: d.fileName,
    docType: 'VISA',
    status: d.status === 'pending' ? 'IN_REVIEW' : d.status === 'verified' ? 'APPROVED' : 'REJECTED',
    fileUrl: d.filePath,
    isPublic: true,
    createdAt: d.createdAt,
    fileDownloadUrl: d.filePath
  }));
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}`);
}
