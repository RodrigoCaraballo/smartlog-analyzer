import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { ANALYSIS_QUEUE_NAME } from './analysis.queue';
import { ProcessLogAnalysisUseCase } from '../../domain/analysis/use-cases/process-log-analysis.use-case';

@Processor(ANALYSIS_QUEUE_NAME)
export class AnalysisWorker extends WorkerHost {
  constructor(private readonly processAnalysis: ProcessLogAnalysisUseCase) {
    super();
  }

  async process(job: Job<{ analysisId: string }>): Promise<void> {
    await this.processAnalysis.execute(job.data.analysisId);
  }
}
