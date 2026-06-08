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

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type BiometricStatus =
  | 'not_scheduled'
  | 'scheduled'
  | 'completed'
  | 'rescheduled'
  | 'cancelled'
  | 'no_show';

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
  email?: string;
  nationality?: string | null;
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

/** Admin-editable client fields (name, nationality, phone only). */
export interface UpdateClientPayload {
  name?: string;
  nationality?: string;
  contactNumber?: string;
}

// ─── Application (Visa Tracking Record) ──────────────────────────────────────

export interface Application {
  id: string;
  /** Human-readable reference number (e.g. GV-2406-0001). */
  trackingCode: string;
  clientId: string;
  serviceType: string;
  /** Raw backend visa type (B211A, KITAS_WORKING, …). */
  visaType?: string;
  currentStatus: DocStatus;
  priority?: Priority;
  /** 0–100 completion percentage. */
  progress?: number;
  handledBy: string;
  createdAt: string;
  client?: Client;
  handler?: Pick<User, 'id' | 'fullName' | 'role'>;
  documents?: ApplicationDocument[];
  histories?: TrackingHistory[];
  // ── Biometric appointment (merged into the application record) ───────────
  biometricStatus?: BiometricStatus;
  biometricDate?: string | null;
  biometricTime?: string | null;
  biometricLocation?: string | null;
  fieldAssistantName?: string | null;
}

export interface CreateApplicationPayload {
  clientId: string;
  serviceType: string;
  priority?: Priority;
}

export interface UpdateStatusPayload {
  statusName: DocStatus;
  descriptionPublic: string;
  descriptionInternal?: string;
}

// ─── Document (attached to an application) ───────────────────────────────────

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  docName: string;
  docType: DocType;
  status: DocStatus;
  fileUrl: string;
  isPublic: boolean;
  createdAt: string;
  fileDownloadUrl?: string;
}

export interface AddDocumentPayload {
  applicationId: string;
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
  applicationId?: string;
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

// ─── Audit Log ───────────────────────────────────────────────────────────────

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'LOGIN'
  | 'UPLOAD'
  | 'DOWNLOAD';

export interface AuditLog {
  id: string;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  description: string;
  actor: string;
  actorRole: UserRole;
  ipAddress?: string;
  createdAt: string;
}

// ─── Biometric Schedule (derived from an application) ────────────────────────

export interface BiometricSchedule {
  id: string;
  applicationId: string;
  trackingCode: string;
  clientName: string;
  status: BiometricStatus;
  date: string | null;
  time: string | null;
  location: string | null;
  fieldAssistant: string | null;
}
