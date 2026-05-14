// src/types/index.ts

/**
 * Standard API Response Structure.
 * This ensures the frontend always receives the exact same JSON format.
 * <T> is a Generic type, meaning the data can be an Array, Object, or Null.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * JWT Payload stored inside the token.
 */
export interface JwtPayloadData {
  id: string;
  fullName: string;
  email: string;
  role: string;
}
