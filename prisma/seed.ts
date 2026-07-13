import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Seeding fills a database with the baseline data the app needs to run.
// upsert makes it IDEMPOTENT: safe to run any number of times -
// it creates the record if missing, otherwise leaves/updates it.
const main = async () => {
  // 1. The admin account (admins can never register via the API)
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@rentnest.com' },
    update: {},
    create: {
      name: 'RentNest Admin',
      email: 'admin@rentnest.com',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Admin ready: ${admin.email} (password: admin123)`);

  // 2. Default property categories
  const categoryNames = ['Apartment', 'House', 'Studio', 'Duplex', 'Villa'];

  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`✅ Categories ready: ${categoryNames.join(', ')}`);
};

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
