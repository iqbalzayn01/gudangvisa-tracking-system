import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { clients } from '../../db/schema.js';
import { AppError } from '../../utils/AppError.js';

export class ClientsRepository {
  async createClient(data: typeof clients.$inferInsert) {
    const [newClient] = await db.insert(clients).values(data).returning();

    if (!newClient) {
      throw new AppError(500, 'Database failed to create a new client.');
    }

    return newClient;
  }

  async findAll() {
    return await db.query.clients.findMany({
      orderBy: (c, { desc }) => [desc(c.createdAt)],
    });
  }

  async findById(id: string) {
    return await db.query.clients.findFirst({
      where: eq(clients.id, id),
    });
  }

  async deleteById(id: string) {
    const [deletedClient] = await db
      .delete(clients)
      .where(eq(clients.id, id))
      .returning({ id: clients.id });

    if (!deletedClient) {
      throw new AppError(404, 'Client not found or already deleted.');
    }

    return true;
  }
}
