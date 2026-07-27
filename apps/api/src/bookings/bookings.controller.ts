import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly auth: AuthService,
  ) {}

  @Post()
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      providerId: string;
      serviceId: string;
      scheduledAt?: string;
      customerLat?: number;
      customerLng?: number;
      customerAddress?: string;
      notes?: string;
    },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.bookings.create(user.id, body);
  }

  @Get()
  async list(
    @Headers('authorization') authorization: string | undefined,
    @Query('as') asRole: 'customer' | 'provider' = 'customer',
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.bookings.listForUser(user.id, asRole);
  }

  @Get(':id')
  async get(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.bookings.getForUser(id, user.id);
  }

  @Patch(':id/status')
  async status(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { status: BookingStatus },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.bookings.transition(
      id,
      { id: user.id, isProvider: !!user.providerProfile },
      body.status,
    );
  }

  @Patch(':id/location')
  async location(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { lat: number; lng: number },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.bookings.updateProviderLocation(
      id,
      user.id,
      Number(body.lat),
      Number(body.lng),
    );
  }
}
