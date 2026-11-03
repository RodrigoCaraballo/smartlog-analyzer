import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Analysis, AnalysisStatus, type AnalysisResult } from '../../../domain/analysis/entities/analysis.entity';
import type { AnalysisRepository } from '../../../domain/analysis/ports/analysis.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaAnalysisRepository implements AnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(analysis: Analysis): Promise<Analysis> {
    const value = analysis.toPrimitives();
    const persisted = await this.prisma.$transaction(async (transaction) => {
      const saved = await transaction.analysis.create({
        data: {
          id: value.id,
          status: value.status,
          createdAt: value.createdAt,
          completedAt: value.completedAt,
          filters: value.filters as Prisma.InputJsonValue,
          model: value.model,
          summary: value.summary,
          ...(value.result ? { result: value.result as unknown as Prisma.InputJsonValue } : {}),
          errorCode: value.errorCode,
        },
      });

      if (value.logIds.length > 0) {
        await transaction.analysisLog.createMany({
          data: value.logIds.map((logId) => ({ analysisId: value.id, logId })),
        });
      }

      return saved;
    });

    return Analysis.rehydrate({
      ...value,
      id: persisted.id,
      createdAt: persisted.createdAt,
      status: persisted.status as AnalysisStatus,
      filters: persisted.filters as Record<string, unknown>,
      completedAt: persisted.completedAt ?? undefined,
      model: persisted.model ?? undefined,
      summary: persisted.summary ?? undefined,
      result: persisted.result as unknown as AnalysisResult | undefined,
      logIds: value.logIds,
    });
  }

  async findById(id: string): Promise<Analysis | null> {
    const row = await this.prisma.analysis.findUnique({
      where: { id },
      include: { logs: { select: { logId: true } } },
    });
    return row ? this.toDomain(row) : null;
  }

  async markRunning(id: string): Promise<void> {
    await this.prisma.analysis.update({
      where: { id },
      data: { status: AnalysisStatus.RUNNING },
    });
  }

  async complete(id: string, result: AnalysisResult, summary: string, model: string): Promise<Analysis> {
    const row = await this.prisma.analysis.update({
      where: { id },
      data: {
        status: AnalysisStatus.COMPLETED,
        completedAt: new Date(),
        result: result as unknown as Prisma.InputJsonValue,
        summary,
        model,
        errorCode: null,
      },
      include: { logs: { select: { logId: true } } },
    });
    return this.toDomain(row);
  }

  async fail(id: string, errorCode: string): Promise<Analysis> {
    const row = await this.prisma.analysis.update({
      where: { id },
      data: { status: AnalysisStatus.FAILED, completedAt: new Date(), errorCode },
      include: { logs: { select: { logId: true } } },
    });
    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string; status: string; createdAt: Date; completedAt: Date | null;
    filters: unknown; model: string | null; summary: string | null;
    result: unknown; errorCode: string | null; logs: Array<{ logId: string }>;
  }): Analysis {
    const common = {
      id: row.id,
      createdAt: row.createdAt,
      filters: row.filters as Record<string, unknown>,
      model: row.model ?? undefined,
      summary: row.summary ?? undefined,
      result: row.result as AnalysisResult | undefined,
      errorCode: row.errorCode ?? undefined,
      logIds: row.logs.map((item) => item.logId),
    };
    return Analysis.rehydrate({
      ...common,
      status: row.status as AnalysisStatus,
      completedAt: row.completedAt ?? undefined,
    });
  }
}
