import type { Log } from '../../domain/logs/entities/log.entity';
import type { Anomaly } from '../../domain/analysis/entities/analysis.entity';
import type { AnomalyDetector } from '../../domain/analysis/ports/incident-anomaly-detector';

const CRITICAL_PATTERNS = ['timeout', 'connection refused', 'out of memory', 'deadlock'];
const WINDOW_MS = 5 * 60 * 1000;
const REPEATED_MESSAGE_THRESHOLD = 5;
const ERROR_SPIKE_THRESHOLD = 10;

export class RuleBasedAnomalyDetector implements AnomalyDetector {
  async detect(logs: Log[]): Promise<Anomaly[]> {
    const values = logs.map((log) => log.toPrimitives());
    const anomalies: Anomaly[] = [];

    for (const log of values) {
      const normalizedMessage = log.message.toLowerCase();
      if (log.level === 'ERROR') {
        anomalies.push({
          logIds: [log.id], type: 'error-level', service: log.service,
          severity: 'high', reason: `Error log from ${log.service}`,
          evidence: { message: log.message, level: log.level },
        });
      }

      const pattern = CRITICAL_PATTERNS.find((candidate) => normalizedMessage.includes(candidate));
      if (pattern) {
        anomalies.push({
          logIds: [log.id], type: 'known-pattern', service: log.service,
          severity: 'critical', reason: `Known critical pattern: ${pattern}`,
          evidence: { pattern, message: log.message },
        });
      }
    }

    const groupedMessages = new Map<string, typeof values>();
    for (const log of values) {
      const key = `${log.service}:${log.message.toLowerCase()}`;
      const group = groupedMessages.get(key) ?? [];
      group.push(log);
      groupedMessages.set(key, group);
    }

    for (const group of groupedMessages.values()) {
      const matchingWindow = group.filter((log) => {
        const firstTimestamp = group[0].timestamp.getTime();
        return log.timestamp.getTime() - firstTimestamp <= WINDOW_MS;
      });
      if (matchingWindow.length >= REPEATED_MESSAGE_THRESHOLD) {
        anomalies.push({
          logIds: matchingWindow.map((log) => log.id), type: 'repeated-message',
          service: matchingWindow[0].service, severity: 'medium',
          reason: `The same message was repeated ${matchingWindow.length} times within 5 minutes`,
          evidence: { count: matchingWindow.length, message: matchingWindow[0].message },
        });
      }
    }

    const errorsByService = new Map<string, typeof values>();
    for (const log of values.filter((item) => item.level === 'ERROR')) {
      const group = errorsByService.get(log.service) ?? [];
      group.push(log);
      errorsByService.set(log.service, group);
    }
    for (const group of errorsByService.values()) {
      const matchingWindow = group.filter((log) => {
        const firstTimestamp = group[0].timestamp.getTime();
        return log.timestamp.getTime() - firstTimestamp <= WINDOW_MS;
      });
      if (matchingWindow.length >= ERROR_SPIKE_THRESHOLD) {
        anomalies.push({
          logIds: matchingWindow.map((log) => log.id), type: 'error-spike',
          service: matchingWindow[0].service, severity: 'high',
          reason: `${matchingWindow.length} errors detected within 5 minutes`,
          evidence: { count: matchingWindow.length, windowMinutes: 5 },
        });
      }
    }

    return anomalies;
  }
}
