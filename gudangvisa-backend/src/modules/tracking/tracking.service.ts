import { TrackingRepository } from './tracking.repository.js';
import { AppError } from '../../utils/AppError.js';
import { createSignedDownloadUrl } from '../../utils/storage.js';

type DocStatus =
  | 'RECEIVED'
  | 'IN_REVIEW'
  | 'IN_PROCESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export class TrackingService {
  private repository = new TrackingRepository();

  /**
   * Get public tracking details by tracking code.
   * - Filters documents to only public ones
   * - Generates signed download URLs for public documents
   * - Strips descriptionInternal from histories (clients should not see it)
   */
  async getTrackingDetails(trackingCode: string) {
    const ticket = await this.repository.findByTrackingCode(trackingCode);
    if (!ticket) {
      throw new AppError(
        404,
        'Ticket not found. Please check your tracking code.',
      );
    }

    // Filter to only public documents + generate signed download URLs
    const publicDocs = await Promise.all(
      ticket.documents
        .filter((doc) => doc.isPublic)
        .map(async (doc) => ({
          id: doc.id,
          docName: doc.docName,
          docType: doc.docType,
          status: doc.status,
          fileDownloadUrl: await createSignedDownloadUrl(doc.fileUrl),
          createdAt: doc.createdAt,
        })),
    );

    // Strip descriptionInternal from histories (public-facing)
    const publicHistories = ticket.histories.map((h) => ({
      id: h.id,
      statusName: h.statusName,
      descriptionPublic: h.descriptionPublic,
      updatedBy: h.updater,
      createdAt: h.createdAt,
    }));

    return {
      id: ticket.id,
      trackingCode: ticket.trackingCode,
      serviceType: ticket.serviceType,
      currentStatus: ticket.currentStatus,
      client: ticket.client,
      handler: ticket.handler,
      documents: publicDocs,
      histories: publicHistories,
      createdAt: ticket.createdAt,
    };
  }

  /**
   * Update ticket status via tracking module (for staff).
   */
  async processStatusUpdate(
    ticketId: string,
    statusName: DocStatus,
    descriptionPublic: string,
    descriptionInternal: string | null,
    staffId: string,
  ) {
    return await this.repository.updateStatusWithHistory(
      ticketId,
      statusName,
      descriptionPublic,
      descriptionInternal,
      staffId,
    );
  }
}
