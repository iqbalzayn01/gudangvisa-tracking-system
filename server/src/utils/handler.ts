import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse, StaffJwtPayload } from '../types/index.js';
import { AppError } from './AppError.js';

type AsyncRouteHandler<P> = (
  req: Request<P>,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

/**
 * Wrap an async route handler so rejections flow to the global error
 * middleware — replaces the per-handler try/catch + next(error) boilerplate.
 */
export function asyncHandler<P = Record<string, string>>(
  fn: AsyncRouteHandler<P>,
) {
  return (req: Request<P>, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

/** Send the standard success envelope: { success, message, data }. */
export function sendSuccess(
  res: Response,
  statusCode: number,
  message: string,
  data?: unknown,
): void {
  const body: ApiResponse = { success: true, message };
  if (data !== undefined) body.data = data;
  res.status(statusCode).json(body);
}

/**
 * Return the authenticated staff user. The auth middleware guarantees it is
 * set; this narrows the optional type for handlers.
 */
export function getStaffUser(req: {
  staffUser?: StaffJwtPayload;
}): StaffJwtPayload {
  if (!req.staffUser) throw new AppError(401, 'Staff auth required.');
  return req.staffUser;
}
