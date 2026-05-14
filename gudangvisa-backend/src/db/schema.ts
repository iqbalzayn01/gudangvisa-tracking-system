import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==========================================
// ENUMS
// ==========================================
export const roleEnum = pgEnum('role', ['STAFF', 'ADMIN']);
export const docTypeEnum = pgEnum('doc_type', ['VISA', 'KITAS', 'PASSPORT']);
export const docStatusEnum = pgEnum('doc_status', [
  'RECEIVED',
  'IN_REVIEW',
  'IN_PROCESS',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
]);

// ==========================================
// 1. USERS
// ==========================================
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').default('STAFF').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 2. CLIENTS
// ==========================================
export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  passportNumber: varchar('passport_number', { length: 100 }),
  contactNumber: varchar('contact_number', { length: 50 }),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 3. TRACKING TICKETS
// ==========================================
export const trackingTickets = pgTable(
  'tracking_tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    trackingCode: varchar('tracking_code', { length: 50 }).notNull().unique(),
    clientId: uuid('client_id')
      .references(() => clients.id)
      .notNull(),
    serviceType: varchar('service_type', { length: 100 }).notNull(),
    currentStatus: docStatusEnum('current_status')
      .default('RECEIVED')
      .notNull(),
    handledBy: uuid('handled_by')
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    trackingCodeIdx: index('tracking_code_idx').on(table.trackingCode),
  }),
);

// ==========================================
// 4. DOCUMENTS (File Attachments per Ticket)
// ==========================================
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id')
    .references(() => trackingTickets.id)
    .notNull(),
  docName: varchar('doc_name', { length: 255 }).notNull(),
  docType: docTypeEnum('doc_type').notNull(),
  status: docStatusEnum('status').default('RECEIVED').notNull(),
  fileUrl: text('file_url').notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 5. TRACKING HISTORIES (Timeline Log)
// ==========================================
export const trackingHistories = pgTable('tracking_histories', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id')
    .references(() => trackingTickets.id)
    .notNull(),
  statusName: docStatusEnum('status_name').notNull(),
  descriptionPublic: text('description_public').notNull(),
  descriptionInternal: text('description_internal'),
  updatedBy: uuid('updated_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// RELATIONS
// ==========================================
export const trackingTicketsRelations = relations(
  trackingTickets,
  ({ one, many }) => ({
    client: one(clients, {
      fields: [trackingTickets.clientId],
      references: [clients.id],
    }),
    handler: one(users, {
      fields: [trackingTickets.handledBy],
      references: [users.id],
    }),
    documents: many(documents),
    histories: many(trackingHistories),
  }),
);

export const documentsRelations = relations(documents, ({ one }) => ({
  ticket: one(trackingTickets, {
    fields: [documents.ticketId],
    references: [trackingTickets.id],
  }),
}));

export const trackingHistoriesRelations = relations(
  trackingHistories,
  ({ one }) => ({
    ticket: one(trackingTickets, {
      fields: [trackingHistories.ticketId],
      references: [trackingTickets.id],
    }),
    updater: one(users, {
      fields: [trackingHistories.updatedBy],
      references: [users.id],
    }),
  }),
);
