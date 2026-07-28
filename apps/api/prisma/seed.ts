import {
  PrismaClient,
  ProviderType,
  ServiceCategory,
  ServiceMode,
} from '@prisma/client';

const prisma = new PrismaClient();

const AREAS = [
  'Roma',
  'Kabulonga',
  'CBD',
  'Woodlands',
  'Rhodes Park',
  'Olympia',
  'Chilanga',
  'Chelstone',
  'Matero',
  'Chilenje',
] as const;

type SeedService = {
  name: string;
  category: ServiceCategory;
  priceZmw: number;
  durationMin: number;
  mode?: ServiceMode;
};

type SeedProvider = {
  phone: string;
  name: string;
  type: ProviderType;
  area: (typeof AREAS)[number];
  lat: number;
  lng: number;
  bio?: string;
  coverPhotoUrl?: string;
  photoUrls?: string[];
  services: SeedService[];
};

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80';
const PLACEHOLDER_2 =
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80';

const seeds: SeedProvider[] = [
  {
    phone: '+260970000001',
    name: 'Lusaka Cuts',
    type: ProviderType.BARBERSHOP,
    area: 'CBD',
    lat: -15.4167,
    lng: 28.2833,
    bio: 'Classic fades and beard work in the heart of Lusaka.',
    coverPhotoUrl: PLACEHOLDER,
    photoUrls: [PLACEHOLDER, PLACEHOLDER_2],
    services: [
      { name: 'Fade', category: ServiceCategory.BARBER, priceZmw: 80, durationMin: 30 },
      { name: 'Beard trim', category: ServiceCategory.BARBER, priceZmw: 40, durationMin: 15 },
      { name: 'Kids cut', category: ServiceCategory.BARBER, priceZmw: 50, durationMin: 25 },
    ],
  },
  {
    phone: '+260970000002',
    name: 'Roma Glow Salon',
    type: ProviderType.SALON,
    area: 'Roma',
    lat: -15.3875,
    lng: 28.3228,
    bio: 'Braids, washes, and event glam.',
    coverPhotoUrl: PLACEHOLDER_2,
    photoUrls: [PLACEHOLDER_2],
    services: [
      { name: 'Wash & set', category: ServiceCategory.SALON, priceZmw: 150, durationMin: 60 },
      { name: 'Box braids', category: ServiceCategory.SALON, priceZmw: 350, durationMin: 180 },
      { name: 'Bridal trial', category: ServiceCategory.BRIDAL, priceZmw: 500, durationMin: 120 },
    ],
  },
  {
    phone: '+260970000003',
    name: 'Mobile Mike',
    type: ProviderType.INDEPENDENT,
    area: 'Kabulonga',
    lat: -15.408,
    lng: 28.34,
    bio: 'I come to you — home and office cuts.',
    coverPhotoUrl: PLACEHOLDER,
    services: [
      {
        name: 'Home visit cut',
        category: ServiceCategory.MOBILE,
        priceZmw: 120,
        durationMin: 40,
        mode: ServiceMode.COMES_TO_YOU,
      },
      {
        name: 'Office fade',
        category: ServiceCategory.MOBILE,
        priceZmw: 130,
        durationMin: 35,
        mode: ServiceMode.COMES_TO_YOU,
      },
    ],
  },
  {
    phone: '+260970000004',
    name: 'Woodlands Nail Lab',
    type: ProviderType.SALON,
    area: 'Woodlands',
    lat: -15.405,
    lng: 28.31,
    bio: 'Gel, acrylics, and clean nail care.',
    coverPhotoUrl: PLACEHOLDER_2,
    services: [
      { name: 'Gel manicure', category: ServiceCategory.NAILS, priceZmw: 180, durationMin: 60 },
      { name: 'Acrylic set', category: ServiceCategory.NAILS, priceZmw: 250, durationMin: 90 },
    ],
  },
  {
    phone: '+260970000005',
    name: 'Matero Fresh Barbers',
    type: ProviderType.BARBERSHOP,
    area: 'Matero',
    lat: -15.38,
    lng: 28.25,
    bio: 'Neighborhood shop — walk-ins welcome.',
    coverPhotoUrl: PLACEHOLDER,
    services: [
      { name: 'Standard cut', category: ServiceCategory.BARBER, priceZmw: 60, durationMin: 25 },
      { name: 'Shape up', category: ServiceCategory.BARBER, priceZmw: 30, durationMin: 15 },
    ],
  },
  {
    phone: '+260970000006',
    name: 'Chilenje Stitch & Style',
    type: ProviderType.INDEPENDENT,
    area: 'Chilenje',
    lat: -15.45,
    lng: 28.35,
    bio: 'Natural hair specialist — at shop or home.',
    coverPhotoUrl: PLACEHOLDER_2,
    services: [
      { name: 'Twist out', category: ServiceCategory.SALON, priceZmw: 200, durationMin: 90 },
      {
        name: 'Mobile loc retwist',
        category: ServiceCategory.MOBILE,
        priceZmw: 220,
        durationMin: 100,
        mode: ServiceMode.COMES_TO_YOU,
      },
    ],
  },
  {
    phone: '+260970000007',
    name: 'Olympia Edge',
    type: ProviderType.BARBERSHOP,
    area: 'Olympia',
    lat: -15.4,
    lng: 28.3,
    bio: 'Sharp lines, soft fades.',
    coverPhotoUrl: PLACEHOLDER,
    services: [
      { name: 'Skin fade', category: ServiceCategory.BARBER, priceZmw: 90, durationMin: 35 },
      { name: 'Hot towel shave', category: ServiceCategory.BARBER, priceZmw: 70, durationMin: 25 },
    ],
  },
  {
    phone: '+260970000008',
    name: 'Rhodes Park Glam',
    type: ProviderType.SALON,
    area: 'Rhodes Park',
    lat: -15.415,
    lng: 28.295,
    bio: 'Bridal and evening looks.',
    coverPhotoUrl: PLACEHOLDER_2,
    services: [
      { name: 'Makeup', category: ServiceCategory.BRIDAL, priceZmw: 400, durationMin: 90 },
      { name: 'Silk press', category: ServiceCategory.SALON, priceZmw: 220, durationMin: 75 },
    ],
  },
  {
    phone: '+260970000009',
    name: 'Chelstone Mobile Nails',
    type: ProviderType.INDEPENDENT,
    area: 'Chelstone',
    lat: -15.36,
    lng: 28.36,
    bio: 'Nails at your doorstep.',
    coverPhotoUrl: PLACEHOLDER,
    services: [
      {
        name: 'Home gel set',
        category: ServiceCategory.NAILS,
        priceZmw: 200,
        durationMin: 70,
        mode: ServiceMode.COMES_TO_YOU,
      },
    ],
  },
  {
    phone: '+260970000010',
    name: 'Chilanga Cuts Co.',
    type: ProviderType.BARBERSHOP,
    area: 'Chilanga',
    lat: -15.48,
    lng: 28.27,
    bio: 'Family barbershop south of town.',
    coverPhotoUrl: PLACEHOLDER,
    services: [
      { name: 'Dad & son cut', category: ServiceCategory.BARBER, priceZmw: 110, durationMin: 50 },
    ],
  },
];

async function upsertProvider(s: SeedProvider) {
  const user = await prisma.user.upsert({
    where: { phone: s.phone },
    update: { name: s.name, role: 'PROVIDER' },
    create: {
      phone: s.phone,
      name: s.name,
      role: 'PROVIDER',
    },
  });

  const profile = await prisma.providerProfile.upsert({
    where: { userId: user.id },
    update: {
      displayName: s.name,
      type: s.type,
      area: s.area,
      lat: s.lat,
      lng: s.lng,
      bio: s.bio,
      coverPhotoUrl: s.coverPhotoUrl,
      isVerified: true,
      isOnline: true,
    },
    create: {
      userId: user.id,
      type: s.type,
      displayName: s.name,
      area: s.area,
      lat: s.lat,
      lng: s.lng,
      bio: s.bio,
      coverPhotoUrl: s.coverPhotoUrl,
      isVerified: true,
      isOnline: true,
      creditBalance: 30,
    },
  });

  const existingServices = await prisma.service.count({
    where: { providerId: profile.id },
  });
  if (existingServices === 0) {
    await prisma.service.createMany({
      data: s.services.map((svc) => ({
        providerId: profile.id,
        name: svc.name,
        category: svc.category,
        mode: svc.mode ?? ServiceMode.AT_SHOP,
        priceZmw: svc.priceZmw,
        durationMin: svc.durationMin,
      })),
    });
  }

  if (s.photoUrls?.length) {
    const photoCount = await prisma.providerPhoto.count({
      where: { providerId: profile.id },
    });
    if (photoCount === 0) {
      await prisma.providerPhoto.createMany({
        data: s.photoUrls.map((url, i) => ({
          providerId: profile.id,
          url,
          sortOrder: i,
        })),
      });
    }
  }

  return profile;
}

async function seedSampleReviews() {
  const customer = await prisma.user.upsert({
    where: { phone: '+260970000050' },
    update: { name: 'Demo Customer' },
    create: {
      phone: '+260970000050',
      name: 'Demo Customer',
      role: 'CUSTOMER',
    },
  });

  const lusakaCuts = await prisma.providerProfile.findFirst({
    where: { displayName: 'Lusaka Cuts' },
    include: { services: true },
  });
  const roma = await prisma.providerProfile.findFirst({
    where: { displayName: 'Roma Glow Salon' },
    include: { services: true },
  });
  if (!lusakaCuts?.services[0] || !roma?.services[0]) return;

  for (const [provider, service, rating, comment] of [
    [lusakaCuts, lusakaCuts.services[0], 5, 'Clean fade, on time.'] as const,
    [lusakaCuts, lusakaCuts.services[0], 4, 'Good shop in CBD.'] as const,
    [roma, roma.services[0], 5, 'Loved my wash & set.'] as const,
  ]) {
    const existing = await prisma.booking.findFirst({
      where: {
        customerId: customer.id,
        providerId: provider.id,
        serviceId: service.id,
        status: 'RATED',
        review: { isNot: null },
      },
      include: { review: true },
    });
    if (existing?.review) continue;

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        providerId: provider.id,
        serviceId: service.id,
        status: 'RATED',
        priceZmw: service.priceZmw,
        creditBurned: true,
        customerAddress: 'Demo address, Lusaka',
      },
    });
    await prisma.review.create({
      data: {
        bookingId: booking.id,
        userId: customer.id,
        rating,
        comment,
      },
    });
  }

  for (const profile of [lusakaCuts, roma]) {
    const agg = await prisma.review.aggregate({
      where: { booking: { providerId: profile.id } },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count,
      },
    });
  }
}

async function main() {
  await prisma.floatPackage.createMany({
    data: [
      { code: 'STARTER', name: 'Starter', credits: 10, priceZmw: 150 },
      { code: 'PRO', name: 'Pro', credits: 30, priceZmw: 400 },
      { code: 'ELITE', name: 'Elite', credits: 100, priceZmw: 1200 },
    ],
    skipDuplicates: true,
  });

  for (const s of seeds) {
    await upsertProvider(s);
  }

  await prisma.user.upsert({
    where: { phone: '+260970000099' },
    update: { role: 'ADMIN', name: 'ZANA Admin' },
    create: {
      phone: '+260970000099',
      name: 'ZANA Admin',
      role: 'ADMIN',
    },
  });

  await seedSampleReviews();

  console.log(
    `Seeded ${seeds.length} Lusaka providers across ${AREAS.length} areas + reviews + float packages + admin`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
