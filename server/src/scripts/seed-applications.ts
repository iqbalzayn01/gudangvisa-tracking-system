import { eq, sql } from 'drizzle-orm';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { db } from '../db/index.js';
import {
  applications,
  applicationDocuments,
  trackingHistory,
  staffAccounts,
} from '../db/schema.js';
import { generateStoragePath, uploadFileBuffer } from '../utils/storage.js';

/**
 * Seed 50 dummy Visa/KITAS applications spread across 2024–2026, each with a
 * dummy uploaded document (idempotent). Requires `npm run seed` to have
 * already created the demo clients/admin.
 *
 * Run: tsx src/scripts/seed-applications.ts
 */

const APP_COUNT = 50;
const SEED_TAG = '[seed-demo]';

// client/public/content/, resolved relative to this file (not process.cwd())
// so the script works regardless of which directory it's invoked from.
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(SCRIPT_DIR, '../../../client/public/content');
const DUMMY_FILES = {
  B211A: 'contoh_visa.pdf',
  KITAS_WORKING: 'contoh_kitas.pdf',
  KITAS_SPOUSE: 'contoh_kitas.pdf',
  KITAS_INVESTOR: 'contoh_kitas.pdf',
  KITAS_RETIREMENT: 'contoh_kitas.pdf',
} as const;

const VISA_TYPES = [
  'B211A',
  'KITAS_WORKING',
  'KITAS_SPOUSE',
  'KITAS_INVESTOR',
  'KITAS_RETIREMENT',
] as const;

// Happy-path lifecycle, oldest → newest (excludes the cancelled branch).
const HAPPY_PATH = [
  'draft',
  'document_verification',
  'immigration_processing',
  'approval_pending',
  'completed',
] as const;

const STATUS_PROGRESS: Record<string, number> = {
  draft: 0,
  document_verification: 25,
  immigration_processing: 50,
  approval_pending: 75,
  completed: 100,
  cancelled: 40,
};

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

const DEFAULT_CHECKLIST_ITEMS: Record<(typeof VISA_TYPES)[number], string[]> = {
  B211A: ['Passport', 'Passport-size Photo', 'Bank Statement'],
  KITAS_WORKING: [
    'Passport',
    'Passport-size Photo',
    'RPTKA Approval',
    'Work Permit (IMTA)',
    'Sponsor Letter',
    'Company NIB',
  ],
  KITAS_SPOUSE: [
    'Passport',
    'Passport-size Photo',
    'Sponsor Letter (Indonesian spouse)',
    'Marriage Certificate',
  ],
  KITAS_INVESTOR: ['Passport', 'Passport-size Photo', 'Company NIB', 'Sponsor Letter'],
  KITAS_RETIREMENT: ['Passport', 'Passport-size Photo', 'Bank Statement', 'Insurance Certificate'],
};

const START = new Date('2024-01-01T00:00:00Z').getTime();
const END = Date.now();

function randomDateBetween(startMs: number, endMs: number): Date {
  return new Date(startMs + Math.random() * (endMs - startMs));
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Older applications skew further along the pipeline (or into the cancelled branch). */
function pickStatus(createdAt: Date): string {
  const ageDays = (Date.now() - createdAt.getTime()) / 86_400_000;

  const roll = Math.random();
  if (roll < 0.16) return 'cancelled';

  let maxIdx: number;
  if (ageDays > 240) maxIdx = HAPPY_PATH.length - 1;
  else if (ageDays > 120) maxIdx = 3;
  else if (ageDays > 45) maxIdx = 2;
  else maxIdx = 1;

  const idx = Math.floor(Math.random() * (maxIdx + 1));
  return HAPPY_PATH[idx]!;
}

function phoneSuffix(phone: string | null): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : digits.padStart(4, '0');
}

function buildChecklist(visaType: (typeof VISA_TYPES)[number], status: string) {
  const progress = STATUS_PROGRESS[status] ?? 0;
  return DEFAULT_CHECKLIST_ITEMS[visaType].map((name, i, arr) => {
    // Roughly check off items proportional to how far the pipeline has moved.
    const isChecked = progress >= 10 && i < Math.ceil((progress / 100) * arr.length);
    return { name, isChecked, checkedAt: isChecked ? new Date().toISOString() : undefined };
  });
}

/** Statuses where a real case would already have a verified document on file. */
const VERIFIED_STATUSES = new Set([
  'immigration_processing',
  'approval_pending',
  'completed',
]);

async function loadDummyFileBuffers(): Promise<Record<string, Buffer>> {
  const uniqueNames = [...new Set(Object.values(DUMMY_FILES))];
  const entries = await Promise.all(
    uniqueNames.map(async (name) => {
      const buffer = await readFile(path.join(CONTENT_DIR, name));
      return [name, buffer] as const;
    }),
  );
  return Object.fromEntries(entries);
}

async function seedApplications(): Promise<void> {
  const existingCount = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(applications)
    .where(sql`${applications.notes} LIKE ${SEED_TAG + '%'}`);

  if ((existingCount[0]?.count ?? 0) >= APP_COUNT) {
    console.log(`⚠️  ${APP_COUNT} demo applications already exist — skipped.`);
    return;
  }

  const fileBuffers = await loadDummyFileBuffers();

  const clients = await db.query.clientAccounts.findMany({
    columns: { id: true, phone: true },
    limit: APP_COUNT,
  });
  if (clients.length === 0) {
    console.error('❌ No client accounts found — run `npm run seed` first.');
    process.exitCode = 1;
    return;
  }

  const admin = await db.query.staffAccounts.findFirst({
    columns: { id: true },
    where: eq(staffAccounts.role, 'admin'),
  });

  let created = 0;
  for (let i = 0; i < APP_COUNT; i++) {
    const client = clients[i % clients.length]!;
    const visaType = pick(VISA_TYPES);
    const createdAt = randomDateBetween(START, END);
    const status = pickStatus(createdAt);
    const year = createdAt.getUTCFullYear();
    const random5 = Math.floor(10000 + Math.random() * 90000);
    const referenceNumber = `GV-${year}-${random5}-${phoneSuffix(client.phone)}`;
    const checklist = buildChecklist(visaType, status);

    const [app] = await db
      .insert(applications)
      .values({
        referenceNumber,
        clientId: client.id,
        assignedStaffId: admin?.id ?? null,
        visaType,
        status: status as (typeof applications.$inferInsert)['status'],
        priority: pick(PRIORITIES),
        progressPercentage: STATUS_PROGRESS[status] ?? 0,
        notes: `${SEED_TAG} demo data`,
        checklist,
        createdAt,
        updatedAt: createdAt,
      })
      .onConflictDoNothing()
      .returning({ id: applications.id });

    if (!app) continue;
    created++;

    // Upload the dummy PDF and attach it as a document on this application —
    // mirrors the real upload flow (server-side, since this is a trusted script).
    const dummyFileName = DUMMY_FILES[visaType];
    const storagePath = generateStoragePath(dummyFileName);
    await uploadFileBuffer(storagePath, fileBuffers[dummyFileName]!, 'application/pdf');

    const docStatus = status === 'cancelled'
      ? 'rejected'
      : VERIFIED_STATUSES.has(status)
        ? 'verified'
        : 'pending';

    await db.insert(applicationDocuments).values({
      applicationId: app.id,
      documentType: visaType.startsWith('KITAS') ? 'kitas_card' : 'passport',
      fileName: dummyFileName,
      filePath: storagePath,
      status: docStatus,
      rejectionReason: docStatus === 'rejected' ? 'Document unclear or invalid.' : null,
      verifiedByStaffId: docStatus === 'verified' ? (admin?.id ?? null) : null,
      verifiedAt: docStatus === 'verified' ? createdAt : null,
      createdAt,
      updatedAt: createdAt,
    });

    await db.insert(trackingHistory).values([
      {
        applicationId: app.id,
        fromStatus: null,
        toStatus: 'draft',
        description: 'Application created and registered into the system.',
        changedByStaffId: admin?.id ?? null,
        createdAt,
      },
      ...(status !== 'draft'
        ? [
            {
              applicationId: app.id,
              fromStatus: 'draft' as const,
              toStatus: status as (typeof trackingHistory.$inferInsert)['toStatus'],
              description: `Status updated to ${status.replace(/_/g, ' ')}.`,
              changedByStaffId: admin?.id ?? null,
              createdAt,
            },
          ]
        : []),
    ]);
  }

  console.log(`✅ Seeded ${created} new demo application(s) spanning 2024–2026.`);
}

async function run(): Promise<void> {
  console.log('🌱 Seeding demo Visa/KITAS applications...');
  try {
    await seedApplications();
    console.log('🎉 Done.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed applications:', error);
    process.exit(1);
  }
}

run();
