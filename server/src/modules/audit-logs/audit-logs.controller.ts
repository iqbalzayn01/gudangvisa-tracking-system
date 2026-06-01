import { Request, Response, NextFunction } from 'express';
import { AuditLogsService } from './audit-logs.service.js';
import type { ApiResponse } from '../../types/index.js';

export class AuditLogsController {
  private service = new AuditLogsService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: { action?: string; entityType?: string } = {};
      if (typeof req.query.action === 'string' && req.query.action)
        filters.action = req.query.action;
      if (typeof req.query.entity === 'string' && req.query.entity)
        filters.entityType = req.query.entity;

      const logs = await this.service.getAllLogs(filters);

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
