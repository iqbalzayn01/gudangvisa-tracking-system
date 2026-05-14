import apiClient from './client';
import type { ApiResponse, LoginPayload, LoginResponse, User } from '../types';

/**
 * Authenticate a user and receive a JWT token.
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
    '/auth/login',
    payload,
  );
  return data.data;
}

/**
 * Fetch the currently authenticated user's profile.
 */
export async function getProfile(): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<User>>('/users/me');
  return data.data;
}
