import type { IdGenerator } from '../../shared/ports/id-generator';
import { Analysis } from '../entities/analysis.entity';
import type { AnalyzeLogsInput } from '../inputs/analyze-logs.input';
import type { ScheduledAnalysisOutput } from '../outputs/scheduled-analysis.output';
import type { AnalysisQueue } from '../ports/analysis.queue';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { LogRepository } from '../../logs/ports/log.repository';

export class ScheduleLogAnalysisUseCase {
  constructor(
    private readonly logs: LogRepository,
    private readonly analyses: AnalysisRepository,
    private readonly queue: AnalysisQueue,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: AnalyzeLogsInput): Promise<ScheduledAnalysisOutput> {
    if (!input.logIds?.length && !this.hasFilters(input)) {
      throw new Error('At least one logId or filter is required');
    }

    const selectedLogs = await this.logs.findForAnalysis(input);
    if (selectedLogs.length === 0) {
      throw new Error('No logs matched the analysis selection');
    }
    if (selectedLogs.length > 100) {
      throw new Error('An analysis cannot contain more than 100 logs');
    }

    const analysis = Analysis.pending({
      id: this.ids.generate(),
      createdAt: new Date(),
      filters: this.serializeFilters(input),
      logIds: selectedLogs.map((log) => log.toPrimitives().id),
    });

    await this.analyses.save(analysis);
    try {
      await this.queue.publish({ analysisId: analysis.toPrimitives().id });
    } catch (error) {
      await this.analyses.fail(analysis.toPrimitives().id, 'QUEUE_PUBLISH_FAILED');
      throw error;
    }

    const value = analysis.toPrimitives();
    return {
      id: value.id,
      status: value.status,
      createdAt: value.createdAt.toISOString(),
      message: 'Analysis scheduled',
    };
  }

  private hasFilters(input: AnalyzeLogsInput): boolean {
    return Boolean(input.filters && Object.values(input.filters).some(Boolean));
  }

  private serializeFilters(input: AnalyzeLogsInput): Record<string, unknown> {
    return {
      ...(input.logIds ? { logIds: input.logIds } : {}),
      ...(input.filters ? {
        filters: {
          ...input.filters,
          from: input.filters.from?.toISOString(),
          to: input.filters.to?.toISOString(),
        },
      } : {}),
    };
  }
}
