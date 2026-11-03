import type { Log } from '../../logs/entities/log.entity';
import type { Anomaly } from '../entities/analysis.entity';

export const ANOMALY_DETECTOR = Symbol('ANOMALY_DETECTOR');

export interface AnomalyDetector {
  detect(logs: Log[]): Promise<Anomaly[]>;
}
