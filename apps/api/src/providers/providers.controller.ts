import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ServiceCategory } from '@prisma/client';
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

  @Patch('me/online')
  async setOnline(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { isOnline: boolean },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.providers.setOnline(user.id, !!body.isOnline);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.providers.get(id);
  }
}
