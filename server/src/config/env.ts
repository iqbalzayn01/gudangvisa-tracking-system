import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const ENV = {
  PORT: process.env.PORT || '8000',
  DATABASE_URL: process.env.DATABASE_URL,
  // Migration-only connection (Supabase session pooler). Falls back to
  // DATABASE_URL so it stays optional. Used by drizzle-kit, not the runtime.
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL as string,
  SUPABASE_SERVICE_KEY: (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY) as string,
  BUCKETID: process.env.BUCKETID || 'gudangvisa-bucket',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};

if (!ENV.DATABASE_URL) throw new Error('DATABASE_URL is missing');
if (!ENV.SUPABASE_URL) throw new Error('SUPABASE_URL is missing');
if (!ENV.SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_KEY is missing');
// Tokens signed with a guessable fallback secret would let anyone forge
// admin sessions, so the JWT secrets are as mandatory as the database URL.
if (!ENV.JWT_SECRET) throw new Error('JWT_SECRET is missing');
if (!ENV.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is missing');
