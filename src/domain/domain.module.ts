import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { CreateLogUseCase } from './logs/use-cases/create-log.use-case';
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
  ],
  exports: [CreateLogUseCase],
})
export class DomainModule {}
