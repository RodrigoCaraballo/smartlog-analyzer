import { Injectable } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service';
import type { HealthCheckPort } from '../../domain/health/ports/health-check.port';

@Injectable()
export class PrismaHealthCheck implements HealthCheckPort {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
