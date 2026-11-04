import { PrismaClient, ProStatus, ProType, Role, BookingStatus, LocationType } from "@prisma/client";
import { addDays, setHours, setMinutes } from "date-fns";

const prisma = new PrismaClient();

const AREAS = ["Roma", "Kabulonga", "CBD", "Woodlands", "Rhodes Park", "Olympia", "Matero", "Chelstone"];

const PROS = [
  {
    phone: "+260970000001",
    name: "Chanda Mwale",
    displayName: "Lusaka Fades",
    type: ProType.SHOP,
    category: "Barber",
    bio: "Clean fades, beard sculpting, and classic cuts in the heart of Roma.",
    area: "Roma",
    lat: -15.3942,
    lng: 28.3228,
    homeService: true,
    travelFeeZmw: 40,
    coverUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80",
    services: [
      { name: "Classic Haircut", category: "Haircut", durationMin: 30, priceZmw: 80, homeEligible: true },
      { name: "Skin Fade", category: "Fade", durationMin: 45, priceZmw: 120, homeEligible: true },
      { name: "Beard Trim", category: "Haircut", durationMin: 20, priceZmw: 50, homeEligible: true },
    ],
  },
  {
    phone: "+260970000002",
    name: "Thandiwe Phiri",
    displayName: "Glow by Thandiwe",
    type: ProType.INDEPENDENT,
    category: "Makeup",
    bio: "Bridal and event glam that travels to you. Soft glam to full beat.",
    area: "Kabulonga",
    lat: -15.4175,
    lng: 28.3512,
    homeService: true,
    travelFeeZmw: 60,
    coverUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80",
    services: [
      { name: "Soft Glam Makeup", category: "Makeup", durationMin: 60, priceZmw: 350, homeEligible: true },
      { name: "Bridal Makeup", category: "Makeup", durationMin: 90, priceZmw: 800, homeEligible: true },
      { name: "Lashes + Brow", category: "Makeup", durationMin: 40, priceZmw: 180, homeEligible: true },
    ],
  },
  {
    phone: "+260970000003",
    name: "Grace Banda",
    displayName: "Nail Atelier Grace",
    type: ProType.SHOP,
    category: "Nails",
    bio: "Gel, acrylics, and nail art in a calm studio on Great East Road.",
    area: "Olympia",
    lat: -15.4011,
    lng: 28.3365,
    homeService: false,
    travelFeeZmw: 0,
    coverUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80",
    services: [
      { name: "Gel Manicure", category: "Nails", durationMin: 60, priceZmw: 200, homeEligible: false },
      { name: "Acrylic Full Set", category: "Nails", durationMin: 90, priceZmw: 350, homeEligible: false },
      { name: "Pedicure", category: "Nails", durationMin: 50, priceZmw: 180, homeEligible: false },
    ],
  },
  {
    phone: "+260970000004",
    name: "Mwansa Tembo",
    displayName: "Braids by Mwansa",
    type: ProType.INDEPENDENT,
    category: "Braids",
    bio: "Protective styles, knotless braids, and twists — at your place or mine.",
    area: "Chelstone",
    lat: -15.365,
    lng: 28.385,
    homeService: true,
    travelFeeZmw: 70,
    coverUrl: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&q=80",
    services: [
      { name: "Knotless Braids", category: "Braids", durationMin: 240, priceZmw: 450, homeEligible: true },
      { name: "Cornrows", category: "Braids", durationMin: 90, priceZmw: 200, homeEligible: true },
      { name: "Twist Out Style", category: "Braids", durationMin: 120, priceZmw: 280, homeEligible: true },
    ],
  },
  {
    phone: "+260970000005",
    name: "Joseph Sakala",
    displayName: "JS Mobile Barber",
    type: ProType.INDEPENDENT,
    category: "Barber",
    bio: "I come to your home, office, or hotel. Sharp cuts, zero queue.",
    area: "CBD",
    lat: -15.4167,
    lng: 28.2833,
    homeService: true,
    travelFeeZmw: 50,
    coverUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
    services: [
      { name: "Home Haircut", category: "Home Service", durationMin: 35, priceZmw: 100, homeEligible: true },
      { name: "Fade + Beard", category: "Fade", durationMin: 50, priceZmw: 150, homeEligible: true },
      { name: "Kids Cut", category: "Haircut", durationMin: 25, priceZmw: 60, homeEligible: true },
    ],
  },
  {
    phone: "+260970000006",
    name: "Mutinta Zulu",
    displayName: "Silk & Crown Salon",
    type: ProType.SHOP,
    category: "Salon",
    bio: "Wash, treatment, silk press, and colour in Woodlands.",
    area: "Woodlands",
    lat: -15.428,
    lng: 28.318,
    homeService: true,
    travelFeeZmw: 80,
    coverUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
    services: [
      { name: "Wash & Blowout", category: "Haircut", durationMin: 60, priceZmw: 180, homeEligible: false },
      { name: "Silk Press", category: "Salon", durationMin: 90, priceZmw: 320, homeEligible: true },
      { name: "Deep Treatment", category: "Salon", durationMin: 45, priceZmw: 150, homeEligible: true },
    ],
  },
];

async function main() {
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.floatTransaction.deleteMany();
  await prisma.portfolioPhoto.deleteMany();
  await prisma.applicationDocument.deleteMany();
  await prisma.workingHour.deleteMany();
  await prisma.service.deleteMany();
  await prisma.professionalProfile.deleteMany();
  await prisma.otpChallenge.deleteMany();
  await prisma.user.deleteMany();
  await prisma.platformSettings.deleteMany();

  await prisma.platformSettings.create({
    data: { id: 1, commissionPercent: 12, homeCommissionPercent: 10, minFloatZmw: 50 },
  });

  const admin = await prisma.user.create({
    data: {
      phone: "+260970000099",
      name: "Zana Admin",
      email: "admin@zana.zm",
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.create({
    data: {
      phone: "+260970000010",
      name: "Nathan Customer",
      email: "nathan@example.com",
      role: Role.CUSTOMER,
    },
  });

  const extraCustomers = await Promise.all(
    ["+260970000011", "+260970000012"].map((phone, i) =>
      prisma.user.create({
        data: { phone, name: `Demo Client ${i + 1}`, role: Role.CUSTOMER },
      }),
    ),
  );

  const createdPros = [];

  for (const [index, pro] of PROS.entries()) {
    const user = await prisma.user.create({
      data: {
        phone: pro.phone,
        name: pro.name,
        role: Role.PROFESSIONAL,
        avatarUrl: pro.coverUrl,
      },
    });

    const profile = await prisma.professionalProfile.create({
      data: {
        userId: user.id,
        displayName: pro.displayName,
        type: pro.type,
        status: ProStatus.APPROVED,
        verified: true,
        bio: pro.bio,
        category: pro.category,
        coverUrl: pro.coverUrl,
        lat: pro.lat,
        lng: pro.lng,
        area: pro.area,
        address: `${pro.area}, Lusaka`,
        homeService: pro.homeService,
        travelFeeZmw: pro.travelFeeZmw,
        floatBalanceZmw: 500,
        ratingAvg: 4.6 + (index % 4) * 0.1,
        ratingCount: 12 + index * 3,
        services: {
          create: pro.services,
        },
        portfolio: {
          create: [
            { url: pro.coverUrl, caption: "Signature look" },
            {
              url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80",
              caption: "Client work",
            },
            {
              url: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&q=80",
              caption: "Studio / setup",
            },
          ],
        },
        documents: {
          create: [
            { kind: "ID", url: "https://placehold.co/600x400/png?text=NRC" },
            { kind: "PORTFOLIO", url: pro.coverUrl },
          ],
        },
        hours: {
          create: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
            dayOfWeek,
            startMin: 9 * 60,
            endMin: 18 * 60,
            enabled: true,
          })),
        },
      },
      include: { services: true },
    });

    await prisma.floatTransaction.create({
      data: {
        userId: user.id,
        type: "TOP_UP",
        amountZmw: 500,
        balanceAfter: 500,
        note: "Starter float (seed)",
      },
    });

    createdPros.push(profile);
  }

  // Pending application for admin queue demo
  const pendingUser = await prisma.user.create({
    data: {
      phone: "+260970000020",
      name: "Pending Pro",
      role: Role.PROFESSIONAL,
    },
  });
  await prisma.professionalProfile.create({
    data: {
      userId: pendingUser.id,
      displayName: "Fresh Cuts Mobile",
      type: ProType.INDEPENDENT,
      status: ProStatus.PENDING,
      verified: false,
      bio: "New mobile barber applying to Zana.",
      category: "Barber",
      area: "Matero",
      lat: -15.38,
      lng: 28.27,
      homeService: true,
      travelFeeZmw: 45,
      coverUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e789bcc?w=800&q=80",
      services: {
        create: [
          { name: "Mobile Fade", category: "Fade", durationMin: 40, priceZmw: 110, homeEligible: true },
        ],
      },
      documents: {
        create: [{ kind: "ID", url: "https://placehold.co/600x400/png?text=Pending+ID" }],
      },
      hours: {
        create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
          dayOfWeek,
          startMin: 10 * 60,
          endMin: 17 * 60,
          enabled: true,
        })),
      },
    },
  });

  const pro0 = createdPros[0];
  const svc = pro0.services[0];
  const tomorrow = setMinutes(setHours(addDays(new Date(), 1), 10), 0);

  await prisma.booking.create({
    data: {
      customerId: customer.id,
      professionalId: pro0.id,
      serviceId: svc.id,
      status: BookingStatus.ACCEPTED,
      locationType: LocationType.AT_HOME,
      address: "12 Twin Palms Road, Kabulonga, Lusaka",
      scheduledAt: tomorrow,
      servicePriceZmw: svc.priceZmw,
      travelFeeZmw: pro0.travelFeeZmw,
      commissionZmw: Math.round(svc.priceZmw * 0.1),
      customerNote: "Please bring cape — kids at home.",
    },
  });

  const past = setMinutes(setHours(addDays(new Date(), -3), 14), 0);
  const pastBooking = await prisma.booking.create({
    data: {
      customerId: customer.id,
      professionalId: createdPros[1].id,
      serviceId: createdPros[1].services[0].id,
      status: BookingStatus.COMPLETED,
      locationType: LocationType.AT_HOME,
      address: "Roma Park, Lusaka",
      scheduledAt: past,
      servicePriceZmw: createdPros[1].services[0].priceZmw,
      travelFeeZmw: 60,
      commissionZmw: Math.round(createdPros[1].services[0].priceZmw * 0.1),
    },
  });

  await prisma.review.create({
    data: {
      bookingId: pastBooking.id,
      fromUserId: customer.id,
      toUserId: createdPros[1].userId,
      rating: 5,
      comment: "Incredible glam — on time and so professional.",
    },
  });

  await prisma.favorite.create({
    data: { userId: customer.id, professionalId: pro0.id },
  });

  console.log("Seeded Zana demo data");
  console.log("Customer:", customer.phone, "OTP:", process.env.OTP_DEV_CODE || "123456");
  console.log("Pro:", PROS[0].phone);
  console.log("Admin:", admin.phone);
  console.log("Areas:", AREAS.join(", "));
  console.log("Extra customers:", extraCustomers.map((c) => c.phone).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
