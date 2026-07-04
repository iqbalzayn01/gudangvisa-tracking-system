import { and, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { notifications } from '../../db/schema.js';

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

  /**
   * Mark as read, scoped to the owning client in the same UPDATE so ownership
   * can't race between a separate check and the write. Returns null when the
   * notification doesn't exist or belongs to another client.
   */
  async markAsRead(id: string, clientId: string) {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.id, id), eq(notifications.clientId, clientId)),
      )
      .returning();

    return updated ?? null;
  }

  async create(data: typeof notifications.$inferInsert) {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    return notification;
  }
}
