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

/**
 * Trim a `HH:MM:SS` (or `HH:MM`) time string down to `HH:MM`.
 * Returns the input unchanged if it doesn't look like a time.
 */
export function formatTime(time?: string | null): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  return m !== undefined ? `${h}:${m}` : time;
}

// ─── Search highlighting ─────────────────────────────────────────────────────

/** Escape HTML special characters so a string is safe to inject via `v-html`. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * HTML-escape `text`, then wrap case-insensitive matches of `query` in a
 * `<mark class="hl">` for search highlighting. The escape happens BEFORE
 * wrapping, so the result is safe to render with `v-html` even when `text`
 * comes from user-controlled data (client name, email, tracking code, …).
 */
export function highlight(text: string, query: string): string {
  const safe = escapeHtml(text);
  const q = query.trim();
  if (!q) return safe;
  // Escape the query the same way, then neutralize regex metacharacters, so it
  // matches against the already-escaped text.
  const pattern = escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(
    new RegExp(`(${pattern})`, 'gi'),
    '<mark class="hl">$1</mark>',
  );
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
