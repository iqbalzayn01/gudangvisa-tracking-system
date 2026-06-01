import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { clientAccounts } from '../../db/schema.js';
import { AppError } from '../../utils/AppError.js';

export class ClientAccountsRepository {
  async findByEmail(email: string) {
    return await db.query.clientAccounts.findFirst({
      where: eq(clientAccounts.email, email),
    });
  }

  async findById(id: string) {
    return await db.query.clientAccounts.findFirst({
      where: eq(clientAccounts.id, id),
      columns: {
        id: true,
        fullName: true,
        email: true,
        passportNumber: true,
        nationality: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async createClient(
    data: Omit<typeof clientAccounts.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>,
  ) {
    const [newClient] = await db
      .insert(clientAccounts)
      .values(data)
      .returning({
        id: clientAccounts.id,
        fullName: clientAccounts.fullName,
        email: clientAccounts.email,
        passportNumber: clientAccounts.passportNumber,
        nationality: clientAccounts.nationality,
        phone: clientAccounts.phone,
        isActive: clientAccounts.isActive,
        createdAt: clientAccounts.createdAt,
      });

    if (!newClient) {
      throw new AppError(500, 'Database failed to create client account.');
    }

    return newClient;
  }

  async findAll() {
    return await db
      .select({
        id: clientAccounts.id,
        fullName: clientAccounts.fullName,
        email: clientAccounts.email,
        passportNumber: clientAccounts.passportNumber,
        nationality: clientAccounts.nationality,
        phone: clientAccounts.phone,
        isActive: clientAccounts.isActive,
        createdAt: clientAccounts.createdAt,
      })
      .from(clientAccounts);
  }

  async deleteById(id: string) {
    const [deleted] = await db
      .delete(clientAccounts)
      .where(eq(clientAccounts.id, id))
      .returning({ id: clientAccounts.id });

    if (!deleted) {
      throw new AppError(404, 'Client account not found or already deleted.');
    }

    return true;
  }
}
