import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { applicationDocuments } from '../../db/schema.js';
import { AppError } from '../../utils/AppError.js';

export class ApplicationDocumentsRepository {
  async create(data: typeof applicationDocuments.$inferInsert) {
    const [newDoc] = await db
      .insert(applicationDocuments)
      .values(data)
      .returning();

    if (!newDoc) {
      throw new AppError(500, 'Database failed to create document.');
    }

    return newDoc;
  }

  async findByApplicationId(applicationId: string) {
    return await db.query.applicationDocuments.findMany({
      where: eq(applicationDocuments.applicationId, applicationId),
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    });
  }

  async findById(id: string) {
    return await db.query.applicationDocuments.findFirst({
      where: eq(applicationDocuments.id, id),
    });
  }

  /** Fetch a document along with the id of the client that owns its application. */
  async findByIdWithOwner(id: string) {
    return await db.query.applicationDocuments.findFirst({
      where: eq(applicationDocuments.id, id),
      with: {
        application: {
          columns: { id: true, clientId: true },
        },
      },
    });
  }

  async updateVerification(
    id: string,
    data: {
      status: 'verified' | 'rejected';
      rejectionReason: string | null;
      verifiedByStaffId: string;
      verifiedAt: Date;
    },
  ) {
    const [updated] = await db
      .update(applicationDocuments)
      .set({
        status: data.status,
        rejectionReason: data.rejectionReason,
        verifiedByStaffId: data.verifiedByStaffId,
        verifiedAt: data.verifiedAt,
        updatedAt: new Date(),
      })
      .where(eq(applicationDocuments.id, id))
      .returning();

    if (!updated) {
      throw new AppError(404, 'Document not found or failed to update.');
    }

    return updated;
  }

  async deleteById(id: string) {
    const [deleted] = await db
      .delete(applicationDocuments)
      .where(eq(applicationDocuments.id, id))
      .returning();

    if (!deleted) {
      throw new AppError(404, 'Document not found or already deleted.');
    }

    return deleted;
  }
}
