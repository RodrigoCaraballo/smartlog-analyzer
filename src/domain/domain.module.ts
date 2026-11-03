import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { CreateLogUseCase } from './logs/use-cases/create-log.use-case';
import { ListLogsUseCase } from './logs/use-cases/list-logs.use-case';
import { LOG_REPOSITORY, type LogRepository } from './logs/ports/log.repository';
import { ID_GENERATOR, type IdGenerator } from './shared/ports/id-generator';
import { AnalyzeLogsUseCase } from './analysis/use-cases/analyze-logs.use-case';
import { ANALYSIS_REPOSITORY, type AnalysisRepository } from './analysis/ports/analysis.repository';
import { ANOMALY_DETECTOR, type AnomalyDetector } from './analysis/ports/incident-anomaly-detector';
import { INCIDENT_CLUSTERER, type IncidentClusterer } from './analysis/ports/incident-clusterer';
import { INCIDENT_SUMMARIZER, type IncidentSummarizer } from './analysis/ports/incident-summarizer';
import { ANALYSIS_QUEUE, type AnalysisQueue } from './analysis/ports/analysis.queue';
import { ScheduleLogAnalysisUseCase } from './analysis/use-cases/schedule-log-analysis.use-case';
import { ProcessLogAnalysisUseCase } from './analysis/use-cases/process-log-analysis.use-case';
import { GetAnalysisUseCase } from './analysis/use-cases/get-analysis.use-case';
import { GetAnalysisReportUseCase } from './analysis/use-cases/get-analysis-report.use-case';
import { CheckHealthUseCase } from './health/use-cases/check-health.use-case';
import { HEALTH_CHECKS, type HealthCheckPort } from './health/ports/health-check.port';

@Module({
  imports: [InfrastructureModule],
  providers: [
    {
      provide: CreateLogUseCase,
      useFactory: (repository: LogRepository, idGenerator: IdGenerator) =>
        new CreateLogUseCase(repository, idGenerator),
      inject: [LOG_REPOSITORY, ID_GENERATOR],
    },
    {
      provide: ListLogsUseCase,
      useFactory: (repository: LogRepository) => new ListLogsUseCase(repository),
      inject: [LOG_REPOSITORY],
    },
    {
      provide: AnalyzeLogsUseCase,
      useFactory: (
        logRepository: LogRepository,
        detector: AnomalyDetector,
        clusterer: IncidentClusterer,
        summarizer: IncidentSummarizer,
        analysisRepository: AnalysisRepository,
        idGenerator: IdGenerator,
      ) => new AnalyzeLogsUseCase(
        logRepository,
        detector,
        clusterer,
        summarizer,
        analysisRepository,
        idGenerator,
      ),
      inject: [
        LOG_REPOSITORY,
        ANOMALY_DETECTOR,
        INCIDENT_CLUSTERER,
        INCIDENT_SUMMARIZER,
        ANALYSIS_REPOSITORY,
        ID_GENERATOR,
      ],
    },
    {
      provide: ScheduleLogAnalysisUseCase,
      useFactory: (logs: LogRepository, analyses: AnalysisRepository, queue: AnalysisQueue, ids: IdGenerator) =>
        new ScheduleLogAnalysisUseCase(logs, analyses, queue, ids),
      inject: [LOG_REPOSITORY, ANALYSIS_REPOSITORY, ANALYSIS_QUEUE, ID_GENERATOR],
    },
    {
      provide: ProcessLogAnalysisUseCase,
      useFactory: (
        logs: LogRepository,
        analyses: AnalysisRepository,
        detector: AnomalyDetector,
        clusterer: IncidentClusterer,
        summarizer: IncidentSummarizer,
      ) => new ProcessLogAnalysisUseCase(logs, analyses, detector, clusterer, summarizer),
      inject: [LOG_REPOSITORY, ANALYSIS_REPOSITORY, ANOMALY_DETECTOR, INCIDENT_CLUSTERER, INCIDENT_SUMMARIZER],
    },
    {
      provide: GetAnalysisUseCase,
      useFactory: (repository: AnalysisRepository) => new GetAnalysisUseCase(repository),
      inject: [ANALYSIS_REPOSITORY],
    },
    {
      provide: GetAnalysisReportUseCase,
      useFactory: (repository: AnalysisRepository) => new GetAnalysisReportUseCase(repository),
      inject: [ANALYSIS_REPOSITORY],
    },
    {
      provide: CheckHealthUseCase,
      useFactory: (checks: Array<{ name: string; check: HealthCheckPort }>) => new CheckHealthUseCase(checks),
      inject: [HEALTH_CHECKS],
    },
  ],
  exports: [
    CreateLogUseCase,
    ListLogsUseCase,
    AnalyzeLogsUseCase,
    ScheduleLogAnalysisUseCase,
    ProcessLogAnalysisUseCase,
    GetAnalysisUseCase,
    GetAnalysisReportUseCase,
    CheckHealthUseCase,
  ],
})
export class DomainModule {}
