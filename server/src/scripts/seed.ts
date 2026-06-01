import bcrypt from 'bcryptjs';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { staffAccounts, clientAccounts } from '../db/schema.js';

const ADMIN_EMAIL = 'admin@gudangvisa.com';
const ADMIN_PASSWORD = 'admin123';

const CLIENT_COUNT = 100;
const CLIENT_PASSWORD = 'client123';

// Small pools to give the dummy clients varied but deterministic data.
const FIRST_NAMES = [
  'James', 'Olivia', 'Liam', 'Emma', 'Noah', 'Ava', 'Lucas', 'Sophia',
  'Mason', 'Isabella', 'Ethan', 'Mia', 'Logan', 'Amelia', 'Hiroshi', 'Yuki',
  'Wei', 'Mei', 'Arjun', 'Priya',
];
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Tanaka', 'Sato', 'Chen', 'Wang', 'Sharma', 'Patel', 'Müller',
  'Rossi', 'Dubois', 'Silva', 'Kim', 'Nguyen',
];
const NATIONALITIES = [
  'United States', 'United Kingdom', 'Australia', 'Japan', 'China', 'India',
  'Germany', 'France', 'Italy', 'South Korea', 'Brazil', 'Canada',
];

/** Ensure the bootstrap admin account exists (idempotent). */
async function seedAdmin(): Promise<void> {
  const existing = await db.query.staffAccounts.findFirst({
    where: eq(staffAccounts.email, ADMIN_EMAIL),
  });

  if (existing) {
    console.log(`⚠️  Admin account already exists (${ADMIN_EMAIL}) — skipped.`);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await db.insert(staffAccounts).values({
    fullName: 'Super Admin',
    email: ADMIN_EMAIL,
    passwordHash,
    role: 'admin',
    phone: null,
    isActive: true,
  });

  console.log(`✅ Admin account created — ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

/**
 * Seed 100 demo client accounts (idempotent).
 * All clients share the same password (`client123`). Only the accounts that do
 * not already exist (matched by email) are inserted, so re-running is safe.
 */
async function seedClients(): Promise<void> {
  const emails = Array.from(
    { length: CLIENT_COUNT },
    (_, i) => `client${i + 1}@gudangvisa.com`,
  );

  const existing = await db.query.clientAccounts.findMany({
    where: inArray(clientAccounts.email, emails),
    columns: { email: true },
  });
  const existingEmails = new Set(existing.map((c) => c.email));

  const passwordHash = await bcrypt.hash(CLIENT_PASSWORD, 12);

  const toInsert = [];
  for (let i = 0; i < CLIENT_COUNT; i++) {
    const email = emails[i]!;
    if (existingEmails.has(email)) continue;

    const firstName = FIRST_NAMES[i % FIRST_NAMES.length]!;
    const lastName = LAST_NAMES[(i * 7) % LAST_NAMES.length]!;
    const seq = String(i + 1).padStart(4, '0');

    toInsert.push({
      email,
      passwordHash,
      fullName: `${firstName} ${lastName}`,
      passportNumber: `P${seq}${(i + 1) * 13}`,
      nationality: NATIONALITIES[i % NATIONALITIES.length]!,
      phone: `+62812${seq}${seq}`,
      isActive: true,
    });
  }

  if (toInsert.length === 0) {
    console.log(`⚠️  All ${CLIENT_COUNT} demo clients already exist — skipped.`);
    return;
  }

  await db.insert(clientAccounts).values(toInsert);
  console.log(
    `✅ Seeded ${toInsert.length} new demo client(s) ` +
      `(${CLIENT_COUNT - toInsert.length} already existed).`,
  );
  console.log(
    `📧 Logins: client1@gudangvisa.com … client${CLIENT_COUNT}@gudangvisa.com`,
  );
  console.log(`🔑 Password (all clients): ${CLIENT_PASSWORD}`);
}

async function runSeed(): Promise<void> {
  console.log('🌱 Starting the database seeding process...');

  try {
    await seedAdmin();
    await seedClients();
    console.log('🎉 Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed the database:', error);
    process.exit(1);
  }
}

runSeed();
