import apiClient from './client';
import type {
  ApiResponse,
  ApplicationDocument,
  AddDocumentPayload,
  DocType,
  UploadUrlPayload,
  UploadUrlResponse,
} from '../types';

// The UI's document categories don't map 1:1 onto the server's documentType
// enum, so VISA/KITAS fall back to the closest valid value ('final_evisa').
const DOC_TYPE_TO_SERVER: Record<DocType, string> = {
  PASSPORT: 'passport',
  VISA: 'final_evisa',
  KITAS: 'final_evisa',
};

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
    documentType: DOC_TYPE_TO_SERVER[payload.docType],
    fileName: payload.docName,
    storagePath: payload.storagePath,
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
