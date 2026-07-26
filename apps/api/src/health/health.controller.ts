import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      ok: true,
      service: 'zana-api',
      time: new Date().toISOString(),
    };
  }
}
