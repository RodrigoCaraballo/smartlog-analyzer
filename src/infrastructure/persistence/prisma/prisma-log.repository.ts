import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { Log, LogLevel } from '../../../domain/logs/entities/log.entity';
import type { ListLogsInput } from '../../../domain/logs/inputs/list-logs.input';
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
      level: persisted.level as LogLevel,
      message: persisted.message,
      timestamp: persisted.timestamp,
      receivedAt: persisted.receivedAt,
      traceId: persisted.traceId ?? undefined,
      metadata: persisted.metadata as Record<string, unknown>,
    });
  }

  async findMany(input: ListLogsInput): Promise<{ items: Log[]; total: number }> {
    const where = {
      ...(input.service ? { service: input.service } : {}),
      ...(input.level ? { level: input.level } : {}),
      ...(input.from || input.to
        ? {
            timestamp: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
    };
    const skip = (input.page - 1) * input.limit;

    const [rows, total] = await Promise.all([
      this.prisma.log.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: input.limit,
      }),
      this.prisma.log.count({ where }),
    ]);

    return { items: rows.map((row) => this.toDomain(row)), total };
  }

  private toDomain(row: {
    id: string;
    service: string;
    level: string;
    message: string;
    timestamp: Date;
    receivedAt: Date;
    traceId: string | null;
    metadata: unknown;
  }): Log {
    return Log.create({
      id: row.id,
      service: row.service,
      level: row.level as LogLevel,
      message: row.message,
      timestamp: row.timestamp,
      receivedAt: row.receivedAt,
      traceId: row.traceId ?? undefined,
      metadata: row.metadata as Record<string, unknown>,
    });
  }
}
