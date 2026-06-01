import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { clientAccounts } from '../../db/schema.js';

export class AuthClientRepository {
  async findByEmail(email: string) {
    return await db.query.clientAccounts.findFirst({
      where: eq(clientAccounts.email, email),
    });
  }

  async findById(id: string) {
    return await db.query.clientAccounts.findFirst({
      where: eq(clientAccounts.id, id),
    });
  }
}
