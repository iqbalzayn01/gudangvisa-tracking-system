import { ApplicationsService } from './applications.service.js';
import {
  asyncHandler,
  sendSuccess,
  getStaffUser,
  getClientUser,
} from '../../utils/handler.js';
import { recordAudit } from '../../utils/audit.js';

export class ApplicationsController {
  private service = new ApplicationsService();

  create = asyncHandler(async (req, res) => {
    const staff = getStaffUser(req);
    const app = await this.service.createApplication(req.body, staff.id);

    await recordAudit(req, {
      action: 'CREATE',
      entityType: 'application',
      applicationId: app.id,
      newValues: { visaType: app.visaType, status: app.status },
    });

    sendSuccess(res, 201, 'Application created successfully!', app);
  });

  getAll = asyncHandler(async (_req, res) => {
    const apps = await this.service.getAllApplications();
    sendSuccess(res, 200, 'Applications retrieved successfully.', apps);
  });

  getById = asyncHandler<{ id: string }>(async (req, res) => {
    const app = await this.service.getApplicationById(req.params.id);
    sendSuccess(res, 200, 'Application retrieved successfully.', app);
  });

  updateStatus = asyncHandler<{ id: string }>(async (req, res) => {
    const staff = getStaffUser(req);
    const result = await this.service.updateApplicationStatus(
      req.params.id,
      req.body,
      staff.id,
    );

    await recordAudit(req, {
      action: 'STATUS_CHANGE',
      entityType: 'application',
      applicationId: req.params.id,
      newValues: { status: req.body.status, description: req.body.description },
    });

    sendSuccess(res, 200, 'Application status updated successfully.', result);
  });

  updateBiometric = asyncHandler<{ id: string }>(async (req, res) => {
    const staff = getStaffUser(req);
    const result = await this.service.updateBiometricSchedule(
      req.params.id,
      req.body,
      staff.id,
    );

    await recordAudit(req, {
      action: 'UPDATE',
      entityType: 'biometric',
      applicationId: req.params.id,
      newValues: {
        biometricStatus: req.body.biometricStatus,
        biometricDate: req.body.biometricDate,
      },
    });

    sendSuccess(res, 200, 'Biometric schedule updated successfully.', result);
  });

  toggleChecklist = asyncHandler<{ id: string }>(async (req, res) => {
    const staff = getStaffUser(req);
    const result = await this.service.toggleChecklistItem(
      req.params.id,
      req.body.itemIndex,
      req.body.isChecked,
      staff.id,
    );

    await recordAudit(req, {
      action: 'UPDATE',
      entityType: 'checklist',
      applicationId: req.params.id,
      newValues: {
        itemIndex: req.body.itemIndex,
        isChecked: req.body.isChecked,
      },
    });

    sendSuccess(res, 200, 'Checklist item updated successfully.', result);
  });

  delete = asyncHandler<{ id: string }>(async (req, res) => {
    await this.service.deleteApplication(req.params.id);

    // The application row is gone, so it can't be referenced via the FK —
    // keep its id in oldValues instead.
    await recordAudit(req, {
      action: 'DELETE',
      entityType: 'application',
      oldValues: { applicationId: req.params.id },
    });

    sendSuccess(res, 200, 'Application deleted successfully.');
  });

  getClientApplications = asyncHandler(async (req, res) => {
    const client = getClientUser(req);
    const apps = await this.service.getApplicationsByClientId(client.id);
    sendSuccess(res, 200, 'Your applications retrieved successfully.', apps);
  });
}
