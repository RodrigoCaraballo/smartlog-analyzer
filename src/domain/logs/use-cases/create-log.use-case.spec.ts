import { CreateLogUseCase } from './create-log.use-case';
import type { LogRepository } from '../ports/log.repository';
import type { IdGenerator } from '../../shared/ports/id-generator';

describe('CreateLogUseCase', () => {
  it('creates and persists a log with a server receive timestamp', async () => {
    const repository: LogRepository = {
      save: jest.fn(async (log) => log),
      findMany: jest.fn(),
    };
    const idGenerator: IdGenerator = { generate: () => 'log-1' };
    const useCase = new CreateLogUseCase(repository, idGenerator);

    const result = await useCase.execute({
      service: 'payments',
      level: 'ERROR',
      message: 'Connection timeout',
      timestamp: new Date('2026-11-02T14:00:00.000Z'),
      metadata: { endpoint: '/payments' },
    });

    expect(result).toMatchObject({
      id: 'log-1',
      service: 'payments',
      level: 'ERROR',
      message: 'Connection timeout',
      timestamp: '2026-11-02T14:00:00.000Z',
      metadata: { endpoint: '/payments' },
    });
    expect(result.receivedAt).toBeTruthy();
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('defaults metadata to an empty object', async () => {
    const repository: LogRepository = {
      save: jest.fn(async (log) => log),
      findMany: jest.fn(),
    };
    const useCase = new CreateLogUseCase(repository, { generate: () => 'log-1' });

    const result = await useCase.execute({
      service: 'catalog', level: 'INFO', message: 'Updated', timestamp: new Date(),
    });

    expect(result.metadata).toEqual({});
  });

  it('does not persist invalid domain data', async () => {
    const repository: LogRepository = {
      save: jest.fn(async (log) => log),
      findMany: jest.fn(),
    };
    const useCase = new CreateLogUseCase(repository, { generate: () => 'log-1' });

    await expect(useCase.execute({
      service: '', level: 'INFO', message: 'Updated', timestamp: new Date(),
    })).rejects.toThrow('Service is required');
    expect(repository.save).not.toHaveBeenCalled();
  });
});
