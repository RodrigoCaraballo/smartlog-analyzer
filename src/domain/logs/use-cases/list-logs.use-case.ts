import { Log } from '../entities/log.entity';
import type { ListLogsInput } from '../inputs/list-logs.input';
import type { PaginatedLogsOutput } from '../outputs/paginated-logs.output';
import { type LogRepository } from '../ports/log.repository';

export class ListLogsUseCase {
  constructor(private readonly repository: LogRepository) {}

  async execute(input: ListLogsInput): Promise<PaginatedLogsOutput> {
    const page = input.page || 1;
    const limit = input.limit || 20;

    if (page < 1 || limit < 1 || limit > 100) {
      throw new Error('Invalid pagination parameters');
    }

    if (input.from && input.to && input.from > input.to) {
      throw new Error('The from date must be before the to date');
    }

    const result = await this.repository.findMany({ ...input, page, limit });

    return {
      items: result.items.map((log) => ListLogsUseCase.toOutput(log)),
      page,
      limit,
      total: result.total,
      totalPages: result.total === 0 ? 0 : Math.ceil(result.total / limit),
    };
  }

  private static toOutput(log: Log) {
    const value = log.toPrimitives();
    return {
      id: value.id,
      service: value.service,
      level: value.level,
      message: value.message,
      timestamp: value.timestamp.toISOString(),
      receivedAt: value.receivedAt.toISOString(),
      traceId: value.traceId,
      metadata: value.metadata,
    };
  }
}
