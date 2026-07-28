import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PaymentMethod } from '../payments/payment.provider';
import { FloatsService } from './floats.service';

@Controller('floats')
export class FloatsController {
  constructor(
    private readonly floats: FloatsService,
    private readonly auth: AuthService,
  ) {}

  @Get('packages')
  packages() {
    return this.floats.listPackages();
  }

  @Get('balance')
  async balance(@Headers('authorization') authorization?: string) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.floats.balance(user.id);
  }

  @Get('purchases')
  async purchases(@Headers('authorization') authorization?: string) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.floats.listPurchases(user.id);
  }

  @Post('purchase')
  async purchase(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      packageId: string;
      method?: PaymentMethod;
      phone?: string;
      simulate?: boolean;
    },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.floats.purchase(user.id, body.packageId, {
      method: body.method,
      phone: body.phone,
      simulate: body.simulate,
    });
  }

  /** MoMo/Airtel callback / poll confirm.
   * Protect with PAYMENT_WEBHOOK_SECRET header `x-zana-webhook-secret` when set.
   */
  @Post('webhook/confirm')
  confirm(
    @Body() body: { purchaseId: string },
    @Headers('x-zana-webhook-secret') secret?: string,
  ) {
    const expected = process.env.PAYMENT_WEBHOOK_SECRET;
    if (expected && secret !== expected) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    if (!body?.purchaseId) {
      throw new BadRequestException('purchaseId required');
    }
    return this.floats.confirmPurchase(body.purchaseId);
  }
}
