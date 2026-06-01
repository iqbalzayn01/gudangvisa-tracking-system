import { AuditLogsRepository } from './audit-logs.repository.js';
import { AppError } from '../../utils/AppError.js';

export class AuditLogsService {
  private repository = new AuditLogsRepository();

  async getAllLogs() {
    return await this.repository.findAll();
  }

  async getLogById(id: string) {
    const log = await this.repository.findById(id);
    if (!log) throw new AppError(404, 'Audit log not found.');
    return log;
  }
}
