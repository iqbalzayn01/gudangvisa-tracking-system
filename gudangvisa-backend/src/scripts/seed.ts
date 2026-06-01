import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { staffAccounts } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function runSeed() {
  console.log('🌱 Starting the database seeding process...');

  try {
    // Check if the admin account already exists
    const existingSuperAdmin = await db.query.staffAccounts.findFirst({
      where: eq(staffAccounts.email, 'admin@gudangvisa.com'),
    });

    if (existingSuperAdmin) {
      console.log('⚠️ Admin account already exists! No new data was added.');
      process.exit(0);
    }

    // Hash the default password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Insert data into the database
    await db.insert(staffAccounts).values({
      fullName: 'Super Admin',
      email: 'admin@gudangvisa.com',
      passwordHash: hashedPassword,
      role: 'admin',
      phone: null,
      isActive: true,
    });

    console.log('✅ First Admin account created successfully!');
    console.log('📧 Email: admin@gudangvisa.com');
    console.log('🔑 Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed the database:', error);
    process.exit(1);
  }
}

runSeed();
