export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

export const LOG_LEVELS = Object.values(LogLevel);

export type LogMetadata = Record<string, unknown>;

export interface LogProps {
  id: string;
  service: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  receivedAt: Date;
  traceId?: string;
  metadata: LogMetadata;
}

export class Log {
  private constructor(private readonly props: LogProps) {}

  static create(props: LogProps): Log {
    if (!props.service.trim()) throw new Error('Service is required');
    if (!props.message.trim()) throw new Error('Message is required');
    if (!LOG_LEVELS.includes(props.level)) throw new Error('Invalid log level');
    if (Number.isNaN(props.timestamp.getTime())) throw new Error('Invalid timestamp');
    return new Log({ ...props, service: props.service.trim(), message: props.message.trim() });
  }

  toPrimitives(): LogProps {
    return { ...this.props, metadata: { ...this.props.metadata } };
  }
}
