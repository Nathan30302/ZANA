import { Body, Controller, Get, Headers, Patch, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('otp/request')
  requestOtp(@Body() body: { phone: string }) {
    return this.auth.requestOtp(body.phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body() body: { phone: string; code: string; name?: string }) {
    return this.auth.verifyOtp(body.phone, body.code, body.name);
  }

  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    const user = await this.auth.userFromToken(authorization);
    return { user };
  }

  @Patch('me')
  async updateMe(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      name?: string;
      homeLat?: number;
      homeLng?: number;
      homeAddress?: string;
    },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    const updated = await this.auth.updateProfile(user.id, body);
    return { user: updated };
  }

  @Patch('me/fcm')
  async fcm(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { fcmToken: string },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.auth.registerFcmToken(user.id, body.fcmToken);
  }
}
