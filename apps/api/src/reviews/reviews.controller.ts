import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(
    private readonly reviews: ReviewsService,
    private readonly auth: AuthService,
  ) {}

  @Post('bookings/:id/review')
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') bookingId: string,
    @Body() body: { rating: number; comment?: string; photoUrl?: string },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.reviews.create(user.id, bookingId, body);
  }

  @Get('providers/:id/reviews')
  list(@Param('id') providerId: string) {
    return this.reviews.listForProvider(providerId);
  }
}
