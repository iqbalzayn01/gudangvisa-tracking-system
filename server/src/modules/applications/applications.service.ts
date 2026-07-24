import { ApplicationsRepository } from './applications.repository.js';
import { ClientAccountsRepository } from '../client-accounts/client-accounts.repository.js';
import { AppError } from '../../utils/AppError.js';
import { deleteStorageFiles } from '../../utils/storage.js';
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

type ApplicationStatus = UpdateStatusInput['status'];

/**
 * Pipeline progress per status. `cancelled` is absent on purpose: it
 * freezes the last reached progress instead of resetting it.
 */
const STATUS_PROGRESS: Partial<Record<ApplicationStatus, number>> = {
  draft: 0,
  document_verification: 25,
  immigration_processing: 50,
  approval_pending: 75,
  completed: 100,
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  document_verification: 'Document Verification',
  immigration_processing: 'Immigration Processing',
  approval_pending: 'Approval Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const MAX_REFERENCE_ATTEMPTS = 3;

/** Postgres unique-violation (SQLSTATE 23505), directly or via error.cause. */
function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const err = error as { code?: string; cause?: { code?: string } };
  return err.code === '23505' || err.cause?.code === '23505';
}

export class ApplicationsService {
  private repository = new ApplicationsRepository();
  private clientRepository = new ClientAccountsRepository();

  /** Last 4 digits of the client's phone number, used as the reference suffix. */
  private phoneSuffix(phone: string | null | undefined): string {
    const digits = (phone ?? '').replace(/\D/g, '');
    return digits.length >= 4 ? digits.slice(-4) : digits.padStart(4, '0');
  }

  /**
   * Generate reference number: GV-YYYY-NNNNN-PPPP, where NNNNN is a random
   * application number and PPPP is the client's own phone-number suffix.
   */
  private generateReferenceNumber(phoneSuffix: string): string {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `GV-${year}-${random}-${phoneSuffix}`;
  }

  async createApplication(data: CreateApplicationInput, staffId: string) {
    const checklist = DEFAULT_CHECKLIST[data.visaType] ?? [];
    const client = await this.clientRepository.findById(data.clientId);
    if (!client) throw new AppError(404, 'Client not found.');
    const phoneSuffix = this.phoneSuffix(client.phone);

    // The random part can collide (unique column) — retry with a fresh
    // number instead of surfacing a 500.
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.repository.create({
          referenceNumber: this.generateReferenceNumber(phoneSuffix),
          clientId: data.clientId,
          assignedStaffId: staffId,
          visaType: data.visaType,
          status: 'draft',
          progressPercentage: 0,
          notes: data.notes ?? null,
          checklist,
        });
      } catch (error) {
        if (attempt < MAX_REFERENCE_ATTEMPTS && isUniqueViolation(error)) {
          continue;
        }
        throw error;
      }
    }
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

    const progressPercentage = STATUS_PROGRESS[data.status];

    return await this.repository.updateStatus(appId, {
      fromStatus: app.status,
      toStatus: data.status,
      description:
        data.description?.trim() ||
        `Status updated to ${STATUS_LABELS[data.status]}.`,
      staffId,
      ...(progressPercentage !== undefined && { progressPercentage }),
    });
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
    return await this.repository.updateChecklistItem(
      appId,
      itemIndex,
      isChecked,
      staffId,
    );
  }

  /** Public, no-auth lookup by reference number ("nomor resi"). */
  async trackByReferenceNumber(referenceNumber: string) {
    const app = await this.repository.findByReferenceNumber(referenceNumber);
    if (!app) throw new AppError(404, 'Application not found.');
    return app;
  }

  async deleteApplication(appId: string) {
    const { deleted, filePaths } = await this.repository.deleteById(appId);
    // DB rows are gone; bucket cleanup is best-effort (logged, never thrown).
    await deleteStorageFiles(filePaths);
    return deleted;
  }
}
