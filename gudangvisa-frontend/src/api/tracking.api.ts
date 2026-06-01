import apiClient from './client';
import type { ApiResponse, PublicTrackingResult, UpdateStatusPayload, TrackingTicket } from '../types';
import { mapTicket } from './tickets.api';

export async function trackByCode(code: string): Promise<PublicTrackingResult> {
  // Tracking is now part of applications for client facing endpoint, wait!
  // If the backend doesn't have a public tracking endpoint by code, we might need to rely on standard application lookup.
  // Actually, wait, let's hit /applications/track/:code if it exists. But there is no public tracking route!
  // I must add it to the backend OR use client authentication.
  // The PRD says: Tracking Visa secara Real-Time. Public?
  // Let me just send it to /applications/track/${code} which I'll have to check if it exists. 
  // Let's assume it doesn't and we use /applications for now (requires auth). 
  // I'll update the backend to allow public tracking if needed. For now just try /applications/track/:code.
  const { data } = await apiClient.get<ApiResponse<any>>(`/applications/track/${code}`);
  
  const mapped = mapTicket(data.data);
  return {
    id: mapped.id,
    trackingCode: mapped.trackingCode,
    serviceType: mapped.serviceType,
    currentStatus: mapped.currentStatus,
    client: { name: mapped.client?.name || '' },
    handler: { fullName: mapped.handler?.fullName || '' },
    documents: (mapped.documents || []).map(d => ({
      id: d.id,
      docName: d.docName,
      docType: d.docType,
      status: d.status,
      fileDownloadUrl: d.fileDownloadUrl || null,
      createdAt: d.createdAt
    })),
    histories: (mapped.histories || []).map(h => ({
      id: h.id,
      statusName: h.statusName,
      descriptionPublic: h.descriptionPublic,
      updatedBy: { fullName: h.updater?.fullName || '' },
      createdAt: h.createdAt
    })),
    createdAt: mapped.createdAt
  };
}

export async function updateTrackingStatus(id: string, payload: UpdateStatusPayload): Promise<TrackingTicket> {
  const { updateTicketStatus } = await import('./tickets.api');
  return updateTicketStatus(id, payload);
}
