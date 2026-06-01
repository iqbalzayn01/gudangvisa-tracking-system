import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  integer,
  pgEnum,
  text,
  date,
  time,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==========================================
// ENUM DEFINITIONS (PostgreSQL Native Enums)
// ==========================================
export const internalRoleEnum = pgEnum('internal_role', ['admin', 'staff']);

export const applicationStatusEnum = pgEnum('application_status', [
  'draft',
  'document_collection',
  'document_verification',
  'document_revision',
  'submission_to_immigration',
  'immigration_review',
  'biometric_scheduled',
  'biometric_completed',
  'immigration_processing',
  'approval_pending',
  'approved',
  'evisa_issued',
  'completed',
  'rejected',
  'cancelled',
  'on_hold',
]);

export const visaTypeEnum = pgEnum('visa_type', [
  'B211A',
  'KITAS_WORKING',
  'KITAS_SPOUSE',
  'KITAS_INVESTOR',
  'KITAS_RETIREMENT',
]);

export const documentTypeEnum = pgEnum('document_type', [
  'passport',
  'photo',
  'sponsor_letter',
  'company_nib',
  'bank_statement',
  'rejection_letter',
  'final_evisa',
]);

export const documentStatusEnum = pgEnum('document_status', [
  'pending',
  'verified',
  'rejected',
]);

export const biometricStatusEnum = pgEnum('biometric_status', [
  'not_scheduled',
  'scheduled',
  'completed',
  'rescheduled',
  'cancelled',
  'no_show',
]);

// ==========================================
// 1. STAFF_ACCOUNTS (Admin / Staff Internal)
// ==========================================
export const staffAccounts = pgTable('staff_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: internalRoleEnum('role').default('staff').notNull(),
  phone: varchar('phone', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// 2. CLIENT_ACCOUNTS (Pelanggan / External)
// ==========================================
export const clientAccounts = pgTable('client_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  passportNumber: varchar('passport_number', { length: 50 }).notNull(),
  nationality: varchar('nationality', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// 3. APPLICATIONS (Visa Tracking - Merged Biometric + JSONB Checklist)
// ==========================================
export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    referenceNumber: varchar('reference_number', { length: 20 })
      .unique()
      .notNull(),
    clientId: uuid('client_id')
      .references(() => clientAccounts.id, { onDelete: 'cascade' })
      .notNull(),
    assignedStaffId: uuid('assigned_staff_id').references(
      () => staffAccounts.id,
      { onDelete: 'set null' },
    ),
    visaType: visaTypeEnum('visa_type').notNull(),
    status: applicationStatusEnum('status').default('draft').notNull(),
    progressPercentage: integer('progress_percentage').default(0).notNull(),
    notes: text('notes'),

    // Checklist JSONB: [{ name: string, isChecked: boolean, checkedAt?: string, checkedByStaffId?: string }]
    checklist: jsonb('checklist').default([]).notNull(),

    // Merged Biometric Fields (eliminates separate biometric_schedules table)
    biometricStatus: biometricStatusEnum('biometric_status')
      .default('not_scheduled')
      .notNull(),
    biometricDate: date('biometric_date'),
    biometricTime: time('biometric_time'),
    biometricLocation: varchar('biometric_location', { length: 500 }),
    fieldAssistantName: varchar('field_assistant_name', { length: 255 }),
    fieldAssistantPhone: varchar('field_assistant_phone', { length: 50 }),
    biometricScheduledBy: uuid('biometric_scheduled_by').references(
      () => staffAccounts.id,
      { onDelete: 'set null' },
    ),
    biometricScheduledAt: timestamp('biometric_scheduled_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    clientIdIdx: index('applications_client_id_idx').on(table.clientId),
    referenceNumberIdx: index('applications_reference_number_idx').on(
      table.referenceNumber,
    ),
    statusIdx: index('applications_status_idx').on(table.status),
  }),
);

// ==========================================
// 4. APPLICATION_DOCUMENTS
// ==========================================
export const applicationDocuments = pgTable('application_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id')
    .references(() => applications.id, { onDelete: 'cascade' })
    .notNull(),
  documentType: documentTypeEnum('document_type').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  status: documentStatusEnum('status').default('pending').notNull(),
  rejectionReason: text('rejection_reason'),
  verifiedByStaffId: uuid('verified_by_staff_id').references(
    () => staffAccounts.id,
    { onDelete: 'set null' },
  ),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// 5. TRACKING_HISTORY
// ==========================================
export const trackingHistory = pgTable('tracking_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id')
    .references(() => applications.id, { onDelete: 'cascade' })
    .notNull(),
  fromStatus: applicationStatusEnum('from_status'),
  toStatus: applicationStatusEnum('to_status').notNull(),
  description: text('description').notNull(),
  changedByStaffId: uuid('changed_by_staff_id').references(
    () => staffAccounts.id,
    { onDelete: 'set null' },
  ),
  isVisibleToClient: boolean('is_visible_to_client').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 6. NOTIFICATIONS
// ==========================================
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .references(() => clientAccounts.id, { onDelete: 'cascade' })
    .notNull(),
  applicationId: uuid('application_id')
    .references(() => applications.id, { onDelete: 'cascade' })
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 7. AUDIT_LOGS
// ==========================================
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').references(() => staffAccounts.id, {
    onDelete: 'set null',
  }),
  applicationId: uuid('application_id').references(() => applications.id, {
    onDelete: 'set null',
  }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// DRIZZLE RELATIONS
// ==========================================
export const staffAccountsRelations = relations(staffAccounts, ({ many }) => ({
  assignedApplications: many(applications, { relationName: 'assignedStaff' }),
  verifiedDocuments: many(applicationDocuments),
  trackingHistoryUpdates: many(trackingHistory),
  auditLogs: many(auditLogs),
}));

export const clientAccountsRelations = relations(
  clientAccounts,
  ({ many }) => ({
    applications: many(applications),
    notifications: many(notifications),
  }),
);

export const applicationsRelations = relations(
  applications,
  ({ one, many }) => ({
    client: one(clientAccounts, {
      fields: [applications.clientId],
      references: [clientAccounts.id],
    }),
    assignedStaff: one(staffAccounts, {
      fields: [applications.assignedStaffId],
      references: [staffAccounts.id],
      relationName: 'assignedStaff',
    }),
    biometricScheduler: one(staffAccounts, {
      fields: [applications.biometricScheduledBy],
      references: [staffAccounts.id],
      relationName: 'biometricScheduler',
    }),
    documents: many(applicationDocuments),
    trackingHistory: many(trackingHistory),
    notifications: many(notifications),
    auditLogs: many(auditLogs),
  }),
);

export const applicationDocumentsRelations = relations(
  applicationDocuments,
  ({ one }) => ({
    application: one(applications, {
      fields: [applicationDocuments.applicationId],
      references: [applications.id],
    }),
    verifiedByStaff: one(staffAccounts, {
      fields: [applicationDocuments.verifiedByStaffId],
      references: [staffAccounts.id],
    }),
  }),
);

export const trackingHistoryRelations = relations(
  trackingHistory,
  ({ one }) => ({
    application: one(applications, {
      fields: [trackingHistory.applicationId],
      references: [applications.id],
    }),
    changedByStaff: one(staffAccounts, {
      fields: [trackingHistory.changedByStaffId],
      references: [staffAccounts.id],
    }),
  }),
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  client: one(clientAccounts, {
    fields: [notifications.clientId],
    references: [clientAccounts.id],
  }),
  application: one(applications, {
    fields: [notifications.applicationId],
    references: [applications.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  staff: one(staffAccounts, {
    fields: [auditLogs.staffId],
    references: [staffAccounts.id],
  }),
  application: one(applications, {
    fields: [auditLogs.applicationId],
    references: [applications.id],
  }),
}));
