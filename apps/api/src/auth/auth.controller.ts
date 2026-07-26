import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
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
}
