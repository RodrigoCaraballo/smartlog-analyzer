import type { LogRepository } from '../../logs/ports/log.repository';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { AnomalyDetector } from '../ports/incident-anomaly-detector';
import type { IncidentClusterer } from '../ports/incident-clusterer';
import type { IncidentSummarizer } from '../ports/incident-summarizer';

export class ProcessLogAnalysisUseCase {
  constructor(
    private readonly logs: LogRepository,
    private readonly analyses: AnalysisRepository,
    private readonly detector: AnomalyDetector,
    private readonly clusterer: IncidentClusterer,
    private readonly summarizer: IncidentSummarizer,
  ) {}

  async execute(analysisId: string): Promise<void> {
    const analysis = await this.analyses.findById(analysisId);
    if (!analysis) throw new Error('Analysis not found');

    await this.analyses.markRunning(analysisId);
    try {
      const logIds = analysis.toPrimitives().logIds;
      const logs = await this.logs.findByIds(logIds);
      const anomalies = await this.detector.detect(logs);
      const incidents = await this.clusterer.cluster(anomalies);
      const reports = [];

      for (const incident of incidents) {
        reports.push({ incident, summary: await this.summarizer.summarize(incident) });
      }

      const result = {
        anomalies,
        incidents: reports,
        recommendations: reports.flatMap((report) => report.summary.recommendations),
      };
      const summary = reports.length === 0
        ? 'No anomalies were detected in the selected logs.'
        : `${reports.length} incident(s) detected in ${logs.length} log(s).`;

      await this.analyses.complete(analysisId, result, summary, 'fake-rule-based-summarizer');
    } catch (error) {
      await this.analyses.fail(analysisId, this.toErrorCode(error));
      throw error;
    }
  }

  private toErrorCode(error: unknown): string {
    if (error instanceof Error && error.name.startsWith('Llm')) return error.name.toUpperCase();
    return 'ANALYSIS_PROCESSING_FAILED';
  }
}
