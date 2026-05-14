import { Request, Response, NextFunction } from 'express';
import { TicketsService } from './tickets.service.js';
import { ApiResponse } from '../../types/index.js';

export class TicketsController {
  private service = new TicketsService();

  /**
   * Create a new tracking ticket.
   * POST /api/v1/tickets
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const staffId = req.user.id;
      const newTicket = await this.service.createTicket(req.body, staffId);

      const response: ApiResponse = {
        success: true,
        message: 'Ticket created successfully!',
        data: newTicket,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all tickets.
   * GET /api/v1/tickets
   */
  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tickets = await this.service.getAllTickets();

      const response: ApiResponse = {
        success: true,
        message: 'Tickets retrieved successfully.',
        data: tickets,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single ticket by ID with full details.
   * GET /api/v1/tickets/:id
   */
  getById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const ticket = await this.service.getTicketById(req.params.id);

      const response: ApiResponse = {
        success: true,
        message: 'Ticket retrieved successfully.',
        data: ticket,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a ticket's status.
   * PATCH /api/v1/tickets/:id/status
   */
  updateStatus = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const { statusName, descriptionPublic, descriptionInternal } = req.body;
      const staffId = req.user.id;

      const result = await this.service.updateTicketStatus(
        id,
        statusName,
        descriptionPublic,
        descriptionInternal || null,
        staffId,
      );

      const response: ApiResponse = {
        success: true,
        message: 'Ticket status updated successfully.',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a ticket and all its related data.
   * DELETE /api/v1/tickets/:id
   */
  delete = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await this.service.deleteTicket(req.params.id);

      const response: ApiResponse = {
        success: true,
        message: 'Ticket deleted successfully.',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
