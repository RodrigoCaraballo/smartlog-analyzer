import { Log } from '../entities/log.entity';
import type { CreateLogInput } from '../inputs/create-log.input';
import type { LogOutput } from '../outputs/log.output';
import type { LogRepository } from '../ports/log.repository';
import type { IdGenerator } from '../../shared/ports/id-generator';

export class CreateLogUseCase {
  constructor(
    private readonly repository: LogRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: CreateLogInput): Promise<LogOutput> {
    const log = Log.create({
      id: this.idGenerator.generate(),
      service: input.service,
      level: input.level,
      message: input.message,
      timestamp: input.timestamp,
      receivedAt: new Date(),
      traceId: input.traceId,
      metadata: input.metadata ?? {},
    });

    const saved = await this.repository.save(log);
    const result = saved.toPrimitives();

    return {
      id: result.id,
      service: result.service,
      level: result.level,
      message: result.message,
      timestamp: result.timestamp.toISOString(),
      receivedAt: result.receivedAt.toISOString(),
      traceId: result.traceId,
      metadata: result.metadata,
    };
  }
}
