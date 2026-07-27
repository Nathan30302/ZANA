import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { FloatsModule } from './floats/floats.module';
import { HealthModule } from './health/health.module';
import { MetaModule } from './meta/meta.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    MetaModule,
    AuthModule,
    ProvidersModule,
    BookingsModule,
    FloatsModule,
    ReviewsModule,
    AdminModule,
  ],
})
export class AppModule {}

