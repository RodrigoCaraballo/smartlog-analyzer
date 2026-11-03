import { Log } from '../../logs/entities/log.entity';
import { AnalyzeLogsUseCase, AnalysisSelectionRequiredError } from './analyze-logs.use-case';

describe('AnalyzeLogsUseCase', () => {
  const log = Log.create({
    id: 'log-1', service: 'payments', level: 'ERROR', message: 'Connection timeout',
    timestamp: new Date('2026-11-03T10:00:00.000Z'),
    receivedAt: new Date('2026-11-03T10:00:01.000Z'), metadata: {},
  });

  it('executes the complete pipeline and saves the report', async () => {
    const analysisRepository = { save: jest.fn(async (analysis: any) => analysis) };
    const useCase = new AnalyzeLogsUseCase(
      { save: jest.fn(), findMany: jest.fn(), findForAnalysis: jest.fn(async () => [log]) },
      { detect: jest.fn(async () => []) },
      { cluster: jest.fn(async () => []) },
      { summarize: jest.fn() },
      analysisRepository,
      { generate: () => 'analysis-1' },
    );

    const result = await useCase.execute({ logIds: ['log-1'] });

    expect(result).toMatchObject({ id: 'analysis-1', status: 'COMPLETED', logIds: ['log-1'] });
    expect(result.result?.anomalies).toEqual([]);
    expect(analysisRepository.save).toHaveBeenCalledTimes(1);
  });

  it('requires a selection to avoid analyzing the whole database accidentally', async () => {
    const useCase = new AnalyzeLogsUseCase(
      { save: jest.fn(), findMany: jest.fn(), findForAnalysis: jest.fn() },
      { detect: jest.fn() }, { cluster: jest.fn() }, { summarize: jest.fn() },
      { save: jest.fn() }, { generate: () => 'analysis-1' },
    );

    await expect(useCase.execute({})).rejects.toBeInstanceOf(AnalysisSelectionRequiredError);
  });
});
