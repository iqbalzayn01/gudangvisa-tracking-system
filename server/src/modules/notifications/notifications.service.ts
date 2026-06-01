import { NotificationsRepository } from './notifications.repository.js';
import { AppError } from '../../utils/AppError.js';

export class NotificationsService {
  private repository = new NotificationsRepository();

  async getByClientId(clientId: string) {
    return await this.repository.findByClientId(clientId);
  }

  async markAsRead(notificationId: string, clientId: string) {
    const notification = await this.repository.findById(notificationId);
    if (!notification) {
      throw new AppError(404, 'Notification not found.');
    }
    if (notification.clientId !== clientId) {
      throw new AppError(403, 'Access denied: This notification is not yours.');
    }

    return await this.repository.markAsRead(notificationId);
  }
}
