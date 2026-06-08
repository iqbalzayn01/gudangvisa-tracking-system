import type { Request } from 'express';
import { AuditLogsRepository } from '../modules/audit-logs/audit-logs.repository.js';

/**
 * Canonical audit actions recorded for every staff/admin activity.
 * Kept in sync with the frontend `AuditAction` union.
 */
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'LOGIN'
  | 'UPLOAD'
  | 'DOWNLOAD';

export interface AuditParams {
  action: AuditAction;
  /** Logical entity affected, e.g. 'application' | 'document' | 'staff' | 'client'. */
  entityType: string;
  /** Related application id, when the action concerns an application or its documents. */
  applicationId?: string | null;
  /** Explicit actor id — required for actions performed before auth runs (e.g. LOGIN). */
  staffId?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
}

const repository = new AuditLogsRepository();

/**
 * Best-effort extraction of the originating client IP.
 * Honours `X-Forwarded-For` (set by Vercel / reverse proxies) before falling
 * back to the socket address. Requires `app.set('trust proxy', ...)` for `req.ip`.
 */
export function getClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]!.trim();
  }
  return req.ip ?? req.socket?.remoteAddress ?? null;
}

/**
 * Record a single audit-trail entry for an internal (staff/admin) action.
 *
 * Audit logging is a side-effect that must NEVER break the main request, so
 * any failure here is swallowed and logged rather than propagated.
 */
export async function recordAudit(req: Request, params: AuditParams): Promise<void> {
  try {
    await repository.create({
      staffId: params.staffId ?? req.staffUser?.id ?? null,
      applicationId: params.applicationId ?? null,
      action: params.action,
      entityType: params.entityType,
      oldValues: (params.oldValues ?? null) as never,
      newValues: (params.newValues ?? null) as never,
      ipAddress: getClientIp(req),
    });
  } catch (error) {
    console.error('[audit] failed to record audit log:', error);
  }
}
