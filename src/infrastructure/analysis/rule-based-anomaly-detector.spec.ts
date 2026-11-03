import { Log } from '../../domain/logs/entities/log.entity';
import { RuleBasedAnomalyDetector } from './rule-based-anomaly-detector';

const createLog = (id: string, message: string, timestamp: string, level: 'ERROR' | 'INFO' = 'ERROR') =>
  Log.create({
    id, service: 'payments', level, message,
    timestamp: new Date(timestamp), receivedAt: new Date(timestamp), metadata: {},
  });

describe('RuleBasedAnomalyDetector', () => {
  it('detects explicit errors and known critical patterns', async () => {
    const result = await new RuleBasedAnomalyDetector().detect([
      createLog('1', 'Connection timeout', '2026-11-03T10:00:00.000Z'),
    ]);

    expect(result.map((item) => item.type)).toEqual(['error-level', 'known-pattern']);
    expect(result[1].severity).toBe('critical');
  });

  it('detects repeated messages at the configured threshold', async () => {
    const logs = Array.from({ length: 5 }, (_, index) => createLog(
      String(index), 'Retrying provider', `2026-11-03T10:0${index}:00.000Z`, 'INFO',
    ));

    const result = await new RuleBasedAnomalyDetector().detect(logs);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('repeated-message');
  });

  it('does not classify informational logs as errors', async () => {
    const result = await new RuleBasedAnomalyDetector().detect([
      createLog('1', 'Cache refreshed', '2026-11-03T10:00:00.000Z', 'INFO'),
    ]);

    expect(result).toEqual([]);
  });
});
