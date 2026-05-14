import { Request, Response, NextFunction } from 'express';
import { ClientsService } from './clients.service.js';
import { ApiResponse } from '../../types/index.js';

export class ClientsController {
  private service = new ClientsService();

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const staffId = req.user.id;
      const newClient = await this.service.createClient(req.body, staffId);

      const response: ApiResponse = {
        success: true,
        message: 'Client created successfully!',
        data: newClient,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const clients = await this.service.getAllClients();

      const response: ApiResponse = {
        success: true,
        message: 'Clients retrieved successfully.',
        data: clients,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const client = await this.service.getClientById(req.params.id);

      const response: ApiResponse = {
        success: true,
        message: 'Client retrieved successfully.',
        data: client,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await this.service.removeClient(req.params.id);

      const response: ApiResponse = {
        success: true,
        message: 'Client deleted successfully.',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
