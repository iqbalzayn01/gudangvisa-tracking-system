import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

/**
 * Middleware to restrict access based on internal staff roles.
 * Must be used AFTER requireStaffAuth middleware.
 * @param allowedRoles Array of allowed roles (e.g., ['admin', 'staff'])
 */
export const authorizeRoles = (...allowedRoles: Array<'admin' | 'staff'>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.staffUser) {
      return next(
        new AppError(401, 'Authentication required. Staff account not found.'),
      );
    }

    if (!allowedRoles.includes(req.staffUser.role)) {
      return next(
        new AppError(
          403,
          'Access denied: You do not have permission to perform this action.',
        ),
      );
    }

    next();
  };
};
