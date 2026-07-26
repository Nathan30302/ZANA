import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceCategory } from '@prisma/client';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  list(params: { area?: string; category?: ServiceCategory; q?: string }) {
    return this.prisma.providerProfile.findMany({
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
