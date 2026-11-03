import type { LogLevel, LogMetadata } from '../entities/log.entity';

export interface LogOutput {
  id: string;
  service: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  receivedAt: string;
  traceId?: string;
  metadata: LogMetadata;
}
