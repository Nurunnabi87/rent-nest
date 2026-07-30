import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// The earliest test listings were priced in BDT-like figures (18000, 45000,
// 80000) while everything since has been priced in USD, which is what the
// frontend formats and what Stripe charges. A single listing at "$80,000 per
// month" next to "$450 per month" looks broken, so this brings the old rows
// onto the same scale.
//
// Idempotent: once converted, nothing is above the threshold any more, so
// re-running this changes nothing.

// Anything above this is still on the old scale - no realistic USD monthly
// rent in this catalogue comes close to it.
const OLD_SCALE_THRESHOLD = 5000;

// Explicit targets for the known listings, chosen to keep their relative
// order intact (18000 < 25000 < 45000 < 80000 maps to 400 < 500 < 700 < 2400).
const TARGETS: Record<string, number> = {
  'Studio Flat in Banani': 400,
  'Cozy 2BR Apartment in Dhanmondi': 500,
  'Modern 3BR Apartment in Gulshan': 700,
  'Lakeview Villa in Gulshan': 2400,
};

// Anything else that turns up gets a sensible mid-band value for its category.
const BY_CATEGORY: Record<string, number> = {
  Studio: 350,
  Apartment: 600,
  House: 1100,
  Duplex: 1600,
  Villa: 2400,
};

const main = async () => {
  const stale = await prisma.property.findMany({
    where: { rentAmount: { gt: OLD_SCALE_THRESHOLD } },
    include: { category: { select: { name: true } } },
    orderBy: { rentAmount: 'asc' },
  });

  if (stale.length === 0) {
    console.log('Nothing to do - every listing is already on the USD scale.');
    return;
  }

  console.log(`Found ${stale.length} listing(s) on the old scale.\n`);

  for (const property of stale) {
    const rentAmount =
      TARGETS[property.title] ?? BY_CATEGORY[property.category.name] ?? 600;

    await prisma.property.update({
      where: { id: property.id },
      data: { rentAmount },
    });

    console.log(
      `✅ "${property.title}" (${property.category.name}): ${property.rentAmount} -> ${rentAmount}`
    );
  }

  const [min, max] = await Promise.all([
    prisma.property.findFirst({
      where: { isDeleted: false },
      orderBy: { rentAmount: 'asc' },
      select: { rentAmount: true },
    }),
    prisma.property.findFirst({
      where: { isDeleted: false },
      orderBy: { rentAmount: 'desc' },
      select: { rentAmount: true },
    }),
  ]);

  console.log(
    `\nDone. Rent range is now ${min?.rentAmount ?? 0} to ${max?.rentAmount ?? 0} USD per month.`
  );
};

main()
  .catch((error) => {
    console.error('❌ Failed to normalize rents:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
