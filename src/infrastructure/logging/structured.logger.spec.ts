import { StructuredLogger } from './structured.logger';

describe('StructuredLogger', () => {
  it('writes JSON entries with a message, context and metadata', () => {
    const output = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    new StructuredLogger().log('analysis.completed', 'AnalysisWorker', {
      analysisId: 'analysis-1', status: 'COMPLETED', durationMs: 42,
    });

    const entry = JSON.parse(output.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(entry).toMatchObject({
      level: 'info', message: 'analysis.completed', context: 'AnalysisWorker',
      analysisId: 'analysis-1', status: 'COMPLETED', durationMs: 42,
    });
    expect(entry.timestamp).toEqual(expect.any(String));
    output.mockRestore();
  });
});
