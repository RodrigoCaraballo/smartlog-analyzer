import { Module } from '@nestjs/common';
import { LOG_REPOSITORY } from '../domain/logs/ports/log.repository';
import { ID_GENERATOR } from '../domain/shared/ports/id-generator';
import { PrismaModule } from './persistence/prisma/prisma.module';
import { PrismaLogRepository } from './persistence/prisma/prisma-log.repository';
import { CryptoIdGenerator } from './shared/crypto-id-generator';

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaLogRepository,
    { provide: LOG_REPOSITORY, useExisting: PrismaLogRepository },
    { provide: ID_GENERATOR, useClass: CryptoIdGenerator },
  ],
  exports: [LOG_REPOSITORY, ID_GENERATOR],
})
export class InfrastructureModule {}
