import { Module } from '@nestjs/common';
import { DomainModule } from '../domain/domain.module';
import { LogsController } from './http/logs/logs.controller';

@Module({
  imports: [DomainModule],
  controllers: [LogsController],
})
export class PresentationModule {}
