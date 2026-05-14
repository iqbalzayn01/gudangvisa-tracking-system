// ─── Enums & Literal Types ───────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'STAFF';

export type DocType = 'VISA' | 'KITAS' | 'PASSPORT';

export type DocStatus =
  | 'RECEIVED'
  | 'IN_REVIEW'
  | 'IN_PROCESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

// ─── API Response Wrapper ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Pick<User, 'fullName' | 'role'>;
  token: string;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password: string;
}

// ─── Client ──────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  passportNumber: string | null;
  contactNumber: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CreateClientPayload {
  name: string;
  passportNumber?: string;
  contactNumber?: string;
}

// ─── Tracking Ticket ─────────────────────────────────────────────────────────

export interface TrackingTicket {
  id: string;
  trackingCode: string;
  clientId: string;
  serviceType: string;
  currentStatus: DocStatus;
  handledBy: string;
  createdAt: string;
  client?: Client;
  handler?: Pick<User, 'id' | 'fullName' | 'role'>;
  documents?: TicketDocument[];
  histories?: TrackingHistory[];
}

export interface CreateTicketPayload {
  clientId: string;
  serviceType: string;
}

export interface UpdateStatusPayload {
  statusName: DocStatus;
  descriptionPublic: string;
  descriptionInternal?: string;
}

// ─── Document (attached to a ticket) ─────────────────────────────────────────

export interface TicketDocument {
  id: string;
  ticketId: string;
  docName: string;
  docType: DocType;
  status: DocStatus;
  fileUrl: string;
  isPublic: boolean;
  createdAt: string;
  fileDownloadUrl?: string;
}

export interface AddDocumentPayload {
  ticketId: string;
  docName: string;
  docType: DocType;
  status?: DocStatus;
  isPublic?: boolean;
  storagePath: string;
}

export interface UploadUrlPayload {
  fileName: string;
  contentType: string;
  fileSize?: number;
}

export interface UploadUrlResponse {
  signedUrl: string;
  storagePath: string;
  token: string;
}

// ─── Tracking History ────────────────────────────────────────────────────────

export interface TrackingHistory {
  id: string;
  ticketId?: string;
  statusName: DocStatus;
  descriptionPublic: string;
  descriptionInternal?: string | null;
  updatedBy: string;
  createdAt: string;
  updater?: { id?: string; fullName: string };
}

// ─── Public Tracking (GET /tracking/:code) ───────────────────────────────────

export interface PublicTrackingResult {
  id: string;
  trackingCode: string;
  serviceType: string;
  currentStatus: DocStatus;
  client: { name: string };
  handler: { fullName: string };
  documents: PublicDocument[];
  histories: PublicHistory[];
  createdAt: string;
}

export interface PublicDocument {
  id: string;
  docName: string;
  docType: DocType;
  status: DocStatus;
  fileDownloadUrl: string | null;
  createdAt: string;
}

export interface PublicHistory {
  id: string;
  statusName: DocStatus;
  descriptionPublic: string;
  updatedBy: { fullName: string };
  createdAt: string;
}

// ─── Notification ────────────────────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}
