import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { notifications } from '../../db/schema.js';
import { AppError } from '../../utils/AppError.js';

export class NotificationsRepository {
  async findByClientId(clientId: string) {
    return await db.query.notifications.findMany({
      where: eq(notifications.clientId, clientId),
      orderBy: (n, { desc }) => [desc(n.createdAt)],
      with: {
        application: {
          columns: { id: true, referenceNumber: true, visaType: true },
        },
      },
    });
  }

  async findById(id: string) {
    return await db.query.notifications.findFirst({
      where: eq(notifications.id, id),
    });
  }

  async markAsRead(id: string) {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();

    if (!updated) {
      throw new AppError(404, 'Notification not found or failed to update.');
    }

    return updated;
  }

  async create(data: typeof notifications.$inferInsert) {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    return notification;
  }
}
