import type { Anomaly, Incident, Severity } from '../../domain/analysis/entities/analysis.entity';
import type { IncidentClusterer } from '../../domain/analysis/ports/incident-clusterer';

const SEVERITY_RANK: Record<Severity, number> = { low: 1, medium: 2, high: 3, critical: 4 };

export class TimeServiceIncidentClusterer implements IncidentClusterer {
  async cluster(anomalies: Anomaly[]): Promise<Incident[]> {
    const grouped = new Map<string, Anomaly[]>();
    for (const anomaly of anomalies) {
      const key = `${anomaly.service}:${anomaly.type}`;
      const current = grouped.get(key) ?? [];
      current.push(anomaly);
      grouped.set(key, current);
    }

    return [...grouped.values()].map((group, index) => ({
      id: `incident-${index + 1}`,
      service: group[0].service,
      anomalyType: group[0].type,
      logIds: [...new Set(group.flatMap((item) => item.logIds))],
      severity: group.reduce<Severity>((highest, item) =>
        SEVERITY_RANK[item.severity] > SEVERITY_RANK[highest] ? item.severity : highest, 'low'),
      anomalies: group,
    }));
  }
}
