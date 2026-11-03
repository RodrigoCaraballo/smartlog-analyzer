import type { IdGenerator } from '../../shared/ports/id-generator';
import { Analysis } from '../entities/analysis.entity';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { AnomalyDetector } from '../ports/incident-anomaly-detector';
import type { IncidentClusterer } from '../ports/incident-clusterer';
import type { IncidentSummarizer } from '../ports/incident-summarizer';
import type { AnalyzeLogsInput } from '../inputs/analyze-logs.input';
import type { AnalysisOutput } from '../outputs/analysis.output';
import type { LogRepository } from '../../logs/ports/log.repository';

export class NoLogsSelectedError extends Error {
  constructor() {
    super('No logs matched the analysis selection');
    this.name = 'NoLogsSelectedError';
  }
}

export class AnalysisSelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisSelectionError';
  }
}

export class AnalysisSelectionRequiredError extends AnalysisSelectionError {
  constructor() {
    super('At least one logId or filter is required');
    this.name = 'AnalysisSelectionRequiredError';
  }
}

export class AnalyzeLogsUseCase {
  constructor(
    private readonly logRepository: LogRepository,
    private readonly detector: AnomalyDetector,
    private readonly clusterer: IncidentClusterer,
    private readonly summarizer: IncidentSummarizer,
    private readonly analysisRepository: AnalysisRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: AnalyzeLogsInput): Promise<AnalysisOutput> {
    const hasLogIds = Boolean(input.logIds?.length);
    const hasFilters = Boolean(input.filters && Object.values(input.filters).some(Boolean));
    if (!hasLogIds && !hasFilters) {
      throw new AnalysisSelectionRequiredError();
    }

    const logs = await this.logRepository.findForAnalysis(input);

    if (logs.length === 0) {
      throw new NoLogsSelectedError();
    }

    if (logs.length > 100) {
      throw new AnalysisSelectionError('An analysis cannot contain more than 100 logs');
    }

    const anomalies = await this.detector.detect(logs);
    const incidents = await this.clusterer.cluster(anomalies);
    const reports = [];

    for (const incident of incidents) {
      reports.push({
        incident,
        summary: await this.summarizer.summarize(incident),
      });
    }

    const result = {
      anomalies,
      incidents: reports,
      recommendations: reports.flatMap((report) => report.summary.recommendations),
    };
    const summary = reports.length === 0
      ? 'No anomalies were detected in the selected logs.'
      : `${reports.length} incident(s) detected in ${logs.length} log(s).`;

    const analysis = Analysis.completed({
      id: this.idGenerator.generate(),
      createdAt: new Date(),
      filters: this.serializeFilters(input),
      model: 'fake-rule-based-summarizer',
      summary,
      result,
      logIds: logs.map((log) => log.toPrimitives().id),
    });

    const saved = await this.analysisRepository.save(analysis);
    return this.toOutput(saved);
  }

  private serializeFilters(input: AnalyzeLogsInput): Record<string, unknown> {
    return {
      ...(input.logIds ? { logIds: input.logIds } : {}),
      ...(input.filters
        ? {
            filters: {
              ...input.filters,
              from: input.filters.from?.toISOString(),
              to: input.filters.to?.toISOString(),
            },
          }
        : {}),
    };
  }

  private toOutput(analysis: Analysis): AnalysisOutput {
    const value = analysis.toPrimitives();
    return {
      id: value.id,
      status: value.status,
      createdAt: value.createdAt.toISOString(),
      completedAt: value.completedAt?.toISOString(),
      filters: value.filters,
      model: value.model,
      summary: value.summary,
      result: value.result,
      errorCode: value.errorCode,
      logIds: value.logIds,
    };
  }
}
