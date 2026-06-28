import { ENV } from './src/config/env';
import { defineConfig } from 'drizzle-kit';

if (!ENV.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the .env file');
}

export default defineConfig({
  schema: './src/db/schema.ts', // Your schema file path
  out: './drizzle', // Your migrations folder
  dialect: 'postgresql',
  dbCredentials: {
    // Run migrations through the Supabase session pooler (5432); the
    // transaction pooler (6543) used at runtime hangs drizzle-kit migrate.
    url: ENV.DIRECT_URL ?? ENV.DATABASE_URL,
  },
});
