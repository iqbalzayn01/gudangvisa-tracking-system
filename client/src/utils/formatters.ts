import type { BiometricStatus } from '../types';

/**
 * Format an ISO date string into a human-readable format.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format an ISO date string into date + time.
 */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a file size in bytes into a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Document validity / expiry monitoring ───────────────────────────────────

/** Whole days until `iso` (negative if already past). */
export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export type ExpiryState = 'none' | 'expired' | 'soon' | 'ok';

/** Classify a document expiry date for highlighting. `soon` = within 30 days. */
export function expiryState(iso?: string | null): ExpiryState {
  if (!iso) return 'none';
  const days = daysUntil(iso);
  if (days < 0) return 'expired';
  if (days <= 30) return 'soon';
  return 'ok';
}

export function expiryClasses(state: ExpiryState): string {
  const map: Record<ExpiryState, string> = {
    none: 'text-subtle',
    ok: 'text-subtle',
    soon: 'text-amber-400',
    expired: 'text-rose-400',
  };
  return map[state];
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
