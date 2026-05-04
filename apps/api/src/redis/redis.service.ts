import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';

type MemoryEntry = {
  value: string;
  expiresAt: number | null;
};

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: IORedis | null;
  private readonly memoryStore = new Map<string, MemoryEntry>();

  constructor(configService: ConfigService) {
    const redisUrl = configService.get<string>('REDIS_URL')?.trim();

    if (!redisUrl) {
      this.client = null;
      this.logger.warn(
        'REDIS_URL tanımlı değil. RedisService in-memory fallback ile çalışacak.',
      );
      return;
    }

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
    if (!this.client) {
      throw new Error('Redis istemcisi REDIS_URL olmadığı için etkin değil.');
    }

    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) {
      const entry = this.memoryStore.get(key);
      if (!entry) {
        return null;
      }

      if (this.isExpired(entry)) {
        this.memoryStore.delete(key);
        return null;
      }

      return entry.value;
    }

    return this.client.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<void> {
    if (!this.client) {
      this.memoryStore.set(key, {
        value,
        expiresAt:
          ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
      });
      return;
    }

    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, 'EX', ttlSeconds);
      return;
    }

    await this.client.set(key, value);
  }

  async del(key: string): Promise<void> {
    if (!this.client) {
      this.memoryStore.delete(key);
      return;
    }

    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    if (!this.client) {
      const currentValue = await this.get(key);
      const nextValue = Number.parseInt(currentValue ?? '0', 10) + 1;
      const currentEntry = this.memoryStore.get(key);
      this.memoryStore.set(key, {
        value: String(nextValue),
        expiresAt: currentEntry?.expiresAt ?? null,
      });
      return nextValue;
    }

    return this.client.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.client) {
      const entry = this.memoryStore.get(key);
      if (entry) {
        entry.expiresAt = Date.now() + ttlSeconds * 1000;
      }
      return;
    }

    await this.client.expire(key, ttlSeconds);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }

  private isExpired(entry: MemoryEntry): boolean {
    return entry.expiresAt !== null && entry.expiresAt <= Date.now();
  }
}
