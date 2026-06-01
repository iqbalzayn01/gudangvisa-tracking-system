import bcrypt from 'bcryptjs';
import { StaffAccountsRepository } from './staff-accounts.repository.js';
import { AppError } from '../../utils/AppError.js';
import type { CreateStaffInput } from './staff-accounts.validation.js';

export class StaffAccountsService {
  private repository = new StaffAccountsRepository();

  async createNewStaff(data: CreateStaffInput) {
    const existingStaff = await this.repository.findByEmail(data.email);
    if (existingStaff) {
      throw new AppError(
        400,
        'Email is already registered. Please use another email.',
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    return await this.repository.createStaff({
      fullName: data.fullName,
      email: data.email,
      passwordHash: hashedPassword,
      role: data.role ?? 'staff',
      phone: data.phone ?? null,
    });
  }

  async getAllStaff() {
    return await this.repository.findAll();
  }

  async removeStaff(id: string) {
    return await this.repository.deleteById(id);
  }
}
