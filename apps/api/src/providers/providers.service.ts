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
    online?: boolean;
    radiusKm?: number;
  }) {
    const rows = await this.prisma.providerProfile.findMany({
      where: {
        isVerified: true,
        services: { some: { isActive: true } },
        ...(params.online === true
          ? { isOnline: true }
          : params.online === false
            ? { isOnline: false }
            : {}),
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

    const radius =
      params.radiusKm != null && Number.isFinite(params.radiusKm)
        ? params.radiusKm
        : null;

    return rows
      .map((p) => {
        const distanceKm =
          p.lat != null && p.lng != null
            ? haversineKm(params.lat!, params.lng!, p.lat, p.lng)
            : null;
        return { ...p, distanceKm };
      })
      .filter((p) => {
        if (radius == null) return true;
        return p.distanceKm != null && p.distanceKm <= radius;
      })
      .sort((a, b) => {
        // Online first, then nearest.
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
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
    const owned = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        services: { orderBy: { name: 'asc' } },
        photos: { orderBy: { sortOrder: 'asc' } },
        staff: {
          include: {
            user: { select: { id: true, phone: true, name: true } },
          },
        },
      },
    });
    if (owned) return { ...owned, roleOnShop: 'OWNER' as const };

    const membership = await this.prisma.staffMembership.findFirst({
      where: { userId },
      include: {
        provider: {
          include: {
            services: { where: { isActive: true }, orderBy: { name: 'asc' } },
            photos: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (!membership) throw new NotFoundException('Provider profile not found');
    return {
      ...membership.provider,
      roleOnShop: 'STAFF' as const,
      staffTitle: membership.title,
      membershipId: membership.id,
    };
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
      hours?: string;
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
        ...(input.hours !== undefined ? { hours: input.hours } : {}),
      },
      include: {
        services: { orderBy: { name: 'asc' } },
        photos: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async readiness(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        services: { where: { isActive: true } },
        photos: true,
      },
    });
    if (!profile) throw new NotFoundException('Provider profile not found');

    const checks: Array<{
      key: string;
      label: string;
      ok: boolean;
      required: boolean;
    }> = [
      {
        key: 'verified',
        label: 'Approved by ZANA',
        ok: profile.isVerified,
        required: true,
      },
      {
        key: 'pin',
        label: 'Shop pin on map',
        ok: profile.lat != null && profile.lng != null,
        required: true,
      },
      {
        key: 'services',
        label: 'At least one service',
        ok: profile.services.length > 0,
        required: true,
      },
      {
        key: 'hours',
        label: 'Opening hours',
        ok: !!profile.hours?.trim(),
        required: true,
      },
      {
        key: 'float',
        label: 'Float credits > 0',
        ok: profile.creditBalance > 0,
        required: true,
      },
      {
        key: 'bio',
        label: 'Bio',
        ok: !!profile.bio?.trim(),
        required: true,
      },
      {
        key: 'photos',
        label: 'Portfolio photo (recommended)',
        ok: profile.photos.length > 0 || !!profile.coverPhotoUrl,
        required: false,
      },
    ];

    const blockers = checks
      .filter((c) => c.required && !c.ok)
      .map((c) => c.label);

    return {
      ready: blockers.length === 0,
      blockers,
      checks,
      creditBalance: profile.creditBalance,
      isOnline: profile.isOnline,
    };
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
    if (isOnline) {
      const ready = await this.readiness(userId);
      if (!ready.ready) {
        throw new BadRequestException(
          `Complete setup first: ${ready.blockers.join(', ')}`,
        );
      }
    }

    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Provider profile not found');

    return this.prisma.providerProfile.update({
      where: { id: profile.id },
      data: { isOnline },
      include: {
        services: { where: { isActive: true } },
        photos: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async listStaff(ownerUserId: string) {
    const profile = await this.requireOwnedProfile(ownerUserId);
    return this.prisma.staffMembership.findMany({
      where: { providerId: profile.id },
      include: {
        user: { select: { id: true, phone: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteStaff(
    ownerUserId: string,
    input: { phone: string; title?: string; name?: string },
  ) {
    const profile = await this.requireOwnedProfile(ownerUserId);
    const phone = this.normalizePhone(input.phone);
    if (!phone) throw new BadRequestException('phone required');

    const existing = await this.prisma.user.findUnique({ where: { phone } });
    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            ...(input.name ? { name: input.name } : {}),
            ...(existing.role === 'CUSTOMER' ? { role: 'STAFF' as const } : {}),
          },
        })
      : await this.prisma.user.create({
          data: {
            phone,
            name: input.name ?? null,
            role: 'STAFF',
          },
        });

    try {
      return await this.prisma.staffMembership.create({
        data: {
          providerId: profile.id,
          userId: user.id,
          title: input.title?.trim() || 'Stylist',
        },
        include: {
          user: { select: { id: true, phone: true, name: true, role: true } },
        },
      });
    } catch {
      throw new BadRequestException('Staff already on this shop');
    }
  }

  async removeStaff(ownerUserId: string, membershipId: string) {
    const profile = await this.requireOwnedProfile(ownerUserId);
    const row = await this.prisma.staffMembership.findUnique({
      where: { id: membershipId },
    });
    if (!row || row.providerId !== profile.id) {
      throw new NotFoundException('Staff member not found');
    }
    await this.prisma.staffMembership.delete({ where: { id: membershipId } });
    return { ok: true };
  }

  private async requireOwnedProfile(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Provider profile not found');
    return profile;
  }

  private normalizePhone(phone: string) {
    const digits = phone.replace(/\s+/g, '');
    if (digits.startsWith('+')) return digits;
    if (digits.startsWith('260')) return `+${digits}`;
    if (digits.startsWith('0')) return `+260${digits.slice(1)}`;
    return `+260${digits}`;
  }
}
