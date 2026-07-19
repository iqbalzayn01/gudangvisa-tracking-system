import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  applications,
  trackingHistory,
  applicationDocuments,
} from '../../db/schema.js';
import { AppError } from '../../utils/AppError.js';
import type { ChecklistItem } from '../../types/index.js';

type ApplicationStatus = typeof applications.$inferInsert.status;

export class ApplicationsRepository {
  async create(data: typeof applications.$inferInsert) {
    // Application + initial history must land together — a partial write would
    // leave an application without a timeline.
    return await db.transaction(async (tx) => {
      const [newApp] = await tx.insert(applications).values(data).returning();

      if (!newApp) {
        throw new AppError(500, 'Database failed to create application.');
      }

      await tx.insert(trackingHistory).values({
        applicationId: newApp.id,
        fromStatus: null,
        toStatus: 'draft',
        description: 'Application created and registered into the system.',
        changedByStaffId: data.assignedStaffId ?? null,
      });

      return newApp;
    });
  }

  async findAll() {
    return await db.query.applications.findMany({
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      with: {
        client: {
          columns: { id: true, fullName: true, email: true, passportNumber: true },
        },
        assignedStaff: {
          columns: { id: true, fullName: true, role: true },
        },
      },
    });
  }

  async findById(id: string) {
    return await db.query.applications.findFirst({
      where: eq(applications.id, id),
      with: {
        client: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            passportNumber: true,
            nationality: true,
            phone: true,
          },
        },
        assignedStaff: {
          columns: { id: true, fullName: true, role: true },
        },
        documents: true,
        trackingHistory: {
          orderBy: (h, { desc }) => [desc(h.createdAt)],
          with: {
            changedByStaff: {
              columns: { id: true, fullName: true },
            },
          },
        },
      },
    });
  }

  /**
   * Public, no-auth lookup by reference number ("nomor resi"). Returns a
   * client-safe shape only — no internal staff notes, no full client PII
   * beyond the owner's name, and documents limited to verified ones.
   */
  async findByReferenceNumber(referenceNumber: string) {
    return await db.query.applications.findFirst({
      where: eq(applications.referenceNumber, referenceNumber),
      columns: {
        id: true,
        referenceNumber: true,
        visaType: true,
        priority: true,
        status: true,
        progressPercentage: true,
        createdAt: true,
      },
      with: {
        client: {
          columns: { fullName: true },
        },
        trackingHistory: {
          orderBy: (h, { desc }) => [desc(h.createdAt)],
          columns: {
            id: true,
            fromStatus: true,
            toStatus: true,
            description: true,
            createdAt: true,
          },
        },
        documents: {
          where: eq(applicationDocuments.status, 'verified'),
          columns: {
            id: true,
            documentType: true,
            fileName: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async updateStatus(
    appId: string,
    data: {
      fromStatus: ApplicationStatus;
      toStatus: NonNullable<ApplicationStatus>;
      description: string;
      staffId: string;
      /** Undefined = keep the current value (terminal/hold statuses). */
      progressPercentage?: number;
    },
  ) {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(applications)
        .set({
          status: data.toStatus,
          updatedAt: new Date(),
          ...(data.progressPercentage !== undefined && {
            progressPercentage: data.progressPercentage,
          }),
        })
        .where(eq(applications.id, appId))
        .returning();

      if (!updated) {
        throw new AppError(404, 'Application not found or failed to update.');
      }

      await tx.insert(trackingHistory).values({
        applicationId: appId,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        description: data.description,
        changedByStaffId: data.staffId,
      });

      return updated;
    });
  }

  async updateBiometric(
    appId: string,
    data: {
      biometricStatus: NonNullable<typeof applications.$inferInsert.biometricStatus>;
      biometricDate: string | null;
      biometricTime: string | null;
      biometricLocation: string | null;
      fieldAssistantName: string | null;
      fieldAssistantPhone: string | null;
      biometricScheduledBy: string;
      biometricScheduledAt: Date;
    },
  ) {
    const [updated] = await db
      .update(applications)
      .set({
        biometricStatus: data.biometricStatus,
        biometricDate: data.biometricDate,
        biometricTime: data.biometricTime,
        biometricLocation: data.biometricLocation,
        fieldAssistantName: data.fieldAssistantName,
        fieldAssistantPhone: data.fieldAssistantPhone,
        biometricScheduledBy: data.biometricScheduledBy,
        biometricScheduledAt: data.biometricScheduledAt,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, appId))
      .returning();

    if (!updated) {
      throw new AppError(404, 'Application not found or failed to update.');
    }

    return updated;
  }

  /**
   * Toggle one checklist item atomically. The row is locked (FOR UPDATE) for
   * the read-modify-write so concurrent toggles can't overwrite each other's
   * changes to the JSONB array.
   */
  async updateChecklistItem(
    appId: string,
    itemIndex: number,
    isChecked: boolean,
    staffId: string,
  ) {
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .select({ checklist: applications.checklist })
        .from(applications)
        .where(eq(applications.id, appId))
        .for('update');

      if (!row) throw new AppError(404, 'Application not found.');

      const checklist = (row.checklist ?? []) as ChecklistItem[];
      const item = itemIndex >= 0 ? checklist[itemIndex] : undefined;
      if (!item) throw new AppError(400, 'Invalid checklist item index.');

      item.isChecked = isChecked;
      item.checkedAt = isChecked ? new Date().toISOString() : undefined;
      item.checkedByStaffId = isChecked ? staffId : undefined;

      const [updated] = await tx
        .update(applications)
        .set({ checklist, updatedAt: new Date() })
        .where(eq(applications.id, appId))
        .returning();

      if (!updated) {
        throw new AppError(404, 'Application not found or failed to update.');
      }

      return updated;
    });
  }

  /**
   * Delete an application with its history/documents and return the storage
   * paths of the removed documents so the caller can clean up the bucket.
   */
  async deleteById(appId: string) {
    return await db.transaction(async (tx) => {
      const docs = await tx
        .select({ filePath: applicationDocuments.filePath })
        .from(applicationDocuments)
        .where(eq(applicationDocuments.applicationId, appId));

      await tx
        .delete(trackingHistory)
        .where(eq(trackingHistory.applicationId, appId));

      await tx
        .delete(applicationDocuments)
        .where(eq(applicationDocuments.applicationId, appId));

      const [deleted] = await tx
        .delete(applications)
        .where(eq(applications.id, appId))
        .returning();

      if (!deleted) {
        throw new AppError(404, 'Application not found or already deleted.');
      }

      return { deleted, filePaths: docs.map((d) => d.filePath) };
    });
  }
}
