import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { documents } from '../../db/schema.js';
import { AppError } from '../../utils/AppError.js';

export class DocumentRepository {
  /**
   * Add a document (file attachment) to a ticket.
   */
  async addDocument(data: typeof documents.$inferInsert) {
    const [newDoc] = await db.insert(documents).values(data).returning();

    if (!newDoc) {
      throw new AppError(500, 'Database failed to create the document.');
    }

    return newDoc;
  }

  /**
   * Get all documents for a specific ticket.
   */
  async findByTicketId(ticketId: string) {
    return await db.query.documents.findMany({
      where: eq(documents.ticketId, ticketId),
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    });
  }

  /**
   * Get a single document by ID.
   */
  async findById(id: string) {
    return await db.query.documents.findFirst({
      where: eq(documents.id, id),
    });
  }

  /**
   * Delete a document by ID. Returns the deleted document for storage cleanup.
   */
  async deleteById(id: string) {
    const [deletedDoc] = await db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning();

    if (!deletedDoc) {
      throw new AppError(404, 'Document not found or already deleted.');
    }

    return deletedDoc;
  }
}
