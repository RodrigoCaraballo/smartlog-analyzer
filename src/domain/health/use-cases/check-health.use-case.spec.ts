import { CheckHealthUseCase } from './check-health.use-case';

describe('CheckHealthUseCase', () => {
  it('returns ok when every dependency is available', async () => {
    const useCase = new CheckHealthUseCase([
      { name: 'database', check: { check: jest.fn() } },
      { name: 'redis', check: { check: jest.fn() } },
    ]);

    await expect(useCase.execute()).resolves.toMatchObject({
      status: 'ok', checks: { database: 'up', redis: 'up' },
    });
  });

  it('returns degraded without exposing dependency errors', async () => {
    const useCase = new CheckHealthUseCase([
      { name: 'database', check: { check: jest.fn().mockRejectedValue(new Error('secret connection string')) } },
      { name: 'redis', check: { check: jest.fn() } },
    ]);

    await expect(useCase.execute()).resolves.toMatchObject({
      status: 'degraded', checks: { database: 'down', redis: 'up' },
    });
  });
});
