import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(
    private readonly favorites: FavoritesService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  async list(@Headers('authorization') authorization?: string) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.favorites.list(user.id);
  }

  @Post()
  async add(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { providerId: string },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.favorites.add(user.id, body.providerId);
  }

  @Delete(':providerId')
  async remove(
    @Headers('authorization') authorization: string | undefined,
    @Param('providerId') providerId: string,
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.favorites.remove(user.id, providerId);
  }

  @Get(':providerId/status')
  async status(
    @Headers('authorization') authorization: string | undefined,
    @Param('providerId') providerId: string,
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.favorites.isFavorite(user.id, providerId);
  }
}
