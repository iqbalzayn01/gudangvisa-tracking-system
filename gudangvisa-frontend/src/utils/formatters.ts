import type { DocStatus } from '../types';

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
    IN_PROCESS: 'indigo',
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
