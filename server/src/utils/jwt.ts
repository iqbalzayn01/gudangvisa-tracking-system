import { SignJWT, jwtVerify } from 'jose';
import type { Response } from 'express';
import { ENV } from '../config/env.js';
import type { StaffJwtPayload } from '../types/index.js';

export const accessSecretKey = new TextEncoder().encode(ENV.JWT_SECRET);
const refreshSecretKey = new TextEncoder().encode(ENV.JWT_REFRESH_SECRET);

// Only HS256 tokens are ever issued; pinning the algorithm on verification
// rejects tokens signed any other way.
export const JWT_ALGORITHMS = ['HS256'];

// Access Token: 15 minutes
const ACCESS_TOKEN_EXPIRY = '15m';
// Refresh Token: 7 days
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Generate access token (short-lived, stored in memory/Pinia).
 */
export async function generateAccessToken(
  payload: StaffJwtPayload,
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
  payload: StaffJwtPayload,
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
): Promise<StaffJwtPayload> {
  const { payload } = await jwtVerify(token, refreshSecretKey, {
    algorithms: JWT_ALGORITHMS,
  });
  return payload as unknown as StaffJwtPayload;
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

/** Set (or rotate) the refresh-token cookie on a response. */
export function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
}

/** Clear the refresh-token cookie (logout). */
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: REFRESH_COOKIE_OPTIONS.secure,
    sameSite: REFRESH_COOKIE_OPTIONS.sameSite,
    path: REFRESH_COOKIE_OPTIONS.path,
  });
}
