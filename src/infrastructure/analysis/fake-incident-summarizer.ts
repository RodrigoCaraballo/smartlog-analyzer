import type { IncidentSummary } from '../../domain/analysis/entities/analysis.entity';
import type { IncidentSummarizer } from '../../domain/analysis/ports/incident-summarizer';
import type { Incident } from '../../domain/analysis/entities/analysis.entity';

export class FakeIncidentSummarizer implements IncidentSummarizer {
  async summarize(incident: Incident): Promise<IncidentSummary> {
    return {
      category: incident.anomalyType,
      summary: `${incident.severity} incident detected in ${incident.service} (${incident.logIds.length} related log(s)).`,
      recommendations: [`Review the ${incident.anomalyType} pattern in ${incident.service}.`],
    };
  }
}
