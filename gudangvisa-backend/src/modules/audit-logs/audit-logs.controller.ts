import { Request, Response, NextFunction } from 'express';
import { AuditLogsService } from './audit-logs.service.js';
import type { ApiResponse } from '../../types/index.js';

export class AuditLogsController {
  private service = new AuditLogsService();

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await this.service.getAllLogs();

      const response: ApiResponse = {
        success: true,
        message: 'Audit logs retrieved successfully.',
        data: logs,
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
      const log = await this.service.getLogById(req.params.id);

      const response: ApiResponse = {
        success: true,
        message: 'Audit log retrieved successfully.',
        data: log,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
