import bcrypt from 'bcryptjs';
import { ClientAccountsRepository } from './client-accounts.repository.js';
import { AppError } from '../../utils/AppError.js';
import type { CreateClientAccountInput } from './client-accounts.validation.js';

export class ClientAccountsService {
  private repository = new ClientAccountsRepository();

  async createClientAccount(data: CreateClientAccountInput) {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new AppError(
        400,
        'Email is already registered. Please use another email.',
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    return await this.repository.createClient({
      fullName: data.fullName,
      email: data.email,
      passwordHash: hashedPassword,
      passportNumber: data.passportNumber,
      nationality: data.nationality,
      phone: data.phone ?? null,
    });
  }

  async getAllClients() {
    return await this.repository.findAll();
  }

  async getClientById(id: string) {
    const client = await this.repository.findById(id);
    if (!client) {
      throw new AppError(404, 'Client account not found.');
    }
    return client;
  }

  async removeClient(id: string) {
    return await this.repository.deleteById(id);
  }
}
