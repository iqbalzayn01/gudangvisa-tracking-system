import apiClient from './client';
import type { ApiResponse, Client, CreateClientPayload } from '../types';

function mapClient(c: any): Client {
  return {
    id: c.id,
    name: c.fullName,
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

export async function deleteClient(id: string): Promise<void> {
  await apiClient.delete(`/client-accounts/${id}`);
}
