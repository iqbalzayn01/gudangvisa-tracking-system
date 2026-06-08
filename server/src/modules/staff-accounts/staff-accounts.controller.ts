import { Request, Response, NextFunction } from 'express';
import { StaffAccountsService } from './staff-accounts.service.js';
import type { ApiResponse } from '../../types/index.js';
import { AppError } from '../../utils/AppError.js';
import { recordAudit } from '../../utils/audit.js';

export class StaffAccountsController {
  private service = new StaffAccountsService();

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.staffUser) {
        throw new AppError(401, 'Staff user not found in request.');
      }

      const response: ApiResponse = {
        success: true,
        message: 'Staff profile retrieved successfully.',
        data: {
          id: req.staffUser.id,
          fullName: req.staffUser.fullName,
          email: req.staffUser.email,
          role: req.staffUser.role,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  createStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newStaff = await this.service.createNewStaff(req.body);

      await recordAudit(req, {
        action: 'CREATE',
        entityType: 'staff',
        newValues: { email: req.body.email, role: req.body.role },
      });

      const response: ApiResponse = {
        success: true,
        message: 'New staff member added successfully!',
        data: newStaff,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getAllStaff = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const staffList = await this.service.getAllStaff();

      const response: ApiResponse = {
        success: true,
        message: 'Staff list retrieved successfully.',
        data: staffList,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteStaff = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await this.service.removeStaff(req.params.id);

      await recordAudit(req, {
        action: 'DELETE',
        entityType: 'staff',
        oldValues: { staffId: req.params.id },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Staff member deleted successfully.',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
