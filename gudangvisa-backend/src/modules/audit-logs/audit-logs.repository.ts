import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { auditLogs } from '../../db/schema.js';

export class AuditLogsRepository {
  async findAll() {
    return await db.query.auditLogs.findMany({
      orderBy: (l, { desc }) => [desc(l.createdAt)],
      with: {
        staff: {
          columns: { id: true, fullName: true, email: true },
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
