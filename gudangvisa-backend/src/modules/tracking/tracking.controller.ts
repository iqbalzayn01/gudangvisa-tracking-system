import { Request, Response, NextFunction } from 'express';
import { TrackingService } from './tracking.service.js';
import { ApiResponse } from '../../types/index.js';

export class TrackingController {
  private service = new TrackingService();

  /**
   * Public tracking by code.
   * GET /api/v1/tracking/:code
   */
  trackByCode = async (
    req: Request<{ code: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { code } = req.params;
      const result = await this.service.getTrackingDetails(code);

      const response: ApiResponse = {
        success: true,
        message: 'Ticket found.',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update status via tracking module (staff).
   * PATCH /api/v1/tracking/:id/status
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

      const result = await this.service.processStatusUpdate(
        id,
        statusName,
        descriptionPublic,
        descriptionInternal || null,
        staffId,
      );

      const response: ApiResponse = {
        success: true,
        message: 'Status updated successfully.',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
