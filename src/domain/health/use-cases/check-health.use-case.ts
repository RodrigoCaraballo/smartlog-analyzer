import type { HealthCheckPort } from '../ports/health-check.port';

export interface HealthCheckOutput {
  status: 'ok' | 'degraded';
  timestamp: string;
  checks: Record<string, 'up' | 'down'>;
}

export class CheckHealthUseCase {
  constructor(
    private readonly checks: Array<{ name: string; check: HealthCheckPort }>,
  ) {}

  async execute(): Promise<HealthCheckOutput> {
    const results = await Promise.all(this.checks.map(async ({ name, check }) => {
      try {
        await check.check();
        return [name, 'up'] as const;
      } catch {
        return [name, 'down'] as const;
      }
    }));
    const checks = Object.fromEntries(results) as Record<string, 'up' | 'down'>;

    return {
      status: Object.values(checks).every((value) => value === 'up') ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
