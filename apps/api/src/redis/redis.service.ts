import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: IORedis;

  constructor(configService: ConfigService) {
    const redisUrl = configService.get<string>('REDIS_URL', 'redis://localhost:6379');

    this.client = new IORedis(redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    this.client.on('error', (error) => {
      this.logger.error(`Redis bağlantı hatası: ${error.message}`);
    });
  }

  get raw(): IORedis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, 'EX', ttlSeconds);
      return;
    }

    await this.client.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
