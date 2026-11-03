import { TimeServiceIncidentClusterer } from './time-service-incident-clusterer';
import type { Anomaly } from '../../domain/analysis/entities/analysis.entity';

const anomaly = (type: Anomaly['type'], severity: Anomaly['severity'], logId: string): Anomaly => ({
  type, severity, logIds: [logId], service: 'payments', reason: 'test', evidence: {},
});

describe('TimeServiceIncidentClusterer', () => {
  it('groups anomalies by service and type and keeps the highest severity', async () => {
    const incidents = await new TimeServiceIncidentClusterer().cluster([
      anomaly('error-level', 'high', '1'),
      anomaly('error-level', 'critical', '2'),
      anomaly('known-pattern', 'critical', '3'),
    ]);

    expect(incidents).toHaveLength(2);
    expect(incidents[0]).toMatchObject({ severity: 'critical', logIds: ['1', '2'] });
  });
});
