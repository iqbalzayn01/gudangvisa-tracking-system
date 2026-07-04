import { NotificationsService } from './notifications.service.js';
import {
  asyncHandler,
  sendSuccess,
  getClientUser,
} from '../../utils/handler.js';

export class NotificationsController {
  private service = new NotificationsService();

  getMyNotifications = asyncHandler(async (req, res) => {
    const client = getClientUser(req);
    const notifications = await this.service.getByClientId(client.id);
    sendSuccess(res, 200, 'Notifications retrieved successfully.', notifications);
  });

  markAsRead = asyncHandler<{ id: string }>(async (req, res) => {
    const client = getClientUser(req);
    const notification = await this.service.markAsRead(
      req.params.id,
      client.id,
    );
    sendSuccess(res, 200, 'Notification marked as read.', notification);
  });
}
