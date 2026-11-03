import { Log } from '../../logs/entities/log.entity';
import { ScheduleLogAnalysisUseCase } from './schedule-log-analysis.use-case';

describe('ScheduleLogAnalysisUseCase', () => {
  const log = Log.create({
    id: 'log-1', service: 'payments', level: 'ERROR', message: 'timeout',
    timestamp: new Date('2026-11-03T10:00:00.000Z'),
    receivedAt: new Date('2026-11-03T10:00:01.000Z'), metadata: {},
  });

  it('persists PENDING and publishes only the analysis id', async () => {
    const analyses = { save: jest.fn(async (analysis: any) => analysis), fail: jest.fn() };
    const queue = { publish: jest.fn(async (input: { analysisId: string }) => ({ jobId: input.analysisId })) };
    const useCase = new ScheduleLogAnalysisUseCase(
      { findForAnalysis: jest.fn(async () => [log]) } as any,
      analyses as any,
      queue,
      { generate: () => 'analysis-1' },
    );

    await expect(useCase.execute({ logIds: ['log-1'] })).resolves.toMatchObject({
      id: 'analysis-1', status: 'PENDING', message: 'Analysis scheduled',
    });
    expect(analyses.save.mock.calls[0][0].toPrimitives()).toMatchObject({ status: 'PENDING', logIds: ['log-1'] });
    expect(queue.publish).toHaveBeenCalledWith({ analysisId: 'analysis-1' });
  });

  it('marks the analysis failed when publishing the job fails', async () => {
    const analyses = { save: jest.fn(), fail: jest.fn() };
    const failure = new Error('redis unavailable');
    const useCase = new ScheduleLogAnalysisUseCase(
      { findForAnalysis: jest.fn(async () => [log]) } as any,
      analyses as any,
      { publish: jest.fn().mockRejectedValue(failure) },
      { generate: () => 'analysis-1' },
    );

    await expect(useCase.execute({ logIds: ['log-1'] })).rejects.toThrow('redis unavailable');
    expect(analyses.fail).toHaveBeenCalledWith('analysis-1', 'QUEUE_PUBLISH_FAILED');
  });
});
