import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('v1');
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  const origins = (process.env.CORS_ORIGINS || 'http://localhost:3001')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  // Reflect request origin when '*' so credentialed browser clients work from tunnels.
  app.enableCors({
    origin: origins.includes('*') ? true : origins,
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(
    `ZANA API listening on http://0.0.0.0:${port}/v1 (PUBLIC_BASE_URL=${process.env.PUBLIC_BASE_URL || 'unset'})`,
  );
}
bootstrap();
