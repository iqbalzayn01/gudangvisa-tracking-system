import type { DocStatus, Priority, BiometricStatus } from '../types';

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
 * Get a human-friendly label for a document status.
 */
export function statusLabel(status: DocStatus): string {
  const labels: Record<DocStatus, string> = {
    RECEIVED: 'Received',
    IN_REVIEW: 'In Review',
    IN_PROCESS: 'In Process',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    COMPLETED: 'Completed',
  };
  return labels[status] ?? status;
}

/**
 * Get a Tailwind color name for status-based colouring.
 */
export function statusColor(status: DocStatus): string {
  const colors: Record<DocStatus, string> = {
    RECEIVED: 'slate',
    IN_REVIEW: 'amber',
    IN_PROCESS: 'red',
    APPROVED: 'emerald',
    REJECTED: 'rose',
    COMPLETED: 'emerald',
  };
  return colors[status] ?? 'slate';
}

/**
 * Format a file size in bytes into a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Tailwind class pair (bg + text) for an application priority. */
export function priorityClasses(priority: Priority): string {
  const map: Record<Priority, string> = {
    LOW: 'bg-slate-500/15 text-slate-400',
    MEDIUM: 'bg-sky-500/15 text-sky-400',
    HIGH: 'bg-amber-500/15 text-amber-400',
    URGENT: 'bg-red-500/15 text-red-400',
  };
  return map[priority] ?? map.MEDIUM;
}

export function priorityLabel(priority: Priority): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

/** Human-friendly visa-type label from the raw backend enum. */
export function visaTypeLabel(visaType?: string): string {
  const map: Record<string, string> = {
    B211A: 'B211A — Visit Visa',
    KITAS_WORKING: 'KITAS — Working',
    KITAS_SPOUSE: 'KITAS — Spouse',
    KITAS_INVESTOR: 'KITAS — Investor',
    KITAS_RETIREMENT: 'KITAS — Retirement',
  };
  return visaType ? (map[visaType] ?? visaType) : '—';
}

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
