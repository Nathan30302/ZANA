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
import {
  BookingStatus,
  ProviderApplicationStatus,
  ProviderType,
  UserRole,
} from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { AdminService } from './admin.service';

@Controller()
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly auth: AuthService,
  ) {}

  @Post('applications')
  async apply(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      type: ProviderType;
      displayName: string;
      area: string;
      notes?: string;
      documentUrls?: string[];
    },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.admin.submitApplication(user.id, body);
  }

  @Get('admin/stats')
  async stats(@Headers('authorization') authorization?: string) {
    await this.requireAdmin(authorization);
    return this.admin.stats();
  }

  @Get('admin/applications')
  async listApps(
    @Headers('authorization') authorization: string | undefined,
    @Query('status') status?: ProviderApplicationStatus,
  ) {
    await this.requireAdmin(authorization);
    return this.admin.listApplications(status);
  }

  @Patch('admin/applications/:id')
  async review(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { status: ProviderApplicationStatus; adminNote?: string },
  ) {
    await this.requireAdmin(authorization);
    return this.admin.review(id, body.status, body.adminNote);
  }

  @Get('admin/bookings')
  async bookings(
    @Headers('authorization') authorization: string | undefined,
    @Query('status') status?: BookingStatus,
  ) {
    await this.requireAdmin(authorization);
    return this.admin.listBookings(status);
  }

  @Get('admin/float-packages')
  async floatPackages(@Headers('authorization') authorization?: string) {
    await this.requireAdmin(authorization);
    return this.admin.listFloatPackages();
  }

  @Post('admin/float-packages')
  async createFloatPackage(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      code: string;
      name: string;
      credits: number;
      priceZmw: number;
      isActive?: boolean;
    },
  ) {
    await this.requireAdmin(authorization);
    return this.admin.createFloatPackage(body);
  }

  @Patch('admin/float-packages/:id')
  async updateFloatPackage(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      credits: number;
      priceZmw: number;
      isActive: boolean;
    }>,
  ) {
    await this.requireAdmin(authorization);
    return this.admin.updateFloatPackage(id, body);
  }

  private async requireAdmin(authorization?: string) {
    const user = await this.auth.userFromToken(authorization);
    if (!user || user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Admin only');
    }
    return user;
  }
}
