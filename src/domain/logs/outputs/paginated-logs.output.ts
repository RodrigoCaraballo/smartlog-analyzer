import type { LogOutput } from './log.output';

export interface PaginatedLogsOutput {
  items: LogOutput[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
