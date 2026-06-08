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
    const [newApp] = await db.insert(applications).values(data).returning();

    if (!newApp) {
      throw new AppError(500, 'Database failed to create application.');
    }

    // Insert initial tracking history
    await db.insert(trackingHistory).values({
      applicationId: newApp.id,
      fromStatus: null,
      toStatus: 'draft',
      description: 'Application created and registered into the system.',
      changedByStaffId: data.assignedStaffId ?? null,
      isVisibleToClient: true,
    });

    return newApp;
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

  async findByClientId(clientId: string) {
    return await db.query.applications.findMany({
      where: eq(applications.clientId, clientId),
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      with: {
        trackingHistory: {
          orderBy: (h, { desc }) => [desc(h.createdAt)],
          where: eq(trackingHistory.isVisibleToClient, true),
        },
        documents: {
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
    fromStatus: ApplicationStatus,
    toStatus: NonNullable<ApplicationStatus>,
    description: string,
    isVisibleToClient: boolean,
    staffId: string,
  ) {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(applications)
        .set({
          status: toStatus,
          updatedAt: new Date(),
        })
        .where(eq(applications.id, appId))
        .returning();

      if (!updated) {
        throw new AppError(404, 'Application not found or failed to update.');
      }

      await tx.insert(trackingHistory).values({
        applicationId: appId,
        fromStatus,
        toStatus,
        description,
        changedByStaffId: staffId,
        isVisibleToClient,
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

  async updateChecklist(appId: string, checklist: ChecklistItem[]) {
    const [updated] = await db
      .update(applications)
      .set({
        checklist,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, appId))
      .returning();

    if (!updated) {
      throw new AppError(404, 'Application not found or failed to update.');
    }

    return updated;
  }

  async deleteById(appId: string) {
    return await db.transaction(async (tx) => {
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

      return deleted;
    });
  }
}
