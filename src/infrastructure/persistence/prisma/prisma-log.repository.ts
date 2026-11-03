import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { Log } from '../../../domain/logs/entities/log.entity';
import type { LogRepository } from '../../../domain/logs/ports/log.repository';

@Injectable()
export class PrismaLogRepository implements LogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(log: Log): Promise<Log> {
    const value = log.toPrimitives();
    const persisted = await this.prisma.log.create({
      data: {
        id: value.id,
        service: value.service,
        level: value.level,
        message: value.message,
        timestamp: value.timestamp,
        receivedAt: value.receivedAt,
        traceId: value.traceId,
        metadata: value.metadata as Prisma.InputJsonValue,
      },
    });

    return Log.create({
      id: persisted.id,
      service: persisted.service,
      level: persisted.level as typeof value.level,
      message: persisted.message,
      timestamp: persisted.timestamp,
      receivedAt: persisted.receivedAt,
      traceId: persisted.traceId ?? undefined,
      metadata: persisted.metadata as Record<string, unknown>,
    });
  }
}
