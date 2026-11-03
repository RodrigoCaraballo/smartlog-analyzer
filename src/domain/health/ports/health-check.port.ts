export const HEALTH_CHECKS = Symbol('HEALTH_CHECKS');

export interface HealthCheckPort {
  check(): Promise<void>;
}
