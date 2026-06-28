import type {
  ApplicationStatus,
  DocumentStatus,
  DocumentType,
  Priority,
  VisaType,
} from '../types';

// ─── Application status (16-stage KITAS lifecycle) ───────────────────────────

export type StatusPhase =
  | 'document'
  | 'immigration'
  | 'biometric'
  | 'decision'
  | 'completed'
  | 'exception';

interface StatusMeta {
  label: string;
  badge: string; // Tailwind bg + text classes
  phase: StatusPhase;
}

/** Canonical ordering used by progress bars and the status dropdown. */
export const APPLICATION_STATUSES: ApplicationStatus[] = [
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
];

export const STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  draft: {
    label: 'Draft',
    badge: 'bg-slate-500/15 text-slate-400',
    phase: 'document',
  },
  document_collection: {
    label: 'Document Collection',
    badge: 'bg-slate-500/15 text-slate-300',
    phase: 'document',
  },
  document_verification: {
    label: 'Document Verification',
    badge: 'bg-amber-500/15 text-amber-400',
    phase: 'document',
  },
  document_revision: {
    label: 'Document Revision',
    badge: 'bg-orange-500/15 text-orange-400',
    phase: 'document',
  },
  submission_to_immigration: {
    label: 'Submitted to Immigration',
    badge: 'bg-sky-500/15 text-sky-400',
    phase: 'immigration',
  },
  immigration_review: {
    label: 'Immigration Review',
    badge: 'bg-sky-500/15 text-sky-300',
    phase: 'immigration',
  },
  biometric_scheduled: {
    label: 'Biometric Scheduled',
    badge: 'bg-indigo-500/15 text-indigo-400',
    phase: 'biometric',
  },
  biometric_completed: {
    label: 'Biometric Completed',
    badge: 'bg-indigo-500/15 text-indigo-300',
    phase: 'biometric',
  },
  immigration_processing: {
    label: 'Immigration Processing',
    badge: 'bg-blue-500/15 text-blue-400',
    phase: 'immigration',
  },
  approval_pending: {
    label: 'Approval Pending',
    badge: 'bg-amber-500/15 text-amber-300',
    phase: 'decision',
  },
  approved: {
    label: 'Approved',
    badge: 'bg-emerald-500/15 text-emerald-400',
    phase: 'decision',
  },
  evisa_issued: {
    label: 'E-Visa Issued',
    badge: 'bg-emerald-500/15 text-emerald-300',
    phase: 'decision',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-emerald-600/15 text-emerald-400',
    phase: 'completed',
  },
  rejected: {
    label: 'Rejected',
    badge: 'bg-rose-500/15 text-rose-400',
    phase: 'exception',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-rose-500/15 text-rose-300',
    phase: 'exception',
  },
  on_hold: {
    label: 'On Hold',
    badge: 'bg-yellow-500/15 text-yellow-400',
    phase: 'exception',
  },
};

export function applicationStatusLabel(status: ApplicationStatus): string {
  return STATUS_META[status]?.label ?? status;
}

export function statusBadgeClass(status: ApplicationStatus): string {
  return STATUS_META[status]?.badge ?? 'bg-slate-500/15 text-slate-400';
}

export function phaseOf(status: ApplicationStatus): StatusPhase {
  return STATUS_META[status]?.phase ?? 'document';
}

/** Phase buckets for the dashboard distribution chart + stepper. */
export const STATUS_PHASES: { key: StatusPhase; label: string; color: string }[] =
  [
    { key: 'document', label: 'Document', color: 'bg-slate-500' },
    { key: 'immigration', label: 'Immigration', color: 'bg-sky-500' },
    { key: 'biometric', label: 'Biometric', color: 'bg-indigo-500' },
    { key: 'decision', label: 'Decision', color: 'bg-amber-500' },
    { key: 'completed', label: 'Completed', color: 'bg-emerald-500' },
    { key: 'exception', label: 'On Hold / Closed', color: 'bg-rose-500' },
  ];

/** Grouped options for the status <select> on the detail page. */
export const STATUS_GROUPS: { label: string; statuses: ApplicationStatus[] }[] =
  [
    {
      label: 'Document',
      statuses: [
        'draft',
        'document_collection',
        'document_verification',
        'document_revision',
      ],
    },
    {
      label: 'Immigration',
      statuses: [
        'submission_to_immigration',
        'immigration_review',
        'immigration_processing',
      ],
    },
    {
      label: 'Biometric',
      statuses: ['biometric_scheduled', 'biometric_completed'],
    },
    {
      label: 'Decision',
      statuses: ['approval_pending', 'approved', 'evisa_issued', 'completed'],
    },
    {
      label: 'Exception',
      statuses: ['rejected', 'cancelled', 'on_hold'],
    },
  ];

/** Progress percentage derived from the position in the lifecycle. */
export function progressFromStatus(status: ApplicationStatus): number {
  if (status === 'completed' || status === 'evisa_issued') return 100;
  if (status === 'rejected' || status === 'cancelled') return 100;
  // Linear order through the "happy path" stages.
  const order = APPLICATION_STATUSES.slice(0, 13); // draft … completed
  const idx = order.indexOf(status);
  if (idx < 0) return 0;
  return Math.round((idx / (order.length - 1)) * 100);
}

// ─── Visa type ───────────────────────────────────────────────────────────────

export const VISA_TYPE_META: Record<VisaType, string> = {
  B211A: 'B211A — Visit / Social Visa',
  KITAS_WORKING: 'KITAS — Working',
  KITAS_SPOUSE: 'KITAS — Spouse / Family',
  KITAS_INVESTOR: 'KITAS — Investor',
  KITAS_RETIREMENT: 'KITAS — Retirement',
};

export function visaTypeLabel(visaType?: string | null): string {
  if (!visaType) return '—';
  return VISA_TYPE_META[visaType as VisaType] ?? visaType;
}

export const VISA_TYPE_OPTIONS = (
  Object.keys(VISA_TYPE_META) as VisaType[]
).map((value) => ({ value, label: VISA_TYPE_META[value] }));

// ─── Document type ───────────────────────────────────────────────────────────

export const DOCUMENT_TYPE_META: Record<DocumentType, string> = {
  passport: 'Passport',
  photo: 'Photo (4x6)',
  sponsor_letter: 'Sponsor Letter',
  company_nib: 'Company NIB',
  bank_statement: 'Bank Statement',
  rejection_letter: 'Rejection Letter',
  final_evisa: 'Final e-Visa',
  marriage_certificate: 'Marriage Certificate',
  insurance_certificate: 'Insurance Certificate',
  rptka: 'RPTKA Approval',
  notifikasi: 'Notifikasi / Work Permit (IMTA)',
  vitas_telex: 'VITAS / Telex Visa',
  dkptka_payment: 'DKPTKA / DPKK Payment',
  domicile_certificate: 'Domicile Certificate (SKTT)',
  diploma_certificate: 'Diploma / Qualification',
  cv_resume: 'Curriculum Vitae (CV)',
  kitas_card: 'KITAS / ITAS Card',
  other: 'Other',
};

export function documentTypeLabel(type: DocumentType): string {
  return DOCUMENT_TYPE_META[type] ?? type;
}

export const DOCUMENT_TYPE_OPTIONS = (
  Object.keys(DOCUMENT_TYPE_META) as DocumentType[]
).map((value) => ({ value, label: DOCUMENT_TYPE_META[value] }));

// ─── Document verification status ────────────────────────────────────────────

export const DOCUMENT_STATUS_META: Record<
  DocumentStatus,
  { label: string; badge: string }
> = {
  pending: { label: 'Pending', badge: 'bg-amber-500/15 text-amber-400' },
  verified: { label: 'Verified', badge: 'bg-emerald-500/15 text-emerald-400' },
  rejected: { label: 'Rejected', badge: 'bg-rose-500/15 text-rose-400' },
};

export function documentStatusLabel(status: DocumentStatus): string {
  return DOCUMENT_STATUS_META[status]?.label ?? status;
}

export function documentStatusClass(status: DocumentStatus): string {
  return DOCUMENT_STATUS_META[status]?.badge ?? 'bg-slate-500/15 text-slate-400';
}

// ─── Priority ────────────────────────────────────────────────────────────────

export const PRIORITY_META: Record<Priority, { label: string; badge: string }> =
  {
    low: { label: 'Low', badge: 'bg-slate-500/15 text-slate-400' },
    medium: { label: 'Medium', badge: 'bg-sky-500/15 text-sky-400' },
    high: { label: 'High', badge: 'bg-amber-500/15 text-amber-400' },
    urgent: { label: 'Urgent', badge: 'bg-red-500/15 text-red-400' },
  };

export function priorityLabel(priority: Priority): string {
  return PRIORITY_META[priority]?.label ?? priority;
}

export function priorityClasses(priority: Priority): string {
  return PRIORITY_META[priority]?.badge ?? PRIORITY_META.medium.badge;
}

export const PRIORITY_OPTIONS = (Object.keys(PRIORITY_META) as Priority[]).map(
  (value) => ({ value, label: PRIORITY_META[value].label }),
);
