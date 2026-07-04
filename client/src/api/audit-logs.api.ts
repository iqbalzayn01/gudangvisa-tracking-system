import apiClient from './client';
import type { ApiResponse, AuditLog, AuditAction, UserRole } from '../types';

export interface AuditLogFilters {
  action?: AuditAction | '';
  entity?: string;
}

/** Coerce an arbitrary backend action string into a known AuditAction. */
function normalizeAction(raw: string): AuditAction {
  const a = (raw || '').toLowerCase();
  if (a.includes('status')) return 'STATUS_CHANGE';
  if (a.includes('login') || a.includes('auth')) return 'LOGIN';
  if (a.includes('upload')) return 'UPLOAD';
  if (a.includes('download')) return 'DOWNLOAD';
  if (a.includes('delete') || a.includes('remove')) return 'DELETE';
  if (a.includes('create') || a.includes('add')) return 'CREATE';
  return 'UPDATE';
}

/** Build a short human-readable summary from the recorded values. */
function buildDescription(d: any, action: AuditAction, entity: string): string {
  const verb = action.replace(/_/g, ' ').toLowerCase();
  const nv = d.newValues ?? {};
  if (entity === 'application' && nv.status)
    return `Changed application status to ${nv.status}`;
  if (entity === 'document' && nv.status)
    return `Marked document as ${nv.status}`;
  if (entity === 'document' && action === 'UPLOAD')
    return `Uploaded ${nv.documentType ?? 'document'}`;
  if (entity === 'staff' && action === 'LOGIN')
    return 'Signed in to the dashboard';
  return `${verb.charAt(0).toUpperCase() + verb.slice(1)} on ${entity}`;
}

function mapAuditLog(d: any): AuditLog {
  const action = normalizeAction(d.action);
  const entity = d.entityType ?? 'application';
  return {
    id: d.id,
    action,
    entity,
    entityId: d.applicationId ?? d.application?.referenceNumber ?? null,
    description: d.description ?? buildDescription(d, action, entity),
    actor: d.staff?.fullName ?? d.staffName ?? 'System',
    actorRole: (d.staff?.role === 'admin' ? 'ADMIN' : 'STAFF') as UserRole,
    ipAddress: d.ipAddress ?? undefined,
    createdAt: d.createdAt,
  };
}

/**
 * Fetch audit logs from the server (admin-only endpoint), optionally filtered
 * by action and/or entity. Errors propagate to the caller so the page can show
 * a real error state; an empty trail returns an empty list.
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {},
): Promise<AuditLog[]> {
  const params: Record<string, string> = {};
  if (filters.action) params.action = filters.action;
  if (filters.entity) params.entity = filters.entity;

  const { data } = await apiClient.get<ApiResponse<any[]>>('/audit-logs', {
    params,
  });
  return (data.data ?? []).map(mapAuditLog);
}
