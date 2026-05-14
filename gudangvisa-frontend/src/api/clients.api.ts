import apiClient from './client';
import type { ApiResponse, Client, CreateClientPayload } from '../types';

/**
 * Create a new client. Staff or Admin.
 */
export async function createClient(payload: CreateClientPayload): Promise<Client> {
  const { data } = await apiClient.post<ApiResponse<Client>>('/clients', payload);
  return data.data;
}

/**
 * Fetch all clients.
 */
export async function getAllClients(): Promise<Client[]> {
  const { data } = await apiClient.get<ApiResponse<Client[]>>('/clients');
  return data.data;
}

/**
 * Fetch a single client by ID.
 */
export async function getClientById(id: string): Promise<Client> {
  const { data } = await apiClient.get<ApiResponse<Client>>(`/clients/${id}`);
  return data.data;
}

/**
 * Delete a client. Admin only.
 */
export async function deleteClient(id: string): Promise<void> {
  await apiClient.delete(`/clients/${id}`);
}
