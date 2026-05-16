import bcrypt from 'bcryptjs';
import { UsersRepository } from './users.repository.js';
import { AppError } from '../../utils/AppError.js';

export class UsersService {
  private repository = new UsersRepository();

  async createNewStaff(data: {
    fullName: string;
    email: string;
    password: string;
    role?: string;
  }) {
    // 1. Check if the email already exists
    const existingUser = await this.repository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError(
        400,
        'Email is already registered. Please use another email.',
      );
    }

    // 2. Hash the password for security
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // 3. Prepare the safe data to save
    const newUserData = {
      fullName: data.fullName,
      email: data.email,
      passwordHash: hashedPassword,
      role: (data.role as 'STAFF' | 'ADMIN') || 'STAFF',
    };

    // 4. Save to database
    return await this.repository.createUser(newUserData);
  }

  async getAllStaff() {
    return await this.repository.findAllUsers();
  }

  async removeStaff(userId: string) {
    return await this.repository.deleteUserById(userId);
  }
}
