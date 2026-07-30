import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Early test data was created with placeholder image URLs (example.com) or no
// images at all, which render as broken thumbnails. This script gives every
// property a real photo set so the UI looks presentable.
//
// It runs against whatever DATABASE_URL points at, and it updates properties
// regardless of which landlord owns them - something the API cannot do,
// because a landlord may only edit their own listings.
//
// Idempotent: re-running it simply writes the same URLs again.

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=80`;

// Curated, all verified to return HTTP 200.
const GALLERIES = {
  apartment: [
    u('1522708323590-d24dbb6b0267'),
    u('1502672260266-1c1ef2d93688'),
    u('1493809842364-78817add7ffb'),
  ],
  villa: [
    u('1580587771525-78b9dba3b914'),
    u('1600596542815-ffad4c1539a9'),
    u('1613490493576-7fde63acd811'),
  ],
  studio: [
    u('1560448204-e02f11c3d0e2'),
    u('1512917774080-9991f1c4c750'),
    u('1584622650111-993a426fbf0a'),
  ],
  house: [
    u('1568605114967-8130f3a36994'),
    u('1600585154340-be6161a56a0c'),
    u('1570129477492-45c003edd2be'),
  ],
} as const;

// Pick a gallery from the property's category, falling back on its title.
const pickGallery = (categoryName: string, title: string): readonly string[] => {
  const haystack = `${categoryName} ${title}`.toLowerCase();

  if (haystack.includes('villa')) return GALLERIES.villa;
  if (haystack.includes('studio')) return GALLERIES.studio;
  if (haystack.includes('house') || haystack.includes('duplex')) return GALLERIES.house;
  return GALLERIES.apartment;
};

// A URL is "real" only if it is not one of the old example.com placeholders.
const isPlaceholder = (url: string) =>
  url.includes('example.com') || url.trim() === '';

const main = async () => {
  const properties = await prisma.property.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${properties.length} properties.\n`);

  let updated = 0;

  for (const property of properties) {
    const hasRealImages =
      property.images.length > 0 && !property.images.some(isPlaceholder);

    if (hasRealImages) {
      console.log(`- skipped  "${property.title}" (already has real images)`);
      continue;
    }

    const images = [...pickGallery(property.category.name, property.title)];

    await prisma.property.update({
      where: { id: property.id },
      data: { images },
    });

    updated += 1;
    console.log(`✅ updated  "${property.title}" -> ${images.length} images`);
  }

  console.log(`\nDone. ${updated} updated, ${properties.length - updated} left alone.`);
};

main()
  .catch((error) => {
    console.error('❌ Failed to update images:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
