import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { Log, LogLevel } from '../../../domain/logs/entities/log.entity';
import type { ListLogsInput } from '../../../domain/logs/inputs/list-logs.input';
import type { AnalyzeLogsFilters } from '../../../domain/analysis/inputs/analyze-logs.input';
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
    const where = this.buildWhere(input);
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

  async findForAnalysis(selection: { logIds?: string[]; filters?: AnalyzeLogsFilters }): Promise<Log[]> {
    const where = this.buildAnalysisWhere(selection);
    const rows = await this.prisma.log.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: 101,
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findByIds(ids: string[]): Promise<Log[]> {
    const rows = await this.prisma.log.findMany({
      where: { id: { in: ids } },
      orderBy: { timestamp: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private buildWhere(input: ListLogsInput): Prisma.LogWhereInput {
    const where: Prisma.LogWhereInput = {};

    if (input.service) {
      where.service = input.service;
    }

    if (input.level) {
      where.level = input.level;
    }

    if (input.from || input.to) {
      where.timestamp = {};

      if (input.from) {
        where.timestamp.gte = input.from;
      }

      if (input.to) {
        where.timestamp.lte = input.to;
      }
    }

    return where;
  }

  private buildAnalysisWhere(selection: {
    logIds?: string[];
    filters?: AnalyzeLogsFilters;
  }): Prisma.LogWhereInput {
    const where: Prisma.LogWhereInput = {};
    const filters = selection.filters;

    if (selection.logIds?.length) {
      where.id = { in: selection.logIds };
    }

    if (filters?.service) {
      where.service = filters.service;
    }

    if (filters?.level) {
      where.level = filters.level;
    }

    if (filters?.from || filters?.to) {
      where.timestamp = {};

      if (filters.from) {
        where.timestamp.gte = filters.from;
      }

      if (filters.to) {
        where.timestamp.lte = filters.to;
      }
    }

    return where;
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
