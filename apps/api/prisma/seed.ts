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
  services: SeedService[];
};

const seeds: SeedProvider[] = [
  {
    phone: '+260970000001',
    name: 'Lusaka Cuts',
    type: ProviderType.BARBERSHOP,
    area: 'CBD',
    lat: -15.4167,
    lng: 28.2833,
    bio: 'Classic fades and beard work in the heart of Lusaka.',
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
];

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
    const existing = await prisma.user.findUnique({ where: { phone: s.phone } });
    if (existing) {
      await prisma.providerProfile.updateMany({
        where: { userId: existing.id },
        data: {
          displayName: s.name,
          type: s.type,
          area: s.area,
          lat: s.lat,
          lng: s.lng,
          bio: s.bio,
          isVerified: true,
          isOnline: true,
        },
      });
      continue;
    }

    await prisma.user.create({
      data: {
        phone: s.phone,
        name: s.name,
        role: 'PROVIDER',
        providerProfile: {
          create: {
            type: s.type,
            displayName: s.name,
            area: s.area,
            lat: s.lat,
            lng: s.lng,
            bio: s.bio,
            isVerified: true,
            isOnline: true,
            creditBalance: 30,
            services: {
              create: s.services.map((svc) => ({
                name: svc.name,
                category: svc.category,
                mode: svc.mode ?? ServiceMode.AT_SHOP,
                priceZmw: svc.priceZmw,
                durationMin: svc.durationMin,
              })),
            },
          },
        },
      },
    });
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

  console.log(
    `Seeded ${seeds.length} Lusaka providers across ${AREAS.length} areas + float packages + admin`,
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
