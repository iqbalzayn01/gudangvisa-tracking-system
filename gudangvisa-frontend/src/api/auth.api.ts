import apiClient from './client';
import type { ApiResponse, LoginPayload, LoginResponse, User } from '../types';

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiResponse<any>>(
    '/auth/internal/login',
    payload,
  );
  return {
    user: { fullName: data.data.user.fullName, role: data.data.user.role === 'admin' ? 'ADMIN' : 'STAFF' },
    token: data.data.accessToken
  };
}

export async function getProfile(): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<any>>('/staff-accounts/me');
  return {
    id: data.data.id,
    fullName: data.data.fullName,
    email: data.data.email,
    role: data.data.role === 'admin' ? 'ADMIN' : 'STAFF'
  };
}
