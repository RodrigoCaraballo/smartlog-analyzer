import type { LogLevel } from '../../logs/entities/log.entity';

export interface AnalyzeLogsFilters {
  service?: string;
  level?: LogLevel;
  from?: Date;
  to?: Date;
}

export interface AnalyzeLogsInput {
  logIds?: string[];
  filters?: AnalyzeLogsFilters;
}
