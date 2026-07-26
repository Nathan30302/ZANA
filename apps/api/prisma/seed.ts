import { PrismaClient, ServiceCategory, ServiceMode, ProviderType } from '@prisma/client';

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

  const seeds = [
    {
      phone: '+260970000001',
      name: 'Lusaka Cuts',
      type: ProviderType.BARBERSHOP,
      area: 'CBD',
      lat: -15.4167,
      lng: 28.2833,
      services: [
        { name: 'Fade', category: ServiceCategory.BARBER, priceZmw: 80, durationMin: 30 },
        { name: 'Beard trim', category: ServiceCategory.BARBER, priceZmw: 40, durationMin: 15 },
      ],
    },
    {
      phone: '+260970000002',
      name: 'Roma Glow Salon',
      type: ProviderType.SALON,
      area: 'Roma',
      lat: -15.3875,
      lng: 28.3228,
      services: [
        { name: 'Wash & set', category: ServiceCategory.SALON, priceZmw: 150, durationMin: 60 },
        { name: 'Box braids', category: ServiceCategory.SALON, priceZmw: 350, durationMin: 180 },
      ],
    },
    {
      phone: '+260970000003',
      name: 'Mobile Mike',
      type: ProviderType.INDEPENDENT,
      area: 'Kabulonga',
      lat: -15.408,
      lng: 28.34,
      services: [
        {
          name: 'Home visit cut',
          category: ServiceCategory.MOBILE,
          priceZmw: 120,
          durationMin: 40,
          mode: ServiceMode.COMES_TO_YOU,
        },
      ],
    },
  ];

  for (const s of seeds) {
    const user = await prisma.user.upsert({
      where: { phone: s.phone },
      update: {},
      create: {
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
    void user;
  }

  // Ensure areas list is documented via a dummy admin
  await prisma.user.upsert({
    where: { phone: '+260970000099' },
    update: {},
    create: {
      phone: '+260970000099',
      name: 'ZANA Admin',
      role: 'ADMIN',
    },
  });

  console.log(`Seeded float packages, ${seeds.length} providers, areas: ${AREAS.join(', ')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
