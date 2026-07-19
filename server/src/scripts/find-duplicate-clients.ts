import { db } from '../db/index.js';
import { clientAccounts } from '../db/schema.js';

/**
 * READ-ONLY report of duplicate client accounts.
 *
 * Groups `client_accounts` by normalized full name (lower + trim) and by
 * normalized email, printing every group with more than one member. Makes NO
 * writes — cleanup is left as a deliberate manual decision because deleting a
 * client cascades to its applications.
 *
 * Run: npm run check:dups
 */

type ClientRow = {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
};

const normalize = (value: string): string => value.trim().toLowerCase();

function groupBy(
  rows: ClientRow[],
  keyOf: (row: ClientRow) => string,
): Map<string, ClientRow[]> {
  const groups = new Map<string, ClientRow[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }
  return groups;
}

function reportDuplicates(
  label: string,
  rows: ClientRow[],
  keyOf: (row: ClientRow) => string,
): number {
  const duplicateGroups = [...groupBy(rows, keyOf).values()].filter(
    (group) => group.length > 1,
  );

  console.log(`\n=== Duplicate ${label} ===`);
  if (duplicateGroups.length === 0) {
    console.log(`✅ No duplicate ${label} found.`);
    return 0;
  }

  for (const group of duplicateGroups) {
    // Oldest first so the "keeper" (earliest createdAt) is listed at the top.
    const members = [...group].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    console.log(`\n▶ "${keyOf(members[0]!)}" — ${members.length} accounts:`);
    for (const m of members) {
      console.log(
        `   • ${m.id} | ${m.fullName} | ${m.email} | ${m.createdAt.toISOString()}`,
      );
    }
  }

  const totalRows = duplicateGroups.reduce((sum, g) => sum + g.length, 0);
  console.log(
    `\n⚠ ${duplicateGroups.length} duplicate ${label} group(s), ` +
      `${totalRows} account(s) involved.`,
  );
  return duplicateGroups.length;
}

async function run(): Promise<void> {
  console.log('🔍 Scanning client_accounts for duplicates...');

  const rows: ClientRow[] = await db
    .select({
      id: clientAccounts.id,
      fullName: clientAccounts.fullName,
      email: clientAccounts.email,
      createdAt: clientAccounts.createdAt,
    })
    .from(clientAccounts);

  console.log(`Total client accounts: ${rows.length}`);

  const nameGroups = reportDuplicates('full names', rows, (r) =>
    normalize(r.fullName),
  );
  const emailGroups = reportDuplicates('emails', rows, (r) =>
    normalize(r.email),
  );

  console.log(
    `\nDone. ${nameGroups} name group(s), ${emailGroups} email group(s) ` +
      `need attention.`,
  );
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed to scan for duplicates:', error);
    process.exit(1);
  });
