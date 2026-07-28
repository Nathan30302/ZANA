import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        provider: {
          include: {
            services: { where: { isActive: true }, take: 3 },
            photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async add(userId: string, providerId: string) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
    });
    if (!provider || !provider.isVerified) {
      throw new NotFoundException('Provider not found');
    }
    try {
      return await this.prisma.favorite.create({
        data: { userId, providerId },
        include: { provider: true },
      });
    } catch {
      throw new BadRequestException('Already favorited');
    }
  }

  async remove(userId: string, providerId: string) {
    await this.prisma.favorite.deleteMany({
      where: { userId, providerId },
    });
    return { ok: true };
  }

  async isFavorite(userId: string, providerId: string) {
    const row = await this.prisma.favorite.findUnique({
      where: { userId_providerId: { userId, providerId } },
    });
    return { favorited: !!row };
  }
}
