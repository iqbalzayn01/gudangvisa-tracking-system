import apiClient from './client';
import type {
  ApiResponse,
  Application,
  ApplicationDocument,
  CreateApplicationPayload,
  UpdateStatusPayload,
  UpdateBiometricPayload,
  TrackingHistory,
} from '../types';
import { progressFromStatus } from '../utils/labels';

/** Map a backend document record to the frontend shape (1:1, no collapsing). */
export function mapDoc(d: any): ApplicationDocument {
  return {
    id: d.id,
    applicationId: d.applicationId,
    docName: d.fileName,
    documentType: d.documentType,
    status: d.status,
    rejectionReason: d.rejectionReason ?? null,
    issuedDate: d.issuedDate ?? null,
    expiryDate: d.expiryDate ?? null,
    verifiedAt: d.verifiedAt ?? null,
    fileUrl: d.filePath,
    isPublic: true,
    createdAt: d.createdAt,
    fileDownloadUrl: d.fileDownloadUrl ?? undefined,
  };
}

function mapHistory(h: any): TrackingHistory {
  // The backend stores one description + an `isVisibleToClient` flag. Internal
  // entries are surfaced (with a lock) to staff but hidden from clients.
  const visible = h.isVisibleToClient !== false;
  return {
    id: h.id,
    statusName: h.toStatus,
    descriptionPublic: visible ? h.description : '',
    descriptionInternal: visible ? null : h.description,
    updatedBy: h.changedByStaffId || '',
    createdAt: h.createdAt,
    updater: h.changedByStaff
      ? { id: h.changedByStaff.id, fullName: h.changedByStaff.fullName }
      : undefined,
  };
}

/** Map a backend application record to the frontend shape (1:1, no collapsing). */
export function mapApplication(backendData: any): Application {
  return {
    id: backendData.id,
    trackingCode: backendData.referenceNumber,
    clientId: backendData.clientId,
    visaType: backendData.visaType,
    currentStatus: backendData.status,
    priority: backendData.priority ?? 'medium',
    progress:
      typeof backendData.progressPercentage === 'number' &&
      backendData.progressPercentage > 0
        ? backendData.progressPercentage
        : progressFromStatus(backendData.status),
    notes: backendData.notes ?? null,
    checklist: Array.isArray(backendData.checklist)
      ? backendData.checklist
      : [],
    biometricStatus: backendData.biometricStatus ?? 'not_scheduled',
    biometricDate: backendData.biometricDate ?? null,
    biometricTime: backendData.biometricTime ?? null,
    biometricLocation: backendData.biometricLocation ?? null,
    fieldAssistantName: backendData.fieldAssistantName ?? null,
    fieldAssistantPhone: backendData.fieldAssistantPhone ?? null,
    handledBy: backendData.assignedStaffId || '',
    createdAt: backendData.createdAt,
    client: backendData.client
      ? {
          id: backendData.client.id,
          name: backendData.client.fullName,
          passportNumber: backendData.client.passportNumber,
          contactNumber: backendData.client.phone,
          nationality: backendData.client.nationality ?? null,
          createdBy: '',
          createdAt: backendData.client.createdAt,
        }
      : undefined,
    handler: backendData.assignedStaff
      ? {
          id: backendData.assignedStaff.id,
          fullName: backendData.assignedStaff.fullName,
          role: backendData.assignedStaff.role === 'admin' ? 'ADMIN' : 'STAFF',
        }
      : undefined,
    documents: (backendData.documents || []).map(mapDoc),
    histories: (backendData.trackingHistory || []).map(mapHistory),
  };
}

export async function createApplication(
  payload: CreateApplicationPayload,
): Promise<Application> {
  const { data } = await apiClient.post<ApiResponse<any>>('/applications', {
    clientId: payload.clientId,
    visaType: payload.visaType,
    priority: payload.priority ?? 'medium',
    notes: payload.notes,
  });
  return mapApplication(data.data);
}

export async function getAllApplications(): Promise<Application[]> {
  const { data } = await apiClient.get<ApiResponse<any[]>>('/applications');
  return data.data.map(mapApplication);
}

export async function getApplicationById(id: string): Promise<Application> {
  const { data } = await apiClient.get<ApiResponse<any>>(`/applications/${id}`);
  return mapApplication(data.data);
}

export async function updateApplicationStatus(
  id: string,
  payload: UpdateStatusPayload,
): Promise<Application> {
  const { data } = await apiClient.patch<ApiResponse<any>>(
    `/applications/${id}/status`,
    {
      status: payload.status,
      description: payload.descriptionPublic,
      isVisibleToClient: payload.isVisibleToClient ?? true,
    },
  );
  return mapApplication(data.data);
}

export async function updateBiometricSchedule(
  id: string,
  payload: UpdateBiometricPayload,
): Promise<Application> {
  const { data } = await apiClient.patch<ApiResponse<any>>(
    `/applications/${id}/biometric`,
    payload,
  );
  return mapApplication(data.data);
}

export async function toggleChecklistItem(
  id: string,
  itemIndex: number,
  isChecked: boolean,
): Promise<Application> {
  const { data } = await apiClient.patch<ApiResponse<any>>(
    `/applications/${id}/checklist`,
    { itemIndex, isChecked },
  );
  return mapApplication(data.data);
}

export async function deleteApplication(id: string): Promise<void> {
  await apiClient.delete(`/applications/${id}`);
}
