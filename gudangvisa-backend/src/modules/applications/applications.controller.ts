import { Request, Response, NextFunction } from 'express';
import { ApplicationsService } from './applications.service.js';
import type { ApiResponse } from '../../types/index.js';
import { AppError } from '../../utils/AppError.js';

export class ApplicationsController {
  private service = new ApplicationsService();

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.staffUser) throw new AppError(401, 'Staff auth required.');
      const app = await this.service.createApplication(
        req.body,
        req.staffUser.id,
      );

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
