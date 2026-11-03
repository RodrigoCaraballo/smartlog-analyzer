import { Analysis, AnalysisStatus } from '../entities/analysis.entity';
import { Log } from '../../logs/entities/log.entity';
import { ProcessLogAnalysisUseCase } from './process-log-analysis.use-case';

describe('ProcessLogAnalysisUseCase', () => {
  const log = Log.create({
    id: 'log-1', service: 'payments', level: 'ERROR', message: 'timeout',
    timestamp: new Date('2026-11-03T10:00:00.000Z'),
    receivedAt: new Date('2026-11-03T10:00:01.000Z'), metadata: {},
  });
  const analysis = Analysis.rehydrate({
    id: 'analysis-1', status: AnalysisStatus.PENDING, createdAt: new Date(),
    filters: {}, logIds: ['log-1'],
  });

  it('marks RUNNING and COMPLETED after processing the snapshot', async () => {
    const analyses = {
      findById: jest.fn(async () => analysis), markRunning: jest.fn(),
      complete: jest.fn(), fail: jest.fn(),
    };
    const useCase = new ProcessLogAnalysisUseCase(
      { findByIds: jest.fn(async () => [log]) } as any,
      analyses as any,
      { detect: jest.fn(async () => []) },
      { cluster: jest.fn(async () => []) },
      { summarize: jest.fn() },
    );

    await useCase.execute('analysis-1');

    expect(analyses.markRunning).toHaveBeenCalledWith('analysis-1');
    expect(analyses.complete).toHaveBeenCalledWith(
      'analysis-1', { anomalies: [], incidents: [], recommendations: [] },
      expect.any(String), 'fake-rule-based-summarizer',
    );
    expect(analyses.fail).not.toHaveBeenCalled();
  });

  it('persists FAILED when the pipeline raises an error', async () => {
    const analyses = {
      findById: jest.fn(async () => analysis), markRunning: jest.fn(),
      complete: jest.fn(), fail: jest.fn(),
    };
    const useCase = new ProcessLogAnalysisUseCase(
      { findByIds: jest.fn(async () => [log]) } as any,
      analyses as any,
      { detect: jest.fn().mockRejectedValue(new Error('detector failed')) },
      { cluster: jest.fn() }, { summarize: jest.fn() },
    );

    await expect(useCase.execute('analysis-1')).rejects.toThrow('detector failed');
    expect(analyses.fail).toHaveBeenCalledWith('analysis-1', 'ANALYSIS_PROCESSING_FAILED');
  });
});
