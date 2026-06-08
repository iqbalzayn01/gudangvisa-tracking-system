import { and, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { auditLogs } from '../../db/schema.js';

export interface AuditLogFilters {
  action?: string;
  entityType?: string;
}

export class AuditLogsRepository {
  async findAll(filters: AuditLogFilters = {}) {
    const conditions = [];
    if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
    if (filters.entityType)
      conditions.push(eq(auditLogs.entityType, filters.entityType));

    return await db.query.auditLogs.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: (l, { desc }) => [desc(l.createdAt)],
      with: {
        staff: {
          columns: { id: true, fullName: true, email: true, role: true },
        },
        application: {
          columns: { id: true, referenceNumber: true },
        },
      },
      limit: 200,
    });
  }

  async findById(id: string) {
    return await db.query.auditLogs.findFirst({
      where: eq(auditLogs.id, id),
      with: {
        staff: {
          columns: { id: true, fullName: true, email: true },
        },
        application: {
          columns: { id: true, referenceNumber: true },
        },
      },
    });
  }

  async create(data: typeof auditLogs.$inferInsert) {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }
}
