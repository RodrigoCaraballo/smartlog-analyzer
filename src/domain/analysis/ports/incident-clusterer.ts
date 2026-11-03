import type { Anomaly, Incident } from '../entities/analysis.entity';

export const INCIDENT_CLUSTERER = Symbol('INCIDENT_CLUSTERER');

export interface IncidentClusterer {
  cluster(anomalies: Anomaly[]): Promise<Incident[]>;
}
