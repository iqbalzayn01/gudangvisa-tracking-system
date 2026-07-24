import type {
  ApplicationStatus,
  BiometricStatus,
  DocumentStatus,
  DocumentType,
  VisaType,
} from '../types';

// ─── Application status (6-stage KITAS lifecycle) ─────────────────────────────

interface StatusMeta {
  label: string;
  badge: string; // Tailwind bg + text classes
  bar: string; // Solid Tailwind bg class, for progress/distribution bars
}

/** Canonical ordering used by progress bars and the status dropdown. */
export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'draft',
  'document_verification',
  'immigration_processing',
  'approval_pending',
  'completed',
  'cancelled',
];

export const STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  draft: {
    label: 'Draft',
    badge: 'bg-slate-500/15 text-slate-400',
    bar: 'bg-slate-500',
  },
  document_verification: {
    label: 'Document Verification',
    badge: 'bg-amber-500/15 text-amber-400',
    bar: 'bg-amber-500',
  },
  immigration_processing: {
    label: 'Immigration Processing',
    badge: 'bg-sky-500/15 text-sky-400',
    bar: 'bg-sky-500',
  },
  approval_pending: {
    label: 'Approval Pending',
    badge: 'bg-indigo-500/15 text-indigo-400',
    bar: 'bg-indigo-500',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-emerald-500/15 text-emerald-400',
    bar: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-rose-500/15 text-rose-400',
    bar: 'bg-rose-500',
  },
};

export function applicationStatusLabel(status: ApplicationStatus): string {
  return STATUS_META[status]?.label ?? status;
}

export function statusBadgeClass(status: ApplicationStatus): string {
  return STATUS_META[status]?.badge ?? 'bg-slate-500/15 text-slate-400';
}

export function statusBarClass(status: ApplicationStatus): string {
  return STATUS_META[status]?.bar ?? 'bg-slate-500';
}

/** True for the single branch status (cancelled / rejected). */
export function isExceptionStatus(status: ApplicationStatus): boolean {
  return status === 'cancelled';
}

/** Happy-path lifecycle only (draft … completed), excludes `cancelled`. */
export const STATUS_STEPS: ApplicationStatus[] = APPLICATION_STATUSES.filter(
  (s) => s !== 'cancelled',
);

/** The single recommended forward status, or null if terminal. */
export function forwardNextOf(
  status: ApplicationStatus,
): ApplicationStatus | null {
  const idx = STATUS_STEPS.indexOf(status);
  if (idx < 0 || idx >= STATUS_STEPS.length - 1) return null;
  return STATUS_STEPS[idx + 1];
}

/**
 * The only statuses staff may switch to from the current one: the single
 * forward step, plus `cancelled`. Everything else is disallowed so the case
 * cannot skip stages or jump backward. First entry is the recommended
 * forward step.
 */
export function allowedNextStatuses(
  current: ApplicationStatus,
): ApplicationStatus[] {
  if (current === 'completed' || current === 'cancelled') return [];
  const result: ApplicationStatus[] = [];
  const fwd = forwardNextOf(current);
  if (fwd) result.push(fwd);
  result.push('cancelled');
  return result;
}

/** Progress percentage derived from the position in the lifecycle. */
export function progressFromStatus(status: ApplicationStatus): number {
  if (status === 'completed' || status === 'cancelled') return 100;
  const idx = STATUS_STEPS.indexOf(status);
  if (idx < 0) return 0;
  return Math.round((idx / (STATUS_STEPS.length - 1)) * 100);
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

// ─── Biometric status ────────────────────────────────────────────────────────

export function biometricStatusLabel(status: BiometricStatus): string {
  const map: Record<BiometricStatus, string> = {
    not_scheduled: 'Not Scheduled',
    scheduled: 'Scheduled',
    completed: 'Completed',
    rescheduled: 'Rescheduled',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return map[status] ?? status;
}

export function biometricStatusClasses(status: BiometricStatus): string {
  const map: Record<BiometricStatus, string> = {
    not_scheduled: 'bg-slate-500/15 text-slate-400',
    scheduled: 'bg-sky-500/15 text-sky-400',
    completed: 'bg-emerald-500/15 text-emerald-400',
    rescheduled: 'bg-amber-500/15 text-amber-400',
    cancelled: 'bg-red-500/15 text-red-400',
    no_show: 'bg-rose-500/15 text-rose-400',
  };
  return map[status] ?? map.not_scheduled;
}
