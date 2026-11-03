import type { Log } from '../entities/log.entity';
import type { ListLogsInput } from '../inputs/list-logs.input';
import type { AnalyzeLogsFilters } from '../../analysis/inputs/analyze-logs.input';

export const LOG_REPOSITORY = Symbol('LOG_REPOSITORY');

export interface LogRepository {
  save(log: Log): Promise<Log>;
  findMany(input: ListLogsInput): Promise<{ items: Log[]; total: number }>;
  findForAnalysis(selection: { logIds?: string[]; filters?: AnalyzeLogsFilters }): Promise<Log[]>;
  findByIds(ids: string[]): Promise<Log[]>;
}
