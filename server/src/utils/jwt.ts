import { SignJWT, jwtVerify } from 'jose';
import { ENV } from '../config/env.js';
import type { StaffJwtPayload, ClientJwtPayload } from '../types/index.js';

const accessSecretKey = new TextEncoder().encode(ENV.JWT_SECRET);
const refreshSecretKey = new TextEncoder().encode(ENV.JWT_REFRESH_SECRET);

// Access Token: 15 minutes
const ACCESS_TOKEN_EXPIRY = '15m';
// Refresh Token: 7 days
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Generate access token (short-lived, stored in memory/Pinia).
 */
export async function generateAccessToken(
  payload: StaffJwtPayload | ClientJwtPayload,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(accessSecretKey);
}

/**
 * Generate refresh token (long-lived, stored in HttpOnly cookie).
 */
export async function generateRefreshToken(
  payload: StaffJwtPayload | ClientJwtPayload,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(refreshSecretKey);
}

/**
 * Verify a refresh token and return the payload.
 */
export async function verifyRefreshToken(
  token: string,
): Promise<StaffJwtPayload | ClientJwtPayload> {
  const { payload } = await jwtVerify(token, refreshSecretKey);
  return payload as unknown as StaffJwtPayload | ClientJwtPayload;
}

/** Cookie configuration for the refresh token. */
export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api',
};

export const REFRESH_COOKIE_NAME = 'gv_refresh_token';
