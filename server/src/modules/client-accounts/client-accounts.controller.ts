import { ClientAccountsService } from './client-accounts.service.js';
import { asyncHandler, sendSuccess } from '../../utils/handler.js';
import { recordAudit } from '../../utils/audit.js';

export class ClientAccountsController {
  private service = new ClientAccountsService();

  create = asyncHandler(async (req, res) => {
    const newClient = await this.service.createClientAccount(req.body);

    await recordAudit(req, {
      action: 'CREATE',
      entityType: 'client',
      newValues: { email: req.body.email, fullName: req.body.fullName },
    });

    sendSuccess(res, 201, 'Client account created successfully!', newClient);
  });

  getAll = asyncHandler(async (_req, res) => {
    const clients = await this.service.getAllClients();
    sendSuccess(res, 200, 'Client accounts retrieved successfully.', clients);
  });

  getById = asyncHandler<{ id: string }>(async (req, res) => {
    const client = await this.service.getClientById(req.params.id);
    sendSuccess(res, 200, 'Client account retrieved successfully.', client);
  });

  update = asyncHandler<{ id: string }>(async (req, res) => {
    const updated = await this.service.updateClient(req.params.id, req.body);

    await recordAudit(req, {
      action: 'UPDATE',
      entityType: 'client',
      newValues: { clientId: req.params.id, ...req.body },
    });

    sendSuccess(res, 200, 'Client account updated successfully.', updated);
  });

  delete = asyncHandler<{ id: string }>(async (req, res) => {
    await this.service.removeClient(req.params.id);

    await recordAudit(req, {
      action: 'DELETE',
      entityType: 'client',
      oldValues: { clientId: req.params.id },
    });

    sendSuccess(res, 200, 'Client account deleted successfully.');
  });
}
