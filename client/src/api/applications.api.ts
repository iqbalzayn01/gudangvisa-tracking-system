import apiClient from './client';
import type {
  ApiResponse,
  Application,
  CreateApplicationPayload,
  UpdateStatusPayload,
} from '../types';

function mapStatus(bStatus: string): any {
  if (['draft', 'document_collection'].includes(bStatus)) return 'RECEIVED';
  if (['document_verification', 'document_revision'].includes(bStatus)) return 'IN_REVIEW';
  if (['submission_to_immigration', 'immigration_review', 'biometric_scheduled', 'biometric_completed', 'immigration_processing'].includes(bStatus)) return 'IN_PROCESS';
  if (['approval_pending', 'approved', 'evisa_issued'].includes(bStatus)) return 'APPROVED';
  if (['completed'].includes(bStatus)) return 'COMPLETED';
  if (['rejected', 'cancelled'].includes(bStatus)) return 'REJECTED';
  return 'RECEIVED';
}

function unmapStatus(fStatus: string): string {
  if (fStatus === 'RECEIVED') return 'document_collection';
  if (fStatus === 'IN_REVIEW') return 'document_verification';
  if (fStatus === 'IN_PROCESS') return 'immigration_processing';
  if (fStatus === 'APPROVED') return 'approved';
  if (fStatus === 'COMPLETED') return 'completed';
  if (fStatus === 'REJECTED') return 'rejected';
  return 'draft';
}

function mapDoc(d: any): any {
  return {
    id: d.id,
    applicationId: d.applicationId,
    docName: d.fileName,
    docType: 'VISA',
    status: d.status === 'pending' ? 'IN_REVIEW' : d.status === 'verified' ? 'APPROVED' : 'REJECTED',
    fileUrl: d.filePath,
    isPublic: true,
    createdAt: d.createdAt,
    fileDownloadUrl: d.filePath
  };
}

function mapHistory(h: any): any {
  return {
    id: h.id,
    statusName: mapStatus(h.toStatus),
    descriptionPublic: h.description,
    updatedBy: h.changedByStaffId || '',
    createdAt: h.createdAt,
    updater: h.changedByStaff ? { fullName: h.changedByStaff.fullName } : undefined
  };
}

/** Map a backend status to a 0–100 progress percentage. */
function progressFromStatus(bStatus: string): number {
  const order = [
    'draft',
    'document_collection',
    'document_verification',
    'document_revision',
    'submission_to_immigration',
    'immigration_review',
    'biometric_scheduled',
    'biometric_completed',
    'immigration_processing',
    'approval_pending',
    'approved',
    'evisa_issued',
    'completed',
  ];
  if (bStatus === 'completed' || bStatus === 'evisa_issued') return 100;
  if (bStatus === 'rejected' || bStatus === 'cancelled') return 100;
  const idx = order.indexOf(bStatus);
  if (idx < 0) return 0;
  return Math.round((idx / (order.length - 1)) * 100);
}

/**
 * Derive a deterministic priority from the application id so the value is
 * stable across reloads (the backend has no priority field).
 */
function priorityFromId(id: string): Application['priority'] {
  const levels: Application['priority'][] = [
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  // Skew toward MEDIUM/HIGH for a realistic distribution.
  const weighted = [0, 1, 1, 2, 2, 3];
  return levels[weighted[hash % weighted.length]];
}

export function mapApplication(backendData: any): Application {
  return {
    id: backendData.id,
    trackingCode: backendData.referenceNumber,
    clientId: backendData.clientId,
    serviceType: backendData.visaType === 'B211A' ? 'VISA' : 'KITAS',
    visaType: backendData.visaType,
    currentStatus: mapStatus(backendData.status),
    priority: priorityFromId(backendData.id || ''),
    progress:
      typeof backendData.progressPercentage === 'number'
        ? backendData.progressPercentage
        : progressFromStatus(backendData.status),
    biometricStatus: backendData.biometricStatus ?? 'not_scheduled',
    biometricDate: backendData.biometricDate ?? null,
    biometricTime: backendData.biometricTime ?? null,
    biometricLocation: backendData.biometricLocation ?? null,
    fieldAssistantName: backendData.fieldAssistantName ?? null,
    handledBy: backendData.assignedStaffId || '',
    createdAt: backendData.createdAt,
    client: backendData.client ? {
       id: backendData.client.id,
       name: backendData.client.fullName,
       passportNumber: backendData.client.passportNumber,
       contactNumber: backendData.client.phone,
       createdBy: '',
       createdAt: backendData.client.createdAt
    } : undefined,
    handler: backendData.assignedStaff ? {
       id: backendData.assignedStaff.id,
       fullName: backendData.assignedStaff.fullName,
       role: backendData.assignedStaff.role === 'admin' ? 'ADMIN' : 'STAFF'
    } : undefined,
    documents: (backendData.documents || []).map(mapDoc),
    histories: (backendData.trackingHistory || []).map(mapHistory)
  };
}

export async function createApplication(payload: CreateApplicationPayload): Promise<Application> {
  const { data } = await apiClient.post<ApiResponse<any>>('/applications', {
    clientId: payload.clientId,
    visaType: payload.serviceType === 'VISA' ? 'B211A' : 'KITAS_WORKING'
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

export async function updateApplicationStatus(id: string, payload: UpdateStatusPayload): Promise<Application> {
  const { data } = await apiClient.patch<ApiResponse<any>>(`/applications/${id}/status`, {
    status: unmapStatus(payload.statusName),
    description: payload.descriptionPublic,
    isVisibleToClient: true
  });
  return mapApplication(data.data);
}

export async function deleteApplication(id: string): Promise<void> {
  await apiClient.delete(`/applications/${id}`);
}
