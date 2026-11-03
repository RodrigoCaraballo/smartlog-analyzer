import type { Incident, IncidentSummary } from '../entities/analysis.entity';

export const INCIDENT_SUMMARIZER = Symbol('INCIDENT_SUMMARIZER');

export interface IncidentSummarizer {
  summarize(incident: Incident): Promise<IncidentSummary>;
}
