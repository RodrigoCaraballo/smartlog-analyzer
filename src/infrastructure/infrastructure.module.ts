import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LOG_REPOSITORY } from '../domain/logs/ports/log.repository';
import { ID_GENERATOR } from '../domain/shared/ports/id-generator';
import { PrismaModule } from './persistence/prisma/prisma.module';
import { PrismaLogRepository } from './persistence/prisma/prisma-log.repository';
import { PrismaAnalysisRepository } from './persistence/prisma/prisma-analysis.repository';
import { CryptoIdGenerator } from './shared/crypto-id-generator';
import { ANALYSIS_REPOSITORY } from '../domain/analysis/ports/analysis.repository';
import { ANOMALY_DETECTOR } from '../domain/analysis/ports/incident-anomaly-detector';
import { INCIDENT_CLUSTERER } from '../domain/analysis/ports/incident-clusterer';
import { INCIDENT_SUMMARIZER } from '../domain/analysis/ports/incident-summarizer';
import { RuleBasedAnomalyDetector } from './analysis/rule-based-anomaly-detector';
import { TimeServiceIncidentClusterer } from './analysis/time-service-incident-clusterer';
import { FakeIncidentSummarizer } from './analysis/fake-incident-summarizer';
import { ANALYSIS_QUEUE, } from '../domain/analysis/ports/analysis.queue';
import { ANALYSIS_QUEUE_NAME, BullMqAnalysisQueue } from './queue/analysis.queue';
import { PrismaHealthCheck } from './health/prisma-health-check';
import { RedisHealthCheck } from './health/redis-health-check';
import { HEALTH_CHECKS } from '../domain/health/ports/health-check.port';

const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);

@Module({
  imports: [
    PrismaModule,
    ...(isTest ? [] : [
      BullModule.forRoot({
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
        },
      }),
      BullModule.registerQueue({ name: ANALYSIS_QUEUE_NAME }),
    ]),
  ],
  providers: [
    PrismaLogRepository,
    PrismaAnalysisRepository,
    PrismaHealthCheck,
    RedisHealthCheck,
    {
      provide: HEALTH_CHECKS,
      useFactory: (database: PrismaHealthCheck, redis: RedisHealthCheck) => [
        { name: 'database', check: database },
        { name: 'redis', check: redis },
      ],
      inject: [PrismaHealthCheck, RedisHealthCheck],
    },
    RuleBasedAnomalyDetector,
    TimeServiceIncidentClusterer,
    FakeIncidentSummarizer,
    { provide: LOG_REPOSITORY, useExisting: PrismaLogRepository },
    { provide: ANALYSIS_REPOSITORY, useExisting: PrismaAnalysisRepository },
    { provide: ANOMALY_DETECTOR, useExisting: RuleBasedAnomalyDetector },
    { provide: INCIDENT_CLUSTERER, useExisting: TimeServiceIncidentClusterer },
    { provide: INCIDENT_SUMMARIZER, useExisting: FakeIncidentSummarizer },
    ...(isTest
      ? [{ provide: ANALYSIS_QUEUE, useValue: { publish: async ({ analysisId }: { analysisId: string }) => ({ jobId: analysisId }) } }]
      : [BullMqAnalysisQueue, { provide: ANALYSIS_QUEUE, useExisting: BullMqAnalysisQueue }]),
    { provide: ID_GENERATOR, useClass: CryptoIdGenerator },
  ],
  exports: [
    LOG_REPOSITORY,
    ANALYSIS_REPOSITORY,
    ANOMALY_DETECTOR,
    INCIDENT_CLUSTERER,
    INCIDENT_SUMMARIZER,
    ANALYSIS_QUEUE,
    HEALTH_CHECKS,
    ID_GENERATOR,
  ],
})
export class InfrastructureModule {}
