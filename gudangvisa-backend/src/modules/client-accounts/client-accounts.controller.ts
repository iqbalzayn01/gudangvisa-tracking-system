import { Request, Response, NextFunction } from 'express';
import { ClientAccountsService } from './client-accounts.service.js';
import type { ApiResponse } from '../../types/index.js';

export class ClientAccountsController {
  private service = new ClientAccountsService();

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newClient = await this.service.createClientAccount(req.body);

      const response: ApiResponse = {
        success: true,
        message: 'Client account created successfully!',
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
        message: 'Client accounts retrieved successfully.',
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
        message: 'Client account retrieved successfully.',
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
        message: 'Client account deleted successfully.',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
