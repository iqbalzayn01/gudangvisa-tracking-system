import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  applications,
  applicationDocuments,
  clientAccounts,
  notifications,
} from '../db/schema.js';
import { deleteStorageFiles } from '../utils/storage.js';

/**
 * DESTRUCTIVE cleanup of duplicate-name client accounts.
 *
 * Per duplicate full-name group it keeps ONE row (most applications, then most
 * notifications, then lowest email) and deletes the rest. A full JSON backup of
 * every deleted row is written BEFORE deletion so the change is recoverable.
 * The delete runs in a single transaction; the deleted clients' document files
 * are then removed from Supabase Storage (the DB cascade can't reach the bucket).
 *
 * Run:     npm run cleanup:dups -- --dry-run   (report only, no changes)
 *          npm run cleanup:dups                (delete)
 */

const normalize = (v: string): string => v.trim().toLowerCase();

type Row = {
  id: string;
  fullName: string;
  email: string;
  appCount: number;
  notifCount: number;
};

async function run(): Promise<void> {
  const scored: Row[] = await db
    .select({
      id: clientAccounts.id,
      fullName: clientAccounts.fullName,
      email: clientAccounts.email,
      appCount: sql<number>`count(distinct ${applications.id})`.mapWith(Number),
      notifCount:
        sql<number>`count(distinct ${notifications.id})`.mapWith(Number),
    })
    .from(clientAccounts)
    .leftJoin(applications, sql`${applications.clientId} = ${clientAccounts.id}`)
    .leftJoin(
      notifications,
      sql`${notifications.clientId} = ${clientAccounts.id}`,
    )
    .groupBy(clientAccounts.id, clientAccounts.fullName, clientAccounts.email);

  const groups = new Map<string, Row[]>();
  for (const r of scored) {
    const k = normalize(r.fullName);
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(r);
  }

  const loserIds: string[] = [];
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    const [, ...losers] = [...g].sort(
      (a, b) =>
        b.appCount - a.appCount ||
        b.notifCount - a.notifCount ||
        a.email.localeCompare(b.email),
    );
    loserIds.push(...losers.map((l) => l.id));
  }

  if (loserIds.length === 0) {
    console.log('✅ No duplicate-name clients to delete.');
    return;
  }

  // Full backup of the rows about to be deleted (includes password_hash so the
  // delete is fully recoverable).
  const doomed = await db
    .select()
    .from(clientAccounts)
    .where(inArray(clientAccounts.id, loserIds));

  // Storage paths of the documents that the cascade will delete — collected
  // now, removed from the bucket after the DB delete succeeds.
  const doomedFiles = await db
    .select({ filePath: applicationDocuments.filePath })
    .from(applicationDocuments)
    .innerJoin(
      applications,
      eq(applicationDocuments.applicationId, applications.id),
    )
    .where(inArray(applications.clientId, loserIds));

  if (process.argv.includes('--dry-run')) {
    console.log(`🔎 DRY RUN — would delete ${doomed.length} client(s):`);
    for (const d of doomed) console.log(`   - ${d.fullName} <${d.email}>`);
    console.log(
      `   plus ${doomedFiles.length} storage file(s) via application cascade.`,
    );
    return;
  }

  const backupDir = join(process.cwd(), 'backups');
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  const backupFile = join(
    backupDir,
    `deleted-clients-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
  );
  writeFileSync(backupFile, JSON.stringify(doomed, null, 2));
  console.log(`💾 Backup of ${doomed.length} row(s): ${backupFile}`);

  const deleted = await db.transaction(async (tx) => {
    const result = await tx
      .delete(clientAccounts)
      .where(inArray(clientAccounts.id, loserIds))
      .returning({ id: clientAccounts.id });
    return result.length;
  });

  console.log(`🗑  Deleted ${deleted} duplicate-name client(s).`);

  await deleteStorageFiles(doomedFiles.map((f) => f.filePath));
  if (doomedFiles.length > 0) {
    console.log(`🧹 Removed ${doomedFiles.length} storage file(s).`);
  }
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ cleanup failed:', e);
    process.exit(1);
  });
