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
 * by action and/or entity. If the endpoint is unavailable or returns nothing
 * for an UNFILTERED request, fall back to a representative demo dataset so the
 * page is never empty in the frontend prototype. A filtered request that
 * legitimately matches nothing returns an empty list.
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {},
): Promise<AuditLog[]> {
  const params: Record<string, string> = {};
  if (filters.action) params.action = filters.action;
  if (filters.entity) params.entity = filters.entity;
  const hasFilters = Object.keys(params).length > 0;

  try {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/audit-logs', {
      params,
    });
    const mapped = (data.data ?? []).map(mapAuditLog);
    if (mapped.length) return mapped;
    return hasFilters ? [] : mockAuditLogs();
  } catch {
    return hasFilters ? [] : mockAuditLogs();
  }
}

/** Deterministic-ish demo audit trail (frontend prototype only). */
function mockAuditLogs(): AuditLog[] {
  const now = Date.now();
  const samples: Array<Omit<AuditLog, 'id' | 'createdAt'> & { ago: number }> = [
    { action: 'STATUS_CHANGE', entity: 'application', entityId: 'GV-2406-0042', description: 'Changed status from In Review to In Process', actor: 'Putu Andika', actorRole: 'STAFF', ipAddress: '103.28.11.4', ago: 6 },
    { action: 'CREATE', entity: 'application', entityId: 'GV-2406-0042', description: 'Created new application (B211A — Visit Visa)', actor: 'Putu Andika', actorRole: 'STAFF', ipAddress: '103.28.11.4', ago: 35 },
    { action: 'UPLOAD', entity: 'document', entityId: 'GV-2406-0040', description: 'Uploaded passport scan', actor: 'Made Sari', actorRole: 'STAFF', ipAddress: '180.244.9.21', ago: 95 },
    { action: 'LOGIN', entity: 'staff', entityId: null, description: 'Signed in to the dashboard', actor: 'Admin GudangVisa', actorRole: 'ADMIN', ipAddress: '36.72.214.8', ago: 140 },
    { action: 'UPDATE', entity: 'client', entityId: 'CL-1188', description: 'Updated client contact number', actor: 'Made Sari', actorRole: 'STAFF', ipAddress: '180.244.9.21', ago: 320 },
    { action: 'DELETE', entity: 'application', entityId: 'GV-2405-0031', description: 'Deleted cancelled application', actor: 'Admin GudangVisa', actorRole: 'ADMIN', ipAddress: '36.72.214.8', ago: 460 },
    { action: 'DOWNLOAD', entity: 'document', entityId: 'GV-2405-0029', description: 'Downloaded final e-visa PDF', actor: 'Putu Andika', actorRole: 'STAFF', ipAddress: '103.28.11.4', ago: 720 },
    { action: 'STATUS_CHANGE', entity: 'application', entityId: 'GV-2405-0029', description: 'Marked application as Completed', actor: 'Admin GudangVisa', actorRole: 'ADMIN', ipAddress: '36.72.214.8', ago: 1500 },
  ];
  return samples.map((s, i) => ({
    id: `mock-${i}`,
    action: s.action,
    entity: s.entity,
    entityId: s.entityId,
    description: s.description,
    actor: s.actor,
    actorRole: s.actorRole,
    ipAddress: s.ipAddress,
    createdAt: new Date(now - s.ago * 60_000).toISOString(),
  }));
}
