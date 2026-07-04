import { and, eq, ne, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  clientAccounts,
  applications,
  applicationDocuments,
} from '../../db/schema.js';
import { AppError } from '../../utils/AppError.js';

/** Safe-to-return client columns — everything except passwordHash/updatedAt. */
const clientPublicColumns = {
  id: clientAccounts.id,
  fullName: clientAccounts.fullName,
  email: clientAccounts.email,
  passportNumber: clientAccounts.passportNumber,
  nationality: clientAccounts.nationality,
  phone: clientAccounts.phone,
  isActive: clientAccounts.isActive,
  createdAt: clientAccounts.createdAt,
};

export class ClientAccountsRepository {
  async findByEmail(email: string) {
    return await db.query.clientAccounts.findFirst({
      where: eq(clientAccounts.email, email),
    });
  }

  /**
   * Case-insensitive, trimmed full-name lookup. `excludeId` skips the client's
   * own row so updates don't collide with themselves.
   */
  async findByFullName(fullName: string, excludeId?: string) {
    const normalized = fullName.trim().toLowerCase();
    const nameMatch = sql`lower(trim(${clientAccounts.fullName})) = ${normalized}`;
    return await db.query.clientAccounts.findFirst({
      where: excludeId
        ? and(nameMatch, ne(clientAccounts.id, excludeId))
        : nameMatch,
    });
  }

  async findById(id: string) {
    return await db.query.clientAccounts.findFirst({
      where: eq(clientAccounts.id, id),
      columns: {
        id: true,
        fullName: true,
        email: true,
        passportNumber: true,
        nationality: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async createClient(
    data: Omit<typeof clientAccounts.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>,
  ) {
    const [newClient] = await db
      .insert(clientAccounts)
      .values(data)
      .returning(clientPublicColumns);

    if (!newClient) {
      throw new AppError(500, 'Database failed to create client account.');
    }

    return newClient;
  }

  async findAll() {
    return await db.select(clientPublicColumns).from(clientAccounts);
  }

  async updateById(
    id: string,
    data: {
      fullName?: string | undefined;
      nationality?: string | undefined;
      phone?: string | null | undefined;
    },
  ) {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (data.fullName !== undefined) patch.fullName = data.fullName;
    if (data.nationality !== undefined) patch.nationality = data.nationality;
    if (data.phone !== undefined) patch.phone = data.phone;

    const [updated] = await db
      .update(clientAccounts)
      .set(patch)
      .where(eq(clientAccounts.id, id))
      .returning(clientPublicColumns);

    if (!updated) {
      throw new AppError(404, 'Client account not found.');
    }

    return updated;
  }

  /**
   * Storage paths of every document under the client's applications. Collected
   * BEFORE deletion — the DB cascade wipes the rows but not the bucket files.
   */
  async findDocumentPathsByClientId(clientId: string): Promise<string[]> {
    const rows = await db
      .select({ filePath: applicationDocuments.filePath })
      .from(applicationDocuments)
      .innerJoin(
        applications,
        eq(applicationDocuments.applicationId, applications.id),
      )
      .where(eq(applications.clientId, clientId));

    return rows.map((r) => r.filePath);
  }

  async deleteById(id: string) {
    const [deleted] = await db
      .delete(clientAccounts)
      .where(eq(clientAccounts.id, id))
      .returning({ id: clientAccounts.id });

    if (!deleted) {
      throw new AppError(404, 'Client account not found or already deleted.');
    }

    return true;
  }
}
