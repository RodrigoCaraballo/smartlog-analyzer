import { Injectable } from '@nestjs/common';
import type { Log } from '../../../domain/logs/entities/log.entity';
import type { LogRepository } from '../../../domain/logs/ports/log.repository';

@Injectable()
export class InMemoryLogRepository implements LogRepository {
  private readonly logs = new Map<string, Log>();

  async save(log: Log): Promise<Log> {
    this.logs.set(log.toPrimitives().id, log);
    return log;
  }

  all(): Log[] {
    return [...this.logs.values()];
  }
}
