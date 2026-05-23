import { TicketsRepository } from './tickets.repository.js';
import { AppError } from '../../utils/AppError.js';
import { deleteStorageFile } from '../../utils/storage.js';

type DocStatus =
  | 'RECEIVED'
  | 'IN_REVIEW'
  | 'IN_PROCESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export class TicketsService {
  private repository = new TicketsRepository();

  /**
   * Create a new tracking ticket with an initial RECEIVED history.
   */
  async createTicket(
    data: { clientId: string; serviceType: string },
    staffId: string,
  ) {
    const trackingCode = `GVI-${Date.now()}`;

    return await this.repository.createTicketWithHistory(
      {
        trackingCode,
        clientId: data.clientId,
        serviceType: data.serviceType,
        currentStatus: 'RECEIVED',
        handledBy: staffId,
      },
      'Ticket received and registered into the system.',
    );
  }

  /**
   * Get all tickets with client and handler info.
   */
  async getAllTickets() {
    return await this.repository.findAll();
  }

  /**
   * Get a single ticket by ID with full details.
   */
  async getTicketById(id: string) {
    const ticket = await this.repository.findById(id);
    if (!ticket) {
      throw new AppError(404, 'Ticket not found.');
    }
    return ticket;
  }

  /**
   * Update ticket status and add a history entry.
   * Rejects updates if the ticket is already COMPLETED.
   */
  async updateTicketStatus(
    ticketId: string,
    statusName: DocStatus,
    descriptionPublic: string,
    descriptionInternal: string | null,
    staffId: string,
  ) {
    const ticket = await this.repository.findById(ticketId);
    if (!ticket) {
      throw new AppError(404, 'Ticket not found.');
    }
    if (ticket.currentStatus === 'COMPLETED') {
      throw new AppError(
        400,
        'Cannot update status: this ticket has already been completed.',
      );
    }

    return await this.repository.updateStatusWithHistory(
      ticketId,
      statusName,
      descriptionPublic,
      descriptionInternal,
      staffId,
    );
  }

  /**
   * Delete a ticket and clean up all associated storage files.
   */
  async deleteTicket(ticketId: string) {
    const { ticket, documents } =
      await this.repository.deleteTicketById(ticketId);

    // Clean up all files from Supabase Storage
    for (const doc of documents) {
      await deleteStorageFile(doc.fileUrl);
    }

    return ticket;
  }
}
