import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  trackingTickets,
  trackingHistories,
  documents,
} from '../../db/schema.js';
import { AppError } from '../../utils/AppError.js';

type DocStatus =
  | 'RECEIVED'
  | 'IN_REVIEW'
  | 'IN_PROCESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export class TicketsRepository {
  /**
   * Create a ticket and insert the initial RECEIVED history entry.
   */
  async createTicketWithHistory(
    data: typeof trackingTickets.$inferInsert,
    descriptionPublic: string,
  ) {
    return await db.transaction(async (tx) => {
      const [newTicket] = await tx
        .insert(trackingTickets)
        .values(data)
        .returning();

      if (!newTicket) {
        throw new AppError(
          500,
          'Database failed to return the newly created ticket.',
        );
      }

      await tx.insert(trackingHistories).values({
        ticketId: newTicket.id,
        statusName: 'RECEIVED',
        descriptionPublic,
        updatedBy: data.handledBy,
      });

      return newTicket;
    });
  }

  /**
   * Get all tickets with client and handler info.
   */
  async findAll() {
    return await db.query.trackingTickets.findMany({
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      with: {
        client: true,
        handler: {
          columns: { id: true, fullName: true, role: true },
        },
      },
    });
  }

  /**
   * Get a single ticket with all related data.
   */
  async findById(id: string) {
    return await db.query.trackingTickets.findFirst({
      where: eq(trackingTickets.id, id),
      with: {
        client: true,
        handler: {
          columns: { id: true, fullName: true, role: true },
        },
        documents: true,
        histories: {
          orderBy: (h, { desc }) => [desc(h.createdAt)],
          with: {
            updater: {
              columns: { id: true, fullName: true },
            },
          },
        },
      },
    });
  }

  /**
   * Update ticket status and insert a new history entry.
   */
  async updateStatusWithHistory(
    ticketId: string,
    statusName: DocStatus,
    descriptionPublic: string,
    descriptionInternal: string | null,
    userId: string,
  ) {
    return await db.transaction(async (tx) => {
      const [updatedTicket] = await tx
        .update(trackingTickets)
        .set({ currentStatus: statusName })
        .where(eq(trackingTickets.id, ticketId))
        .returning();

      if (!updatedTicket) {
        throw new AppError(404, 'Ticket not found or failed to update.');
      }

      // Sync document statuses to match the new ticket status
      await tx
        .update(documents)
        .set({ status: statusName })
        .where(eq(documents.ticketId, ticketId));

      await tx.insert(trackingHistories).values({
        ticketId: updatedTicket.id,
        statusName,
        descriptionPublic,
        descriptionInternal,
        updatedBy: userId,
      });

      return updatedTicket;
    });
  }

  /**
   * Delete a ticket and all its related data (histories + documents).
   * Returns deleted documents so the caller can clean up storage.
   */
  async deleteTicketById(ticketId: string) {
    return await db.transaction(async (tx) => {
      // 1. Get all documents for storage cleanup
      const ticketDocs = await tx.query.documents.findMany({
        where: eq(documents.ticketId, ticketId),
      });

      // 2. Delete histories
      await tx
        .delete(trackingHistories)
        .where(eq(trackingHistories.ticketId, ticketId));

      // 3. Delete documents
      await tx.delete(documents).where(eq(documents.ticketId, ticketId));

      // 4. Delete the ticket
      const [deletedTicket] = await tx
        .delete(trackingTickets)
        .where(eq(trackingTickets.id, ticketId))
        .returning();

      if (!deletedTicket) {
        throw new AppError(404, 'Ticket not found or already deleted.');
      }

      return { ticket: deletedTicket, documents: ticketDocs };
    });
  }
}
