import apiClient from './client';
import type {
  ApiResponse,
  TrackingTicket,
  CreateTicketPayload,
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
    ticketId: d.applicationId,
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

export function mapTicket(backendData: any): TrackingTicket {
  return {
    id: backendData.id,
    trackingCode: backendData.referenceNumber,
    clientId: backendData.clientId,
    serviceType: backendData.visaType === 'B211A' ? 'VISA' : 'KITAS',
    currentStatus: mapStatus(backendData.status),
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

export async function createTicket(payload: CreateTicketPayload): Promise<TrackingTicket> {
  const { data } = await apiClient.post<ApiResponse<any>>('/applications', {
    clientId: payload.clientId,
    visaType: payload.serviceType === 'VISA' ? 'B211A' : 'KITAS_WORKING'
  });
  return mapTicket(data.data);
}

export async function getAllTickets(): Promise<TrackingTicket[]> {
  const { data } = await apiClient.get<ApiResponse<any[]>>('/applications');
  return data.data.map(mapTicket);
}

export async function getTicketById(id: string): Promise<TrackingTicket> {
  const { data } = await apiClient.get<ApiResponse<any>>(`/applications/${id}`);
  return mapTicket(data.data);
}

export async function updateTicketStatus(id: string, payload: UpdateStatusPayload): Promise<TrackingTicket> {
  const { data } = await apiClient.patch<ApiResponse<any>>(`/applications/${id}/status`, {
    status: unmapStatus(payload.statusName),
    description: payload.descriptionPublic,
    isVisibleToClient: true
  });
  return mapTicket(data.data);
}

export async function deleteTicket(id: string): Promise<void> {
  await apiClient.delete(`/applications/${id}`);
}
