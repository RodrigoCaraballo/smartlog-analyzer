import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { CreateLogUseCase } from './logs/use-cases/create-log.use-case';
import { ListLogsUseCase } from './logs/use-cases/list-logs.use-case';
import { LOG_REPOSITORY, type LogRepository } from './logs/ports/log.repository';
import { ID_GENERATOR, type IdGenerator } from './shared/ports/id-generator';

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
  ],
  exports: [CreateLogUseCase, ListLogsUseCase],
})
export class DomainModule {}
