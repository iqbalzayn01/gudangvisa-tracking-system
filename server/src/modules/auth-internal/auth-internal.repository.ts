import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { staffAccounts } from '../../db/schema.js';

export class AuthInternalRepository {
  async findByEmail(email: string) {
    return await db.query.staffAccounts.findFirst({
      where: eq(staffAccounts.email, email),
    });
  }

  async findById(id: string) {
    return await db.query.staffAccounts.findFirst({
      where: eq(staffAccounts.id, id),
    });
  }
}
