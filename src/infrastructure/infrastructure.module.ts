import { Module } from '@nestjs/common';
import { LOG_REPOSITORY } from '../domain/logs/ports/log.repository';
import { ID_GENERATOR } from '../domain/shared/ports/id-generator';
import { InMemoryLogRepository } from './persistence/in-memory/in-memory-log.repository';
import { CryptoIdGenerator } from './shared/crypto-id-generator';

@Module({
  providers: [
    InMemoryLogRepository,
    { provide: LOG_REPOSITORY, useExisting: InMemoryLogRepository },
    { provide: ID_GENERATOR, useClass: CryptoIdGenerator },
  ],
  exports: [LOG_REPOSITORY, ID_GENERATOR],
})
export class InfrastructureModule {}
