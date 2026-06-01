import { Request, Response, NextFunction } from 'express';
import { ApplicationsService } from './applications.service.js';
import type { ApiResponse } from '../../types/index.js';
import { AppError } from '../../utils/AppError.js';
import { recordAudit } from '../../utils/audit.js';

export class ApplicationsController {
  private service = new ApplicationsService();

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.staffUser) throw new AppError(401, 'Staff auth required.');
      const app = await this.service.createApplication(
        req.body,
        req.staffUser.id,
      );

      await recordAudit(req, {
        action: 'CREATE',
        entityType: 'application',
        applicationId: app.id,
        newValues: { visaType: app.visaType, status: app.status },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Application created successfully!',
        data: app,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const apps = await this.service.getAllApplications();

      const response: ApiResponse = {
        success: true,
        message: 'Applications retrieved successfully.',
        data: apps,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const app = await this.service.getApplicationById(req.params.id);

      const response: ApiResponse = {
        success: true,
        message: 'Application retrieved successfully.',
        data: app,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.staffUser) throw new AppError(401, 'Staff auth required.');
      const result = await this.service.updateApplicationStatus(
        req.params.id,
        req.body,
        req.staffUser.id,
      );

      await recordAudit(req, {
        action: 'STATUS_CHANGE',
        entityType: 'application',
        applicationId: req.params.id,
        newValues: { status: req.body.status, description: req.body.description },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Application status updated successfully.',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateBiometric = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.staffUser) throw new AppError(401, 'Staff auth required.');
      const result = await this.service.updateBiometricSchedule(
        req.params.id,
        req.body,
        req.staffUser.id,
      );

      await recordAudit(req, {
        action: 'UPDATE',
        entityType: 'biometric',
        applicationId: req.params.id,
        newValues: {
          biometricStatus: req.body.biometricStatus,
          biometricDate: req.body.biometricDate,
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Biometric schedule updated successfully.',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  toggleChecklist = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.staffUser) throw new AppError(401, 'Staff auth required.');
      const result = await this.service.toggleChecklistItem(
        req.params.id,
        req.body.itemIndex,
        req.body.isChecked,
        req.staffUser.id,
      );

      await recordAudit(req, {
        action: 'UPDATE',
        entityType: 'checklist',
        applicationId: req.params.id,
        newValues: {
          itemIndex: req.body.itemIndex,
          isChecked: req.body.isChecked,
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Checklist item updated successfully.',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await this.service.deleteApplication(req.params.id);

      // The application row is gone, so it can't be referenced via the FK —
      // keep its id in oldValues instead.
      await recordAudit(req, {
        action: 'DELETE',
        entityType: 'application',
        oldValues: { applicationId: req.params.id },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Application deleted successfully.',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getClientApplications = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.clientUser) throw new AppError(401, 'Client auth required.');
      const apps = await this.service.getApplicationsByClientId(
        req.clientUser.id,
      );

      const response: ApiResponse = {
        success: true,
        message: 'Your applications retrieved successfully.',
        data: apps,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
