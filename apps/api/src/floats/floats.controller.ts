import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
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

  @Post('purchase')
  async purchase(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { packageId: string },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.floats.purchase(user.id, body.packageId);
  }
}
