import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { ENV } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import type { StaffJwtPayload, ClientJwtPayload } from '../types/index.js';

const secretKey = new TextEncoder().encode(ENV.JWT_SECRET);

/**
 * Middleware: Require authentication for INTERNAL staff/admin users.
 * Reads JWT from Authorization header, verifies it, and ensures accountType is 'internal'.
 * Populates req.staffUser.
 */
export const requireStaffAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractBearerToken(req);
    const { payload } = await jwtVerify(token, secretKey);
    const decoded = payload as unknown as StaffJwtPayload;

    if (decoded.accountType !== 'internal') {
      throw new AppError(403, 'Access denied: Staff account required.');
    }

    req.staffUser = {
      id: decoded.id,
      fullName: decoded.fullName,
      email: decoded.email,
      role: decoded.role,
      accountType: 'internal',
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(401, 'Invalid or expired token. Please log in again.'));
    }
  }
};

/**
 * Middleware: Require authentication for EXTERNAL client users.
 * Reads JWT from Authorization header, verifies it, and ensures accountType is 'client'.
 * Populates req.clientUser.
 */
export const requireClientAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractBearerToken(req);
    const { payload } = await jwtVerify(token, secretKey);
    const decoded = payload as unknown as ClientJwtPayload;

    if (decoded.accountType !== 'client') {
      throw new AppError(403, 'Access denied: Client account required.');
    }

    req.clientUser = {
      id: decoded.id,
      fullName: decoded.fullName,
      email: decoded.email,
      accountType: 'client',
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(401, 'Invalid or expired token. Please log in again.'));
    }
  }
};

/**
 * Helper: Extract Bearer token from Authorization header.
 */
function extractBearerToken(req: Request): string {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(
      401,
      'You are not logged in. Please provide a valid token.',
    );
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AppError(401, 'Token is missing from Authorization header.');
  }

  return token;
}
