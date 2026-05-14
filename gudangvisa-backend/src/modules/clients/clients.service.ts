import { ClientsRepository } from './clients.repository.js';
import { AppError } from '../../utils/AppError.js';

export class ClientsService {
  private repository = new ClientsRepository();

  async createClient(
    data: {
      name: string;
      passportNumber?: string;
      contactNumber?: string;
    },
    staffId: string,
  ) {
    return await this.repository.createClient({
      name: data.name,
      passportNumber: data.passportNumber || null,
      contactNumber: data.contactNumber || null,
      createdBy: staffId,
    });
  }

  async getAllClients() {
    return await this.repository.findAll();
  }

  async getClientById(id: string) {
    const client = await this.repository.findById(id);
    if (!client) {
      throw new AppError(404, 'Client not found.');
    }
    return client;
  }

  async removeClient(id: string) {
    return await this.repository.deleteById(id);
  }
}
