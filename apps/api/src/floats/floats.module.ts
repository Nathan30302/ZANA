import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FloatsController } from './floats.controller';
import { FloatsService } from './floats.service';

@Module({
  imports: [AuthModule],
  controllers: [FloatsController],
  providers: [FloatsService],
})
export class FloatsModule {}
