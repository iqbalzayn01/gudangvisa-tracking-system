import type { Application, ApplicationStatus, VisaType } from '../types';
import { APPLICATION_STATUSES, VISA_TYPE_META } from './labels';

/**
 * Statuses that count an application as "finished" for the recap. There is no
 * `completedAt` on the client model, so completion is measured from the current
 * status of each application within its creation-month cohort.
 */
export const COMPLETED_STATUSES: ApplicationStatus[] = [
  'approved',
  'evisa_issued',
  'completed',
];

const COMPLETED_SET = new Set<ApplicationStatus>(COMPLETED_STATUSES);

export interface MonthlyRecapRow {
  /** Sort/identity key, e.g. `2026-07`. */
  monthKey: string;
  /** Localized label, e.g. `Juli 2026`. */
  label: string;
  /** Applications created in this month (cohort size). */
  total: number;
  /** Cohort members whose current status is in {@link COMPLETED_STATUSES}. */
  completed: number;
  byVisaType: Record<VisaType, number>;
  byStatus: Record<ApplicationStatus, number>;
}

const VISA_TYPES = Object.keys(VISA_TYPE_META) as VisaType[];

const monthFormatter = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
});

function emptyVisaMap(): Record<VisaType, number> {
  return Object.fromEntries(VISA_TYPES.map((v) => [v, 0])) as Record<
    VisaType,
    number
  >;
}

function emptyStatusMap(): Record<ApplicationStatus, number> {
  return Object.fromEntries(
    APPLICATION_STATUSES.map((s) => [s, 0]),
  ) as Record<ApplicationStatus, number>;
}

/**
 * Group applications into monthly recap rows by their `createdAt` month, most
 * recent month first. Each row carries the cohort total, completed count, and
 * per-visa-type / per-status breakdowns. Applications with an unparseable
 * `createdAt` are skipped.
 */
export function buildMonthlyRecap(apps: Application[]): MonthlyRecapRow[] {
  const rows = new Map<string, MonthlyRecapRow>();

  for (const app of apps) {
    const created = new Date(app.createdAt);
    if (Number.isNaN(created.getTime())) continue;

    const monthKey = `${created.getFullYear()}-${String(
      created.getMonth() + 1,
    ).padStart(2, '0')}`;

    let row = rows.get(monthKey);
    if (!row) {
      row = {
        monthKey,
        label: monthFormatter.format(created),
        total: 0,
        completed: 0,
        byVisaType: emptyVisaMap(),
        byStatus: emptyStatusMap(),
      };
      rows.set(monthKey, row);
    }

    row.total += 1;
    if (COMPLETED_SET.has(app.currentStatus)) row.completed += 1;
    if (app.visaType in row.byVisaType) row.byVisaType[app.visaType] += 1;
    if (app.currentStatus in row.byStatus)
      row.byStatus[app.currentStatus] += 1;
  }

  return [...rows.values()].sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}
