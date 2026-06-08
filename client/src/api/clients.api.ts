import apiClient from './client';
import type {
  ApiResponse,
  Client,
  CreateClientPayload,
  UpdateClientPayload,
} from '../types';

function mapClient(c: any): Client {
  return {
    id: c.id,
    name: c.fullName,
    email: c.email ?? undefined,
    nationality: c.nationality ?? null,
    passportNumber: c.passportNumber || null,
    contactNumber: c.phone || null,
    createdBy: '',
    createdAt: c.createdAt
  };
}

export async function createClient(payload: CreateClientPayload): Promise<Client> {
  const { data } = await apiClient.post<ApiResponse<any>>('/client-accounts', {
    fullName: payload.name,
    passportNumber: payload.passportNumber || 'UNKNOWN',
    nationality: 'Unknown',
    phone: payload.contactNumber || ''
  });
  return mapClient(data.data);
}

export async function getAllClients(): Promise<Client[]> {
  const { data } = await apiClient.get<ApiResponse<any[]>>('/client-accounts');
  return data.data.map(mapClient);
}

export async function getClientById(id: string): Promise<Client> {
  const { data } = await apiClient.get<ApiResponse<any>>(`/client-accounts/${id}`);
  return mapClient(data.data);
}

/** Admin-only: update a client's name, nationality, and/or phone. */
export async function updateClient(
  id: string,
  payload: UpdateClientPayload,
): Promise<Client> {
  const body: Record<string, string> = {};
  if (payload.name !== undefined) body.fullName = payload.name;
  if (payload.nationality !== undefined) body.nationality = payload.nationality;
  if (payload.contactNumber !== undefined) body.phone = payload.contactNumber;

  const { data } = await apiClient.patch<ApiResponse<any>>(
    `/client-accounts/${id}`,
    body,
  );
  return mapClient(data.data);
}

export async function deleteClient(id: string): Promise<void> {
  await apiClient.delete(`/client-accounts/${id}`);
}
