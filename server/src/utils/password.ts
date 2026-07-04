import bcrypt from 'bcryptjs';

/** Single source of truth for the bcrypt work factor. */
export const BCRYPT_ROUNDS = 12;

// Prepared once so login can burn the same bcrypt cost for unknown emails,
// keeping response timing indistinguishable from a wrong password.
const dummyHashPromise = bcrypt.hash(
  'timing-equalization-placeholder',
  BCRYPT_ROUNDS,
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/** Burn a bcrypt compare against a dummy hash (result intentionally ignored). */
export async function compareAgainstDummyHash(password: string): Promise<void> {
  await bcrypt.compare(password, await dummyHashPromise);
}
