// ─── Enums & Literal Types ───────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'STAFF';

/** Visa / permit types (mirrors backend `visa_type`). */
export type VisaType =
  | 'B211A'
  | 'KITAS_WORKING'
  | 'KITAS_SPOUSE'
  | 'KITAS_INVESTOR'
  | 'KITAS_RETIREMENT';

/**
 * Full KITAS immigration lifecycle (mirrors backend `application_status`).
 * This is the source of truth for monitoring — no longer collapsed to a
 * handful of generic buckets.
 */
export type ApplicationStatus =
  | 'draft'
  | 'document_collection'
  | 'document_verification'
  | 'document_revision'
  | 'submission_to_immigration'
  | 'immigration_review'
  | 'biometric_scheduled'
  | 'biometric_completed'
  | 'immigration_processing'
  | 'approval_pending'
  | 'approved'
  | 'evisa_issued'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'on_hold';

/** Verification state of an uploaded document (mirrors backend `document_status`). */
export type DocumentStatus = 'pending' | 'verified' | 'rejected';

/** Professional / legal document categories (mirrors backend `document_type`). */
export type DocumentType =
  | 'passport'
  | 'photo'
  | 'sponsor_letter'
  | 'company_nib'
  | 'bank_statement'
  | 'rejection_letter'
  | 'final_evisa'
  | 'marriage_certificate'
  | 'insurance_certificate'
  | 'rptka'
  | 'notifikasi'
  | 'vitas_telex'
  | 'dkptka_payment'
  | 'domicile_certificate'
  | 'diploma_certificate'
  | 'cv_resume'
  | 'kitas_card'
  | 'other';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

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

// ─── Checklist (per-visa-type document requirements) ─────────────────────────

export interface ChecklistItem {
  name: string;
  isChecked: boolean;
  checkedAt?: string | null;
  checkedByStaffId?: string | null;
}

// ─── Application (Visa Tracking Record) ──────────────────────────────────────

export interface Application {
  id: string;
  /** Human-readable reference number (e.g. GV-2026-00001). */
  trackingCode: string;
  clientId: string;
  visaType: VisaType;
  currentStatus: ApplicationStatus;
  priority: Priority;
  /** 0–100 completion percentage. */
  progress?: number;
  notes?: string | null;
  checklist?: ChecklistItem[];
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
  fieldAssistantPhone?: string | null;
}

export interface CreateApplicationPayload {
  clientId: string;
  visaType: VisaType;
  priority?: Priority;
  notes?: string;
}

export interface UpdateStatusPayload {
  status: ApplicationStatus;
  descriptionPublic: string;
  descriptionInternal?: string;
  isVisibleToClient?: boolean;
}

export interface UpdateBiometricPayload {
  biometricStatus: BiometricStatus;
  biometricDate?: string;
  biometricTime?: string;
  biometricLocation?: string;
  fieldAssistantName?: string;
  fieldAssistantPhone?: string;
}

// ─── Document (attached to an application) ───────────────────────────────────

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  docName: string;
  documentType: DocumentType;
  status: DocumentStatus;
  rejectionReason?: string | null;
  /** Validity tracking for expiry monitoring. */
  issuedDate?: string | null;
  expiryDate?: string | null;
  verifiedAt?: string | null;
  fileUrl: string;
  isPublic: boolean;
  createdAt: string;
  fileDownloadUrl?: string;
}

export interface AddDocumentPayload {
  applicationId: string;
  docName: string;
  documentType: DocumentType;
  isPublic?: boolean;
  storagePath: string;
  issuedDate?: string;
  expiryDate?: string;
}

export interface VerifyDocumentPayload {
  status: 'verified' | 'rejected';
  rejectionReason?: string;
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

/** Document nearing or past its expiry date (dashboard monitoring widget). */
export interface ExpiringDocument {
  id: string;
  documentType: DocumentType;
  fileName: string;
  issuedDate?: string | null;
  expiryDate: string | null;
  application?: {
    id: string;
    referenceNumber: string;
    visaType: VisaType;
    client?: { id: string; fullName: string };
  };
}

// ─── Tracking History ────────────────────────────────────────────────────────

export interface TrackingHistory {
  id: string;
  applicationId?: string;
  statusName: ApplicationStatus;
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
  visaType: VisaType;
  currentStatus: ApplicationStatus;
  client: { name: string };
  handler: { fullName: string };
  documents: PublicDocument[];
  histories: PublicHistory[];
  createdAt: string;
}

export interface PublicDocument {
  id: string;
  docName: string;
  documentType: DocumentType;
  status: DocumentStatus;
  fileDownloadUrl: string | null;
  createdAt: string;
}

export interface PublicHistory {
  id: string;
  statusName: ApplicationStatus;
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
