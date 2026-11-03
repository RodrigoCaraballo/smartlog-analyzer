import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { ANALYSIS_QUEUE_NAME } from './analysis.queue';
import { ProcessLogAnalysisUseCase } from '../../domain/analysis/use-cases/process-log-analysis.use-case';
import { StructuredLogger } from '../logging/structured.logger';

@Processor(ANALYSIS_QUEUE_NAME)
export class AnalysisWorker extends WorkerHost {
  private readonly logger = new StructuredLogger();

  constructor(private readonly processAnalysis: ProcessLogAnalysisUseCase) {
    super();
  }

  async process(job: Job<{ analysisId: string }>): Promise<void> {
    const startedAt = Date.now();
    this.logger.log('analysis.job.started', {
      jobId: job.id,
      analysisId: job.data.analysisId,
      attempt: job.attemptsMade + 1,
    });
    try {
      await this.processAnalysis.execute(job.data.analysisId);
      this.logger.log('analysis.job.completed', {
        jobId: job.id,
        analysisId: job.data.analysisId,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      this.logger.error('analysis.job.failed', {
        jobId: job.id,
        analysisId: job.data.analysisId,
        attempt: job.attemptsMade + 1,
        durationMs: Date.now() - startedAt,
        errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
      });
      throw error;
    }
  }
}
