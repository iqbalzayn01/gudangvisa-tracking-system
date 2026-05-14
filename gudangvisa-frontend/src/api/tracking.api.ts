import apiClient from './client';
import type { ApiResponse, PublicTrackingResult, UpdateStatusPayload, TrackingTicket } from '../types';

/**
 * Public endpoint — track a ticket by its code. No auth required.
 */
export async function trackByCode(code: string): Promise<PublicTrackingResult> {
  const { data } = await apiClient.get<ApiResponse<PublicTrackingResult>>(
    `/tracking/${code}`,
  );
  return data.data;
}

/**
 * Update a ticket's status via the tracking module. Auth required.
 */
export async function updateTrackingStatus(
  id: string,
  payload: UpdateStatusPayload,
): Promise<TrackingTicket> {
  const { data } = await apiClient.patch<ApiResponse<TrackingTicket>>(
    `/tracking/${id}/status`,
    payload,
  );
  return data.data;
}
