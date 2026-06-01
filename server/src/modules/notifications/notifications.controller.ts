import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service.js';
import type { ApiResponse } from '../../types/index.js';
import { AppError } from '../../utils/AppError.js';

export class NotificationsController {
  private service = new NotificationsService();

  getMyNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.clientUser) throw new AppError(401, 'Client auth required.');
      const notifications = await this.service.getByClientId(
        req.clientUser.id,
      );

      const response: ApiResponse = {
        success: true,
        message: 'Notifications retrieved successfully.',
        data: notifications,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.clientUser) throw new AppError(401, 'Client auth required.');
      const notification = await this.service.markAsRead(
        req.params.id,
        req.clientUser.id,
      );

      const response: ApiResponse = {
        success: true,
        message: 'Notification marked as read.',
        data: notification,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
