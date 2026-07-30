import { PrismaClient, type PropertyAvailability } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Fills every category with a realistic catalogue (6 listings each) so the
// browse page, category filters and pagination all have something to show.
//
// Idempotent: a listing is keyed by its title, so re-running this skips
// anything that already exists rather than creating duplicates.

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=80`;

// Eight photos per category, every URL verified to return HTTP 200.
const PHOTOS: Record<string, string[]> = {
  Apartment: [
    '1522708323590-d24dbb6b0267', '1502672260266-1c1ef2d93688',
    '1493809842364-78817add7ffb', '1560185007-5f0bb1866cab',
    '1560185008-b033106af5c3', '1560184897-ae75f418493e',
    '1560185127-6ed189bf02f4', '1502005229762-cf1b2da7c5d6',
  ].map(u),
  Studio: [
    '1560448204-e02f11c3d0e2', '1512917774080-9991f1c4c750',
    '1584622650111-993a426fbf0a', '1554995207-c18c203602cb',
    '1556909114-f6e7ad7d3136', '1556909212-d5b604d0c90d',
    '1598928506311-c55ded91a20c', '1519643381401-22c77e60520e',
  ].map(u),
  House: [
    '1568605114967-8130f3a36994', '1600585154340-be6161a56a0c',
    '1570129477492-45c003edd2be', '1416331108676-a22ccb276e35',
    '1449844908441-8829872d2607', '1523217582562-09d0def993a6',
    '1571939228382-b2f2b585ce15', '1505691938895-1758d7feb511',
  ].map(u),
  Duplex: [
    '1600566753190-17f0baa2a6c3', '1600573472550-8090b5e0745e',
    '1600563438938-a9a27216b4f5', '1615873968403-89e068629265',
    '1618221195710-dd6b41faaea6', '1617104678098-de229db51175',
    '1631049307264-da0ec9d70304', '1594563703937-fdc640497dcd',
  ].map(u),
  Villa: [
    '1580587771525-78b9dba3b914', '1600596542815-ffad4c1539a9',
    '1613490493576-7fde63acd811', '1583608205776-bfd35f0d9f83',
    '1586023492125-27b2c045efd7', '1600210492486-724fe5c67fb0',
    '1600607687939-ce8a6c25118c', '1522771739844-6a9f6d5f14af',
  ].map(u),
};

// Each listing takes three consecutive photos from its category pool, offset
// by its position, so no two listings in a category look identical.
const galleryFor = (category: string, index: number): string[] => {
  const pool = PHOTOS[category];
  return [0, 1, 2].map((n) => pool[(index + n) % pool.length]);
};

const LANDLORDS = [
  { name: 'Demo Landlord', email: 'demo.landlord@example.com', phone: '+8801711000001' },
  { name: 'Rashid Ahmed', email: 'rashid.landlord@example.com', phone: '+8801711000002' },
  { name: 'Nadia Islam', email: 'nadia.landlord@example.com', phone: '+8801711000003' },
  { name: 'Karim Chowdhury', email: 'karim.landlord@example.com', phone: '+8801711000004' },
];

interface Listing {
  title: string;
  location: string;
  description: string;
  rentAmount: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
}

// The last listing in each category is marked RENTED, so the browse page shows
// a mix of availability badges instead of a wall of identical ones.
const CATALOGUE: Record<string, Listing[]> = {
  Studio: [
    { title: 'Compact Studio near Banani Lake', location: 'Banani, Dhaka', description: 'Fully furnished studio with a lake-facing window, ideal for a single professional working nearby.', rentAmount: 260, bedrooms: 1, bathrooms: 1, amenities: ['wifi', 'furnished', 'lift'] },
    { title: 'Bright Studio in Dhanmondi 27', location: 'Dhanmondi, Dhaka', description: 'Sunlit corner studio with a small kitchenette and a dedicated study nook. Walking distance to Rabindra Sarobar.', rentAmount: 290, bedrooms: 1, bathrooms: 1, amenities: ['wifi', 'furnished', 'generator'] },
    { title: 'Modern Studio in Niketan', location: 'Niketan, Dhaka', description: 'Newly renovated studio in a quiet residential block, with a shared rooftop terrace and round the clock security.', rentAmount: 310, bedrooms: 1, bathrooms: 1, amenities: ['wifi', 'security', 'rooftop', 'lift'] },
    { title: 'Cosy Studio in Lalmatia', location: 'Lalmatia, Dhaka', description: 'Affordable furnished studio close to the main road, well connected for students and young professionals.', rentAmount: 340, bedrooms: 1, bathrooms: 1, amenities: ['wifi', 'furnished'] },
    { title: 'Executive Studio in Gulshan 1', location: 'Gulshan 1, Dhaka', description: 'Premium serviced studio with air conditioning, a work desk and access to the building gym.', rentAmount: 375, bedrooms: 1, bathrooms: 1, amenities: ['wifi', 'ac', 'gym', 'lift', 'security'] },
    { title: 'Serviced Studio in Baridhara', location: 'Baridhara, Dhaka', description: 'Diplomatic zone studio apartment with housekeeping included and a covered parking bay.', rentAmount: 400, bedrooms: 1, bathrooms: 1, amenities: ['wifi', 'ac', 'parking', 'security'] },
  ],
  Apartment: [
    { title: 'Airy 2BR Apartment in Shyamoli', location: 'Shyamoli, Dhaka', description: 'Two bedroom flat on the fourth floor with a wide balcony, plenty of daylight and a reliable lift.', rentAmount: 450, bedrooms: 2, bathrooms: 1, amenities: ['wifi', 'lift', 'balcony'] },
    { title: 'Family 3BR Apartment in Mirpur DOHS', location: 'Mirpur DOHS, Dhaka', description: 'Spacious three bedroom home inside a secure DOHS block, with a playground and mosque a minute away.', rentAmount: 520, bedrooms: 3, bathrooms: 2, amenities: ['wifi', 'parking', 'security', 'generator'] },
    { title: 'Renovated 2BR in Rampura', location: 'Rampura, Dhaka', description: 'Freshly renovated flat with new tiles, modular kitchen and a dedicated utility balcony.', rentAmount: 580, bedrooms: 2, bathrooms: 2, amenities: ['wifi', 'lift', 'generator', 'balcony'] },
    { title: 'Sunny 3BR Apartment in Uttara 4', location: 'Uttara Sector 4, Dhaka', description: 'South facing three bedroom apartment with cross ventilation, close to schools and the metro line.', rentAmount: 640, bedrooms: 3, bathrooms: 2, amenities: ['wifi', 'parking', 'lift', 'generator'] },
    { title: 'Premium 3BR in Bashundhara R/A', location: 'Bashundhara R/A, Dhaka', description: 'Well finished apartment in a modern building with a rooftop garden, gym and two lifts.', rentAmount: 700, bedrooms: 3, bathrooms: 3, amenities: ['wifi', 'gym', 'rooftop', 'parking', 'security'] },
    { title: 'Luxury 3BR Apartment in Gulshan 2', location: 'Gulshan 2, Dhaka', description: 'High floor apartment with skyline views, imported fittings, generator backup and reserved parking.', rentAmount: 780, bedrooms: 3, bathrooms: 3, amenities: ['wifi', 'ac', 'parking', 'lift', 'security', 'generator'] },
  ],
  House: [
    { title: 'Two Storey House in Savar', location: 'Savar, Dhaka', description: 'Independent house with a small front garden and space to park two cars, away from the city noise.', rentAmount: 900, bedrooms: 3, bathrooms: 2, amenities: ['parking', 'garden', 'generator'] },
    { title: 'Family House in Khilgaon', location: 'Khilgaon, Dhaka', description: 'Comfortable family home over two floors, with a large kitchen and a shaded courtyard at the back.', rentAmount: 980, bedrooms: 4, bathrooms: 2, amenities: ['wifi', 'parking', 'garden'] },
    { title: 'Garden House in Mohammadpur', location: 'Mohammadpur, Dhaka', description: 'Quiet house set back from the road, with mature trees, a boundary wall and a caretaker room.', rentAmount: 1100, bedrooms: 4, bathrooms: 3, amenities: ['wifi', 'garden', 'parking', 'security'] },
    { title: 'Spacious House in Nikunja 2', location: 'Nikunja 2, Dhaka', description: 'Bright house near the airport road, suitable for a large family or a small guest house operation.', rentAmount: 1200, bedrooms: 4, bathrooms: 3, amenities: ['wifi', 'parking', 'generator', 'security'] },
    { title: 'Corner House in Uttara 11', location: 'Uttara Sector 11, Dhaka', description: 'Corner plot house with windows on three sides, a roof terrace and covered parking for three cars.', rentAmount: 1350, bedrooms: 5, bathrooms: 3, amenities: ['wifi', 'parking', 'rooftop', 'garden', 'security'] },
    { title: 'Heritage House in Wari', location: 'Wari, Dhaka', description: 'Restored old Dhaka house with high ceilings, original mosaic floors and a private inner courtyard.', rentAmount: 1450, bedrooms: 4, bathrooms: 3, amenities: ['wifi', 'garden', 'parking'] },
  ],
  Duplex: [
    { title: 'Modern Duplex in Bashundhara', location: 'Bashundhara R/A, Dhaka', description: 'Two level duplex with an internal staircase, double height living room and a private roof access.', rentAmount: 1250, bedrooms: 4, bathrooms: 3, amenities: ['wifi', 'parking', 'lift', 'rooftop'] },
    { title: 'Duplex Penthouse in Banani', location: 'Banani, Dhaka', description: 'Top floor duplex with wraparound windows, two balconies and an open plan kitchen and dining area.', rentAmount: 1400, bedrooms: 4, bathrooms: 4, amenities: ['wifi', 'ac', 'lift', 'balcony', 'security'] },
    { title: 'Family Duplex in Mohakhali DOHS', location: 'Mohakhali DOHS, Dhaka', description: 'Generous duplex inside a secure DOHS estate, with bedrooms upstairs and living space on the lower floor.', rentAmount: 1550, bedrooms: 5, bathrooms: 4, amenities: ['wifi', 'parking', 'security', 'generator', 'gym'] },
    { title: 'Garden Duplex in Purbachal', location: 'Purbachal, Dhaka', description: 'New duplex on a wide plot with a lawn, outdoor seating area and room for a kitchen garden.', rentAmount: 1700, bedrooms: 5, bathrooms: 4, amenities: ['garden', 'parking', 'generator', 'security'] },
    { title: 'Executive Duplex in Baridhara', location: 'Baridhara, Dhaka', description: 'Diplomatic zone duplex finished to a high standard, with staff quarters and a dedicated study.', rentAmount: 1850, bedrooms: 5, bathrooms: 5, amenities: ['wifi', 'ac', 'parking', 'lift', 'security', 'gym'] },
    { title: 'Skyline Duplex in Gulshan 2', location: 'Gulshan 2, Dhaka', description: 'Landmark duplex with floor to ceiling glass, a private lift lobby and panoramic city views.', rentAmount: 2000, bedrooms: 4, bathrooms: 4, amenities: ['wifi', 'ac', 'lift', 'gym', 'rooftop', 'security'] },
  ],
  Villa: [
    { title: 'Lakeside Villa in Nikunja', location: 'Nikunja 2, Dhaka', description: 'Detached villa facing a small lake, with a wide veranda and mature landscaping around the plot.', rentAmount: 1900, bedrooms: 4, bathrooms: 3, amenities: ['garden', 'parking', 'security', 'generator'] },
    { title: 'Garden Villa in Purbachal', location: 'Purbachal, Dhaka', description: 'Peaceful villa on a large plot with a lawn, fruit trees and a separate drivers room.', rentAmount: 2200, bedrooms: 5, bathrooms: 4, amenities: ['garden', 'parking', 'generator', 'wifi'] },
    { title: 'Poolside Villa in Savar', location: 'Savar, Dhaka', description: 'Weekend villa with a private swimming pool, outdoor barbecue area and covered parking for four cars.', rentAmount: 2500, bedrooms: 5, bathrooms: 4, amenities: ['pool', 'garden', 'parking', 'generator'] },
    { title: 'Colonial Villa in Baridhara', location: 'Baridhara, Dhaka', description: 'Elegant villa with tall shuttered windows, a formal dining room and a walled garden at the rear.', rentAmount: 2800, bedrooms: 6, bathrooms: 5, amenities: ['wifi', 'ac', 'garden', 'parking', 'security'] },
    { title: 'Contemporary Villa in Gulshan 1', location: 'Gulshan 1, Dhaka', description: 'Architect designed villa with an open courtyard, skylights and a rooftop entertaining deck.', rentAmount: 3100, bedrooms: 5, bathrooms: 5, amenities: ['wifi', 'ac', 'rooftop', 'parking', 'gym', 'security'] },
    { title: 'Grand Villa in Bashundhara', location: 'Bashundhara R/A, Dhaka', description: 'The largest villa on the street, with a double garage, staff quarters, pool and a landscaped garden.', rentAmount: 3500, bedrooms: 6, bathrooms: 5, amenities: ['pool', 'garden', 'parking', 'gym', 'security', 'generator'] },
  ],
};

const main = async () => {
  // 1. Landlords who will own the listings (all share the password pass123).
  const password = await bcrypt.hash('pass123', 10);
  const landlords = [];

  for (const landlord of LANDLORDS) {
    const record = await prisma.user.upsert({
      where: { email: landlord.email },
      update: {},
      create: { ...landlord, password, role: 'LANDLORD', status: 'ACTIVE' },
    });
    landlords.push(record);
  }

  console.log(`Landlords ready: ${landlords.length}\n`);

  // 2. The listings, category by category.
  let created = 0;
  let skipped = 0;
  let owner = 0;

  for (const [categoryName, listings] of Object.entries(CATALOGUE)) {
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    for (const [index, listing] of listings.entries()) {
      const existing = await prisma.property.findFirst({
        where: { title: listing.title },
        select: { id: true },
      });

      if (existing) {
        skipped += 1;
        continue;
      }

      // Spread ownership so the platform does not look like one landlord.
      const landlord = landlords[owner % landlords.length];
      owner += 1;

      const availability: PropertyAvailability =
        index === listings.length - 1 ? 'RENTED' : 'AVAILABLE';

      await prisma.property.create({
        data: {
          ...listing,
          images: galleryFor(categoryName, index),
          availability,
          categoryId: category.id,
          landlordId: landlord.id,
        },
      });

      created += 1;
    }

    const total = await prisma.property.count({
      where: { categoryId: category.id, isDeleted: false },
    });

    console.log(`${categoryName.padEnd(10)} -> ${total} listings`);
  }

  console.log(`\nDone. ${created} created, ${skipped} already existed.`);
  console.log('All new landlords use the password: pass123');
};

main()
  .catch((error) => {
    console.error('❌ Failed to seed properties:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
