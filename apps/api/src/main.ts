import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const redisIoAdapter = new RedisIoAdapter(app, redisUrl);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (corsOrigins.length > 0) {
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
    });
  }

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
  await app.listen(port);
}
bootstrap();
