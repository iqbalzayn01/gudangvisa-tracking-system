import { ClientAccountsRepository } from './client-accounts.repository.js';
import { AppError } from '../../utils/AppError.js';
import { deleteStorageFiles } from '../../utils/storage.js';
import type {
  CreateClientAccountInput,
  UpdateClientAccountInput,
} from './client-accounts.validation.js';

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

    const existingName = await this.repository.findByFullName(data.fullName);
    if (existingName) {
      throw new AppError(
        400,
        'Full name is already registered. Please use another name.',
      );
    }

    return await this.repository.createClient({
      fullName: data.fullName,
      email: data.email,
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

  async updateClient(id: string, data: UpdateClientAccountInput) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppError(404, 'Client account not found.');
    }

    if (data.fullName !== undefined) {
      const existingName = await this.repository.findByFullName(
        data.fullName,
        id,
      );
      if (existingName) {
        throw new AppError(
          400,
          'Full name is already registered. Please use another name.',
        );
      }
    }

    return await this.repository.updateById(id, data);
  }

  async removeClient(id: string) {
    // The DB cascade removes the client's applications/documents;
    // grab the document storage paths first so the bucket files go too.
    const filePaths = await this.repository.findDocumentPathsByClientId(id);
    const result = await this.repository.deleteById(id);
    await deleteStorageFiles(filePaths);
    return result;
  }
}
