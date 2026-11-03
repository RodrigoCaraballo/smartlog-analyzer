import { Module } from '@nestjs/common';
import { DomainModule } from '../../domain/domain.module';
import { InfrastructureModule } from '../infrastructure.module';
import { AnalysisWorker } from './analysis.worker';

@Module({
  imports: [DomainModule, InfrastructureModule],
  providers: [AnalysisWorker],
})
export class WorkerModule {}
