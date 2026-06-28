import { ApplicationsRepository } from './applications.repository.js';
import { AppError } from '../../utils/AppError.js';
import type {
  CreateApplicationInput,
  UpdateStatusInput,
  UpdateBiometricInput,
} from './applications.validation.js';
import type { ChecklistItem } from '../../types/index.js';

// Default document checklist per visa type. Each item corresponds to a real
// `documentType` so checklist progress maps onto uploaded professional
// documents (Indonesian KITAS immigration workflow).
const DEFAULT_CHECKLIST: Record<string, ChecklistItem[]> = {
  B211A: [
    { name: 'Passport (min 6 months validity)', isChecked: false },
    { name: 'Passport-size Photo (4x6)', isChecked: false },
    { name: 'Sponsor Letter', isChecked: false },
    { name: 'Bank Statement', isChecked: false },
  ],
  KITAS_WORKING: [
    { name: 'Passport (min 18 months validity)', isChecked: false },
    { name: 'Passport-size Photo (4x6)', isChecked: false },
    { name: 'RPTKA Approval (Kemnaker)', isChecked: false },
    { name: 'Notifikasi / Work Permit (IMTA)', isChecked: false },
    { name: 'DKPTKA / DPKK Payment Proof', isChecked: false },
    { name: 'Sponsor Letter', isChecked: false },
    { name: 'Company NIB', isChecked: false },
    { name: 'Curriculum Vitae (CV)', isChecked: false },
    { name: 'Diploma / Qualification Certificate', isChecked: false },
    { name: 'Bank Statement', isChecked: false },
  ],
  KITAS_SPOUSE: [
    { name: 'Passport (min 18 months validity)', isChecked: false },
    { name: 'Passport-size Photo (4x6)', isChecked: false },
    { name: 'Sponsor Letter (Indonesian spouse)', isChecked: false },
    { name: 'Marriage Certificate', isChecked: false },
  ],
  KITAS_INVESTOR: [
    { name: 'Passport (min 18 months validity)', isChecked: false },
    { name: 'Passport-size Photo (4x6)', isChecked: false },
    { name: 'Company NIB', isChecked: false },
    { name: 'Sponsor Letter', isChecked: false },
    { name: 'Bank Statement', isChecked: false },
  ],
  KITAS_RETIREMENT: [
    { name: 'Passport (min 18 months validity)', isChecked: false },
    { name: 'Passport-size Photo (4x6)', isChecked: false },
    { name: 'Bank Statement', isChecked: false },
    { name: 'Insurance Certificate', isChecked: false },
  ],
};

export class ApplicationsService {
  private repository = new ApplicationsRepository();

  /**
   * Generate reference number: GV-YYYY-NNNNN
   */
  private generateReferenceNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `GV-${year}-${random}`;
  }

  async createApplication(data: CreateApplicationInput, staffId: string) {
    const referenceNumber = this.generateReferenceNumber();
    const checklist = DEFAULT_CHECKLIST[data.visaType] ?? [];

    return await this.repository.create({
      referenceNumber,
      clientId: data.clientId,
      assignedStaffId: staffId,
      visaType: data.visaType,
      status: 'draft',
      priority: data.priority ?? 'medium',
      progressPercentage: 0,
      notes: data.notes ?? null,
      checklist,
    });
  }

  async getAllApplications() {
    return await this.repository.findAll();
  }

  async getApplicationById(id: string) {
    const app = await this.repository.findById(id);
    if (!app) throw new AppError(404, 'Application not found.');
    return app;
  }

  async updateApplicationStatus(
    appId: string,
    data: UpdateStatusInput,
    staffId: string,
  ) {
    const app = await this.repository.findById(appId);
    if (!app) throw new AppError(404, 'Application not found.');

    if (app.status === 'completed' || app.status === 'cancelled') {
      throw new AppError(
        400,
        `Cannot update status: application is already ${app.status}.`,
      );
    }

    return await this.repository.updateStatus(
      appId,
      app.status,
      data.status,
      data.description,
      data.isVisibleToClient,
      staffId,
    );
  }

  async updateBiometricSchedule(
    appId: string,
    data: UpdateBiometricInput,
    staffId: string,
  ) {
    const app = await this.repository.findById(appId);
    if (!app) throw new AppError(404, 'Application not found.');

    return await this.repository.updateBiometric(appId, {
      biometricStatus: data.biometricStatus,
      biometricDate: data.biometricDate ?? null,
      biometricTime: data.biometricTime ?? null,
      biometricLocation: data.biometricLocation ?? null,
      fieldAssistantName: data.fieldAssistantName ?? null,
      fieldAssistantPhone: data.fieldAssistantPhone ?? null,
      biometricScheduledBy: staffId,
      biometricScheduledAt: new Date(),
    });
  }

  async toggleChecklistItem(
    appId: string,
    itemIndex: number,
    isChecked: boolean,
    staffId: string,
  ) {
    const app = await this.repository.findById(appId);
    if (!app) throw new AppError(404, 'Application not found.');

    const checklist = (app.checklist ?? []) as ChecklistItem[];

    if (itemIndex < 0 || itemIndex >= checklist.length) {
      throw new AppError(400, 'Invalid checklist item index.');
    }

    const item = checklist[itemIndex];
    if (!item) throw new AppError(400, 'Checklist item not found.');

    item.isChecked = isChecked;
    item.checkedAt = isChecked ? new Date().toISOString() : undefined;
    item.checkedByStaffId = isChecked ? staffId : undefined;

    return await this.repository.updateChecklist(appId, checklist);
  }

  async getApplicationsByClientId(clientId: string) {
    return await this.repository.findByClientId(clientId);
  }

  async deleteApplication(appId: string) {
    return await this.repository.deleteById(appId);
  }
}
