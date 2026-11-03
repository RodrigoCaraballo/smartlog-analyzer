import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import type { AnalysisQueue } from '../../domain/analysis/ports/analysis.queue';

export const ANALYSIS_QUEUE_NAME = process.env.ANALYSIS_QUEUE_NAME ?? 'log-analysis';

@Injectable()
export class BullMqAnalysisQueue implements AnalysisQueue {
  constructor(@InjectQueue(ANALYSIS_QUEUE_NAME) private readonly queue: Queue) {}

  async publish(input: { analysisId: string }): Promise<{ jobId: string }> {
    const job = await this.queue.add('process-analysis', input, {
      jobId: input.analysisId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 1000,
    });
    return { jobId: job.id ?? input.analysisId };
  }
}
