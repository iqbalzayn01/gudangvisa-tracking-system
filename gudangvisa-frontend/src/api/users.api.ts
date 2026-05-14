import apiClient from './client';
import type { ApiResponse, CreateUserPayload, User } from '../types';

/**
 * Fetch the full list of users. Admin only.
 */
export async function getUsers(): Promise<User[]> {
  const { data } = await apiClient.get<ApiResponse<User[]>>('/users');
  return data.data;
}

/**
 * Create a new staff member. Admin only.
 */
export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await apiClient.post<ApiResponse<User>>('/users', payload);
  return data.data;
}

/**
 * Delete a user by ID. Admin only.
 */
export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
