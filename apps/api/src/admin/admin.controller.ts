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

  @Get('applications/me')
  async myApplication(
    @Headers('authorization') authorization: string | undefined,
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.admin.getMyApplication(user.id);
  }

  @Patch('applications/me')
  async resubmit(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      type?: ProviderType;
      displayName?: string;
      area?: string;
      notes?: string;
      documentUrls?: string[];
    },
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    return this.admin.resubmitApplication(user.id, body);
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
    @Query('q') q?: string,
  ) {
    await this.requireAdmin(authorization);
    return this.admin.listApplications(status, q);
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
    @Query('q') q?: string,
  ) {
    await this.requireAdmin(authorization);
    return this.admin.listBookings(status, q);
  }

  @Patch('admin/bookings/:id/dispute')
  async dispute(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { disputeNote: string },
  ) {
    await this.requireAdmin(authorization);
    return this.admin.setDisputeNote(id, body.disputeNote ?? '');
  }

  @Patch('admin/bookings/:id/status')
  async forceStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body()
    body: { status: BookingStatus; refundCredit?: boolean; note?: string },
  ) {
    await this.requireAdmin(authorization);
    return this.admin.forceBookingStatus(id, body.status, {
      refundCredit: body.refundCredit,
      note: body.note,
    });
  }

  @Patch('admin/providers/:id/credits')
  async adjustCredits(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { delta: number; note?: string },
  ) {
    await this.requireAdmin(authorization);
    return this.admin.adjustProviderCredits(id, Number(body.delta), body.note);
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
