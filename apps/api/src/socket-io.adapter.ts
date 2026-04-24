import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, type RedisClientType } from 'redis';
import type { ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private pubClient: RedisClientType | null = null;
  private subClient: RedisClientType | null = null;

  constructor(
    app: INestApplicationContext,
    private readonly redisUrl: string,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    this.pubClient = createClient({ url: this.redisUrl });
    this.subClient = this.pubClient.duplicate();

    await Promise.all([this.pubClient.connect(), this.subClient.connect()]);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);

    if (this.pubClient && this.subClient) {
      server.adapter(createAdapter(this.pubClient, this.subClient));
    }

    return server;
  }

  async closeRedisConnections(): Promise<void> {
    await Promise.all([
      this.pubClient?.quit(),
      this.subClient?.quit(),
    ]);
  }
}
