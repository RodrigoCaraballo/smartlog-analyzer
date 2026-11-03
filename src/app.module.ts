import { Module } from '@nestjs/common';
import { LogsController } from './presentation/http/logs/logs.controller';
import { CreateLogUseCase } from './domain/logs/use-cases/create-log.use-case';
import { LOG_REPOSITORY } from './domain/logs/ports/log.repository';
import type { LogRepository } from './domain/logs/ports/log.repository';
import { ID_GENERATOR } from './domain/shared/ports/id-generator';
import type { IdGenerator } from './domain/shared/ports/id-generator';
import { InMemoryLogRepository } from './infrastructure/persistence/in-memory/in-memory-log.repository';
import { CryptoIdGenerator } from './infrastructure/shared/crypto-id-generator';

@Module({
  imports: [],
  controllers: [LogsController],
  providers: [
    InMemoryLogRepository,
    { provide: LOG_REPOSITORY, useExisting: InMemoryLogRepository },
    { provide: ID_GENERATOR, useClass: CryptoIdGenerator },
    {
      provide: CreateLogUseCase,
      useFactory: (repository: LogRepository, idGenerator: IdGenerator) =>
        new CreateLogUseCase(repository, idGenerator),
      inject: [LOG_REPOSITORY, ID_GENERATOR],
    },
  ],
})
export class AppModule {}
