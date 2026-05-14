import apiClient from './client';
import type {
  ApiResponse,
  TrackingTicket,
  CreateTicketPayload,
  UpdateStatusPayload,
} from '../types';

/**
 * Create a new tracking ticket. Staff or Admin.
 */
export async function createTicket(payload: CreateTicketPayload): Promise<TrackingTicket> {
  const { data } = await apiClient.post<ApiResponse<TrackingTicket>>('/tickets', payload);
  return data.data;
}

/**
 * Fetch all tickets with client and handler info.
 */
export async function getAllTickets(): Promise<TrackingTicket[]> {
  const { data } = await apiClient.get<ApiResponse<TrackingTicket[]>>('/tickets');
  return data.data;
}

/**
 * Fetch a single ticket by ID with full details (documents, histories).
 */
export async function getTicketById(id: string): Promise<TrackingTicket> {
  const { data } = await apiClient.get<ApiResponse<TrackingTicket>>(`/tickets/${id}`);
  return data.data;
}

/**
 * Update a ticket's status and add a history entry.
 */
export async function updateTicketStatus(
  id: string,
  payload: UpdateStatusPayload,
): Promise<TrackingTicket> {
  const { data } = await apiClient.patch<ApiResponse<TrackingTicket>>(
    `/tickets/${id}/status`,
    payload,
  );
  return data.data;
}

/**
 * Delete a ticket and all related data. Admin only.
 */
export async function deleteTicket(id: string): Promise<void> {
  await apiClient.delete(`/tickets/${id}`);
}
