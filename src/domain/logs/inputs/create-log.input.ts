import type { LogLevel, LogMetadata } from '../entities/log.entity';

export interface CreateLogInput {
  service: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  traceId?: string;
  metadata?: LogMetadata;
}
