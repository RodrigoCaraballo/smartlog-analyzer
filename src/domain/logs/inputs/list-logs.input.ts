import type { LogLevel } from '../entities/log.entity';

export interface ListLogsInput {
  service?: string;
  level?: LogLevel;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}
