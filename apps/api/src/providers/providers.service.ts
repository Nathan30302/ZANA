import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ServiceCategory,
  ServiceMode,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
        services: { some: { isActive: true } },
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

  async getMe(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        services: { orderBy: { name: 'asc' } },
        photos: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!profile) throw new NotFoundException('Provider profile not found');
    return profile;
  }

  async updateMe(
    userId: string,
    input: {
      bio?: string;
      area?: string;
      lat?: number;
      lng?: number;
      address?: string;
      coverPhotoUrl?: string;
      displayName?: string;
    },
  ) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Provider profile not found');

    return this.prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.area !== undefined ? { area: input.area } : {}),
        ...(input.lat !== undefined ? { lat: input.lat } : {}),
        ...(input.lng !== undefined ? { lng: input.lng } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.coverPhotoUrl !== undefined
          ? { coverPhotoUrl: input.coverPhotoUrl }
          : {}),
        ...(input.displayName !== undefined
          ? { displayName: input.displayName }
          : {}),
      },
      include: {
        services: { orderBy: { name: 'asc' } },
        photos: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async createService(
    userId: string,
    input: {
      name: string;
      category: ServiceCategory;
      mode?: ServiceMode;
      priceZmw: number;
      durationMin?: number;
      description?: string;
    },
  ) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Provider profile not found');
    if (!input.name?.trim()) throw new BadRequestException('name required');
    if (input.priceZmw == null || input.priceZmw < 0) {
      throw new BadRequestException('priceZmw required');
    }

    return this.prisma.service.create({
      data: {
        providerId: profile.id,
        name: input.name.trim(),
        category: input.category,
        mode: input.mode ?? ServiceMode.AT_SHOP,
        priceZmw: input.priceZmw,
        durationMin: input.durationMin ?? 30,
        description: input.description,
      },
    });
  }

  async updateService(
    userId: string,
    serviceId: string,
    input: Partial<{
      name: string;
      category: ServiceCategory;
      mode: ServiceMode;
      priceZmw: number;
      durationMin: number;
      description: string;
      isActive: boolean;
    }>,
  ) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { provider: true },
    });
    if (!service || service.provider.userId !== userId) {
      throw new NotFoundException('Service not found');
    }
    return this.prisma.service.update({
      where: { id: serviceId },
      data: input as Prisma.ServiceUpdateInput,
    });
  }

  async deleteService(userId: string, serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { provider: true },
    });
    if (!service || service.provider.userId !== userId) {
      throw new NotFoundException('Service not found');
    }
    await this.prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });
    return { ok: true };
  }

  async addPhotos(userId: string, urls: string[]) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: { photos: true },
    });
    if (!profile) throw new NotFoundException('Provider profile not found');
    if (!urls?.length) throw new BadRequestException('urls required');

    const start = profile.photos.length;
    await this.prisma.providerPhoto.createMany({
      data: urls.map((url, i) => ({
        providerId: profile.id,
        url,
        sortOrder: start + i,
      })),
    });

    if (!profile.coverPhotoUrl && urls[0]) {
      await this.prisma.providerProfile.update({
        where: { id: profile.id },
        data: { coverPhotoUrl: urls[0] },
      });
    }

    return this.getMe(userId);
  }

  async setOnline(userId: string, isOnline: boolean) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: { services: { where: { isActive: true }, take: 1 } },
    });
    if (!profile) throw new NotFoundException('Provider profile not found');

    if (isOnline) {
      if (profile.creditBalance < 1) {
        throw new BadRequestException(
          'Buy float credits before going online',
        );
      }
      if (profile.services.length === 0) {
        throw new BadRequestException(
          'Add at least one service before going online',
        );
      }
      if (profile.lat == null || profile.lng == null) {
        throw new BadRequestException('Set your shop pin before going online');
      }
    }

    return this.prisma.providerProfile.update({
      where: { id: profile.id },
      data: { isOnline },
      include: {
        services: { where: { isActive: true } },
        photos: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }
}
