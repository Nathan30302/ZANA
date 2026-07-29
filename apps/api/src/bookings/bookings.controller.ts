import {
  BadRequestException,
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
import { BookingStatus, ServiceCategory, ServiceMode } from '@prisma/client';
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
      providerId?: string;
      serviceId?: string;
      broadcast?: boolean;
      category?: string;
      mode?: string;
      broadcastRadiusKm?: number;
      scheduledAt?: string;
      customerLat?: number;
      customerLng?: number;
      customerAddress?: string;
      notes?: string;
    },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    if (body.broadcast) {
      if (!body.category) {
        throw new BadRequestException('category required for broadcast');
      }
      if (body.customerLat == null || body.customerLng == null) {
        throw new BadRequestException('customerLat/customerLng required');
      }
      return this.bookings.createBroadcast(user.id, {
        category: body.category as ServiceCategory,
        mode: body.mode as ServiceMode | undefined,
        customerLat: body.customerLat,
        customerLng: body.customerLng,
        customerAddress: body.customerAddress,
        broadcastRadiusKm: body.broadcastRadiusKm,
        notes: body.notes,
      });
    }
    if (!body.providerId || !body.serviceId) {
      throw new BadRequestException('providerId and serviceId required');
    }
    return this.bookings.create(user.id, {
      providerId: body.providerId,
      serviceId: body.serviceId,
      scheduledAt: body.scheduledAt,
      customerLat: body.customerLat,
      customerLng: body.customerLng,
      customerAddress: body.customerAddress,
      notes: body.notes,
    });
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

  @Get('schedule')
  async schedule(
    @Headers('authorization') authorization: string | undefined,
    @Query('date') date?: string,
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.bookings.scheduleForProvider(user.id, date);
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
    @Body()
    body: {
      status: BookingStatus;
      declineReason?: string;
      cancelReason?: string;
    },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.bookings.transition(
      id,
      { id: user.id, isProvider: !!user.providerProfile },
      body.status,
      {
        declineReason: body.declineReason,
        cancelReason: body.cancelReason,
      },
    );
  }

  @Patch(':id/assign')
  async assign(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { staffUserId?: string | null },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.bookings.assignStaff(
      id,
      user.id,
      body.staffUserId ?? null,
    );
  }

  @Patch(':id/dispute')
  async dispute(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { note: string },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.bookings.reportDispute(id, user.id, body.note);
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
