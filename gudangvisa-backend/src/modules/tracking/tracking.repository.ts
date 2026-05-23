import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { trackingTickets, trackingHistories, documents } from '../../db/schema.js';
import { AppError } from '../../utils/AppError.js';

type DocStatus =
  | 'RECEIVED'
  | 'IN_REVIEW'
  | 'IN_PROCESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export class TrackingRepository {
  /**
   * Find a ticket by tracking code with public-facing data.
   * Includes client info, public documents, and history timeline.
   */
  async findByTrackingCode(trackingCode: string) {
    return await db.query.trackingTickets.findFirst({
      where: eq(trackingTickets.trackingCode, trackingCode),
      with: {
        client: {
          columns: { name: true },
        },
        handler: {
          columns: { fullName: true },
        },
        documents: true,
        histories: {
          orderBy: (h, { desc }) => [desc(h.createdAt)],
          with: {
            updater: {
              columns: { fullName: true },
            },
          },
        },
      },
    });
  }

  /**
   * Find a ticket by ID (lightweight, for status validation).
   */
  async findById(id: string) {
    return await db.query.trackingTickets.findFirst({
      where: eq(trackingTickets.id, id),
      columns: { id: true, currentStatus: true },
    });
  }

  /**
   * Update ticket status and insert a history entry (for staff via tracking).
   */
  async updateStatusWithHistory(
    ticketId: string,
    statusName: DocStatus,
    descriptionPublic: string,
    descriptionInternal: string | null,
    staffId: string,
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
        updatedBy: staffId,
      });

      return updatedTicket;
    });
  }
}
