import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import type { HealthCheckPort } from '../../domain/health/ports/health-check.port';

@Injectable()
export class RedisHealthCheck implements HealthCheckPort {
  async check(): Promise<void> {
    const client = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
    });
    try {
      await client.connect();
      await client.ping();
    } finally {
      await client.quit().catch(() => client.disconnect());
    }
  }
}
