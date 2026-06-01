import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL as string);

async function main() {
  console.log('Dropping public schema...');
  await sql`DROP SCHEMA public CASCADE;`;
  console.log('Recreating public schema...');
  await sql`CREATE SCHEMA public;`;
  await sql`GRANT ALL ON SCHEMA public TO postgres;`;
  await sql`GRANT ALL ON SCHEMA public TO public;`;
  console.log('Done!');
  process.exit(0);
}

main().catch(console.error);
