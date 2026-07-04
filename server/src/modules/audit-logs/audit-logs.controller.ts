import { AuditLogsService } from './audit-logs.service.js';
import { asyncHandler, sendSuccess } from '../../utils/handler.js';

export class AuditLogsController {
  private service = new AuditLogsService();

  getAll = asyncHandler(async (req, res) => {
    const filters: { action?: string; entityType?: string } = {};
    if (typeof req.query.action === 'string' && req.query.action)
      filters.action = req.query.action;
    if (typeof req.query.entity === 'string' && req.query.entity)
      filters.entityType = req.query.entity;

    const logs = await this.service.getAllLogs(filters);
    sendSuccess(res, 200, 'Audit logs retrieved successfully.', logs);
  });

  getById = asyncHandler<{ id: string }>(async (req, res) => {
    const log = await this.service.getLogById(req.params.id);
    sendSuccess(res, 200, 'Audit log retrieved successfully.', log);
  });
}
