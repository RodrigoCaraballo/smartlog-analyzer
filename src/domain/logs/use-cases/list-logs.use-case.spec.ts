import { Log } from '../entities/log.entity';
import type { LogRepository } from '../ports/log.repository';
import { ListLogsUseCase } from './list-logs.use-case';

describe('ListLogsUseCase', () => {
  const log = Log.create({
    id: 'log-1',
    service: 'payments',
    level: 'ERROR',
    message: 'Connection timeout',
    timestamp: new Date('2026-11-03T10:00:00.000Z'),
    receivedAt: new Date('2026-11-03T10:01:00.000Z'),
    metadata: { endpoint: '/payments' },
  });

  it('returns paginated logs and calculates total pages', async () => {
    const repository: LogRepository = {
      save: jest.fn(),
      findMany: jest.fn(async () => ({ items: [log], total: 21 })),
    };

    const result = await new ListLogsUseCase(repository).execute({
      service: 'payments', level: 'ERROR', page: 2, limit: 10,
    });

    expect(repository.findMany).toHaveBeenCalledWith({
      service: 'payments', level: 'ERROR', page: 2, limit: 10,
    });
    expect(result).toMatchObject({ page: 2, limit: 10, total: 21, totalPages: 3 });
    expect(result.items[0]).toMatchObject({ id: 'log-1', service: 'payments' });
  });

  it('uses the default pagination values', async () => {
    const repository: LogRepository = {
      save: jest.fn(),
      findMany: jest.fn(async () => ({ items: [], total: 0 })),
    };

    const result = await new ListLogsUseCase(repository).execute({ page: 1, limit: 20 });

    expect(result).toMatchObject({ page: 1, limit: 20, total: 0, totalPages: 0 });
  });

  it('rejects an inverted date range', async () => {
    const repository: LogRepository = { save: jest.fn(), findMany: jest.fn() };

    await expect(new ListLogsUseCase(repository).execute({
      from: new Date('2026-11-04T00:00:00.000Z'),
      to: new Date('2026-11-03T00:00:00.000Z'),
      page: 1,
      limit: 20,
    })).rejects.toThrow('from date must be before');
    expect(repository.findMany).not.toHaveBeenCalled();
  });
});
