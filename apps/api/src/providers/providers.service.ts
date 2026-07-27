import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceCategory } from '@prisma/client';

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    area?: string;
    category?: ServiceCategory;
    q?: string;
    lat?: number;
    lng?: number;
  }) {
    const rows = await this.prisma.providerProfile.findMany({
      where: {
        isVerified: true,
        ...(params.area ? { area: params.area } : {}),
        ...(params.q
          ? {
              OR: [
                { displayName: { contains: params.q, mode: 'insensitive' } },
                { bio: { contains: params.q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(params.category
          ? { services: { some: { category: params.category, isActive: true } } }
          : {}),
      },
      include: {
        services: { where: { isActive: true } },
        photos: { orderBy: { sortOrder: 'asc' }, take: 6 },
      },
      orderBy: [{ isOnline: 'desc' }, { ratingAvg: 'desc' }],
    });

    if (params.lat == null || params.lng == null) return rows;

    return rows
      .map((p) => {
        const distanceKm =
          p.lat != null && p.lng != null
            ? haversineKm(params.lat!, params.lng!, p.lat, p.lng)
            : null;
        return { ...p, distanceKm };
      })
      .sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
  }

  async get(id: string) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id },
      include: {
        services: { where: { isActive: true } },
        photos: { orderBy: { sortOrder: 'asc' } },
        staff: { include: { user: true } },
      },
    });
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }

  async setOnline(userId: string, isOnline: boolean) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Provider profile not found');
    return this.prisma.providerProfile.update({
      where: { id: profile.id },
      data: { isOnline },
    });
  }
}
