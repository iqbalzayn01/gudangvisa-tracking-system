import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { staffAccounts } from '../../db/schema.js';
import { AppError } from '../../utils/AppError.js';

/** Safe-to-return staff columns — everything except passwordHash/updatedAt. */
const staffPublicColumns = {
  id: staffAccounts.id,
  fullName: staffAccounts.fullName,
  email: staffAccounts.email,
  role: staffAccounts.role,
  phone: staffAccounts.phone,
  isActive: staffAccounts.isActive,
  createdAt: staffAccounts.createdAt,
};

export class StaffAccountsRepository {
  async findByEmail(email: string) {
    return await db.query.staffAccounts.findFirst({
      where: eq(staffAccounts.email, email),
    });
  }

  async createStaff(
    data: Omit<typeof staffAccounts.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>,
  ) {
    const [newStaff] = await db
      .insert(staffAccounts)
      .values(data)
      .returning(staffPublicColumns);

    if (!newStaff) {
      throw new AppError(500, 'Database failed to create staff account.');
    }

    return newStaff;
  }

  async findAll() {
    return await db.select(staffPublicColumns).from(staffAccounts);
  }

  async deleteById(id: string) {
    const [deleted] = await db
      .delete(staffAccounts)
      .where(eq(staffAccounts.id, id))
      .returning({ id: staffAccounts.id });

    if (!deleted) {
      throw new AppError(404, 'Staff account not found or already deleted.');
    }

    return true;
  }
}
