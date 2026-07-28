import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ServiceCategory, ServiceMode } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { ProvidersService } from './providers.service';

@Controller('providers')
export class ProvidersController {
  constructor(
    private readonly providers: ProvidersService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  list(
    @Query('area') area?: string,
    @Query('category') category?: ServiceCategory,
    @Query('q') q?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    return this.providers.list({
      area,
      category,
      q,
      lat: lat != null ? Number(lat) : undefined,
      lng: lng != null ? Number(lng) : undefined,
    });
  }

  @Get('me')
  async me(@Headers('authorization') authorization: string | undefined) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.providers.getMe(user.id);
  }

  @Get('me/readiness')
  async readiness(@Headers('authorization') authorization: string | undefined) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.providers.readiness(user.id);
  }

  @Patch('me')
  async updateMe(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
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
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.providers.updateMe(user.id, body);
  }

  @Patch('me/online')
  async setOnline(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { isOnline: boolean },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.providers.setOnline(user.id, !!body.isOnline);
  }

  @Post('me/services')
  async createService(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      name: string;
      category: ServiceCategory;
      mode?: ServiceMode;
      priceZmw: number;
      durationMin?: number;
      description?: string;
    },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.providers.createService(user.id, body);
  }

  @Patch('me/services/:id')
  async updateService(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      category: ServiceCategory;
      mode: ServiceMode;
      priceZmw: number;
      durationMin: number;
      description: string;
      isActive: boolean;
    }>,
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.providers.updateService(user.id, id, body);
  }

  @Delete('me/services/:id')
  async deleteService(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.providers.deleteService(user.id, id);
  }

  @Post('me/photos')
  async addPhotos(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { urls: string[] },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.providers.addPhotos(user.id, body.urls ?? []);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.providers.get(id);
  }
}
