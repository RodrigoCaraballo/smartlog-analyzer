import { Module } from '@nestjs/common';
import { DomainModule } from '../domain/domain.module';
import { LogsController } from './http/logs/logs.controller';
import { AnalysisController } from './http/analysis/analysis.controller';
import { HealthController } from './http/health/health.controller';

@Module({
  imports: [DomainModule],
  controllers: [LogsController, AnalysisController, HealthController],
})
export class PresentationModule {}
