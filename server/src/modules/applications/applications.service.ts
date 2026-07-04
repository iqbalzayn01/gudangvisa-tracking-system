import { ApplicationsRepository } from './applications.repository.js';
import type { NotificationPayload } from './applications.repository.js';
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

type ApplicationStatus = UpdateStatusInput['status'];

/**
 * Pipeline progress per status. Terminal-failure and hold statuses
 * (rejected / cancelled / on_hold) are absent on purpose: they freeze the
 * last reached progress instead of resetting it.
 */
const STATUS_PROGRESS: Partial<Record<ApplicationStatus, number>> = {
  draft: 0,
  document_collection: 10,
  document_verification: 20,
  document_revision: 25,
  submission_to_immigration: 35,
  immigration_review: 45,
  biometric_scheduled: 55,
  biometric_completed: 65,
  immigration_processing: 75,
  approval_pending: 85,
  approved: 90,
  evisa_issued: 95,
  completed: 100,
};

/** Human-readable status labels used in client notifications. */
const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  document_collection: 'Document Collection',
  document_verification: 'Document Verification',
  document_revision: 'Document Revision',
  submission_to_immigration: 'Submitted to Immigration',
  immigration_review: 'Immigration Review',
  biometric_scheduled: 'Biometric Scheduled',
  biometric_completed: 'Biometric Completed',
  immigration_processing: 'Immigration Processing',
  approval_pending: 'Approval Pending',
  approved: 'Approved',
  evisa_issued: 'e-Visa Issued',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  on_hold: 'On Hold',
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

  /**
   * Generate reference number: GV-YYYY-NNNNN
   */
  private generateReferenceNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `GV-${year}-${random}`;
  }

  async createApplication(data: CreateApplicationInput, staffId: string) {
    const checklist = DEFAULT_CHECKLIST[data.visaType] ?? [];

    // The random reference can collide (unique column) — retry with a fresh
    // number instead of surfacing a 500.
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.repository.create({
          referenceNumber: this.generateReferenceNumber(),
          clientId: data.clientId,
          assignedStaffId: staffId,
          visaType: data.visaType,
          status: 'draft',
          priority: data.priority ?? 'medium',
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
      description: data.description,
      isVisibleToClient: data.isVisibleToClient,
      staffId,
      ...(progressPercentage !== undefined && { progressPercentage }),
      notification: {
        title: `Application update: ${STATUS_LABELS[data.status]}`,
        message: data.description,
      },
    });
  }

  async updateBiometricSchedule(
    appId: string,
    data: UpdateBiometricInput,
    staffId: string,
  ) {
    const app = await this.repository.findById(appId);
    if (!app) throw new AppError(404, 'Application not found.');

    const notification = this.buildBiometricNotification(data);

    return await this.repository.updateBiometric(appId, {
      biometricStatus: data.biometricStatus,
      biometricDate: data.biometricDate ?? null,
      biometricTime: data.biometricTime ?? null,
      biometricLocation: data.biometricLocation ?? null,
      fieldAssistantName: data.fieldAssistantName ?? null,
      fieldAssistantPhone: data.fieldAssistantPhone ?? null,
      biometricScheduledBy: staffId,
      biometricScheduledAt: new Date(),
      ...(notification && { notification }),
    });
  }

  /** Client notification for appointment-relevant biometric changes only. */
  private buildBiometricNotification(
    data: UpdateBiometricInput,
  ): NotificationPayload | null {
    const titles: Partial<Record<UpdateBiometricInput['biometricStatus'], string>> = {
      scheduled: 'Biometric appointment scheduled',
      rescheduled: 'Biometric appointment rescheduled',
      cancelled: 'Biometric appointment cancelled',
    };
    const title = titles[data.biometricStatus];
    if (!title) return null;

    if (data.biometricStatus === 'cancelled') {
      return { title, message: 'Your biometric appointment has been cancelled.' };
    }

    const parts = [
      data.biometricDate && `on ${data.biometricDate}`,
      data.biometricTime && `at ${data.biometricTime}`,
      data.biometricLocation && `— ${data.biometricLocation}`,
    ].filter(Boolean);
    return {
      title,
      message: `Your biometric appointment is ${parts.length ? parts.join(' ') : 'being arranged'}.`,
    };
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

  async getApplicationsByClientId(clientId: string) {
    return await this.repository.findByClientId(clientId);
  }

  async deleteApplication(appId: string) {
    const { deleted, filePaths } = await this.repository.deleteById(appId);
    // DB rows are gone; bucket cleanup is best-effort (logged, never thrown).
    await deleteStorageFiles(filePaths);
    return deleted;
  }
}
