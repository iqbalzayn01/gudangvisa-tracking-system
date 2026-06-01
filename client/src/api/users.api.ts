import apiClient from './client';
import type { ApiResponse, CreateUserPayload, User } from '../types';

export async function getUsers(): Promise<User[]> {
  const { data } = await apiClient.get<ApiResponse<any[]>>('/staff-accounts');
  return data.data.map((u: any) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role === 'admin' ? 'ADMIN' : 'STAFF'
  }));
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await apiClient.post<ApiResponse<any>>('/staff-accounts', {
    ...payload,
    role: 'staff'
  });
  return {
    id: data.data.id,
    fullName: data.data.fullName,
    email: data.data.email,
    role: data.data.role === 'admin' ? 'ADMIN' : 'STAFF'
  };
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/staff-accounts/${id}`);
}
