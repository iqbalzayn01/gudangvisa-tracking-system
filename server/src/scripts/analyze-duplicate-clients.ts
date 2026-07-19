import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { applications, clientAccounts } from '../db/schema.js';

/**
 * READ-ONLY analysis for the duplicate-name cleanup.
 *
 * For every duplicate full-name group it lists each member with how many
 * applications reference it, and marks the proposed KEEPER (most
 * applications, then lowest email). Makes NO writes — used to decide what a
 * delete would destroy before running it.
 */

type Row = {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
  appCount: number;
};

const normalize = (v: string): string => v.trim().toLowerCase();

async function run(): Promise<void> {
  const rows = await db.select({ id: clientAccounts.id }).from(clientAccounts);
  const total = rows.length;

  const data: Row[] = (
    await db
      .select({
        id: clientAccounts.id,
        fullName: clientAccounts.fullName,
        email: clientAccounts.email,
        createdAt: clientAccounts.createdAt,
        appCount: sql<number>`count(distinct ${applications.id})`.mapWith(Number),
      })
      .from(clientAccounts)
      .leftJoin(applications, sql`${applications.clientId} = ${clientAccounts.id}`)
      .groupBy(
        clientAccounts.id,
        clientAccounts.fullName,
        clientAccounts.email,
        clientAccounts.createdAt,
      )
  ).map((r) => ({ ...r }));

  const groups = new Map<string, Row[]>();
  for (const r of data) {
    const k = normalize(r.fullName);
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(r);
  }

  const dupGroups = [...groups.values()].filter((g) => g.length > 1);

  const pickKeeper = (g: Row[]): Row =>
    [...g].sort(
      (a, b) => b.appCount - a.appCount || a.email.localeCompare(b.email),
    )[0]!;

  let deleteCount = 0;
  let appsAtRisk = 0;

  console.log(`Total clients: ${total}. Duplicate-name groups: ${dupGroups.length}.`);
  for (const g of dupGroups) {
    const keeper = pickKeeper(g);
    console.log(`\n▶ "${normalize(g[0]!.fullName)}"`);
    for (const m of g) {
      const tag = m.id === keeper.id ? 'KEEP  ' : 'DELETE';
      if (m.id !== keeper.id) {
        deleteCount++;
        appsAtRisk += m.appCount;
      }
      console.log(`   ${tag} ${m.id} | ${m.email} | apps=${m.appCount}`);
    }
  }

  console.log(
    `\nWould delete ${deleteCount} client(s). ` +
      `Cascade would destroy ${appsAtRisk} application(s).`,
  );
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ analyze failed:', e);
    process.exit(1);
  });
