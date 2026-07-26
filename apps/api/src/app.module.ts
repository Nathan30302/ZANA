import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { FloatsModule } from './floats/floats.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    ProvidersModule,
    BookingsModule,
    FloatsModule,
    AdminModule,
  ],
})
export class AppModule {}
