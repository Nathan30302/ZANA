/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Passw0rd!', 12);
  const adminHash = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@zana.zm' },
    update: {},
    create: {
      email: 'admin@zana.zm',
      phone: '0960000000',
      password: adminHash,
      firstName: 'Platform',
      lastName: 'Admin',
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
    },
  });

  // Provider user + venue
  const providerUser = await prisma.user.upsert({
    where: { email: 'provider@zana.dev' },
    update: {},
    create: {
      email: 'provider@zana.dev',
      phone: '0971234567',
      password: passwordHash,
      firstName: 'Daka',
      lastName: 'Kutz',
      role: 'PROVIDER_VENUE',
      isVerified: true,
      isActive: true,
    },
  });

  const venue = await prisma.venue.upsert({
    where: { slug: 'kutz-by-daka' },
    update: {
      ownerId: providerUser.id,
      status: 'APPROVED',
    },
    create: {
      ownerId: providerUser.id,
      name: 'Kutz by Daka',
      slug: 'kutz-by-daka',
      description: 'Premium barbering with modern styles.',
      category: 'BARBERSHOP',
      phone: '0971234567',
      email: 'kutz@example.com',
      address: 'Great East Road',
      city: 'Lusaka',
      latitude: -15.3989,
      longitude: 28.2915,
      coverPhoto: null,
      photos: [],
      status: 'APPROVED',
      rating: 4.7,
      reviewCount: 128,
      isVerified: true,
      amenities: ['Wi‑Fi', 'Card payments', 'Parking'],
    },
  });

  // Opening hours (Mon-Sat open)
  const oh = [
    { dayOfWeek: 1, openTime: '08:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 2, openTime: '08:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 3, openTime: '08:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 4, openTime: '08:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 5, openTime: '08:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 6, openTime: '09:00', closeTime: '17:00', isClosed: false },
    { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isClosed: true },
  ];
  for (const row of oh) {
    const existing = await prisma.openingHours.findFirst({
      where: { venueId: venue.id, dayOfWeek: row.dayOfWeek },
    });
    if (existing) {
      await prisma.openingHours.update({
        where: { id: existing.id },
        data: row,
      });
    } else {
      await prisma.openingHours.create({
        data: { venueId: venue.id, ...row },
      });
    }
  }

  // Staff
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@zana.dev' },
    update: {},
    create: {
      email: 'staff@zana.dev',
      phone: '0971111111',
      password: passwordHash,
      firstName: 'John',
      lastName: 'Mumba',
      role: 'STAFF',
      isVerified: true,
      isActive: true,
    },
  });

  const staff = await prisma.staff.upsert({
    where: { userId: staffUser.id },
    update: { venueId: venue.id, isActive: true },
    create: {
      userId: staffUser.id,
      venueId: venue.id,
      title: 'Senior Barber',
      isActive: true,
    },
  });

  // Services
  const services = [
    { name: 'Haircut & Style', price: 250, duration: 45, category: 'HAIRCUT' },
    { name: 'Beard Trim', price: 120, duration: 20, category: 'BEARD_TRIM' },
  ];

  for (const s of services) {
    const existing = await prisma.service.findFirst({
      where: { venueId: venue.id, name: s.name },
    });
    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: { price: s.price, duration: s.duration, category: s.category, isActive: true },
      });
    } else {
      await prisma.service.create({
        data: {
          venueId: venue.id,
          mobileProviderId: null,
          name: s.name,
          description: null,
          category: s.category,
          price: s.price,
          duration: s.duration,
          isActive: true,
        },
      });
    }
  }

  // Demo customer
  await prisma.user.upsert({
    where: { email: 'customer@zana.dev' },
    update: {},
    create: {
      email: 'customer@zana.dev',
      phone: '0970000000',
      password: passwordHash,
      firstName: 'Dev',
      lastName: 'Customer',
      role: 'CUSTOMER',
      isVerified: true,
      isActive: true,
    },
  });

  console.log('Seed complete:', { venueId: venue.id, staffId: staff.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

