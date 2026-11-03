import type { LoggerService } from '@nestjs/common';

type LogMetadata = Record<string, unknown>;

export class StructuredLogger implements LoggerService {
  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('info', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warn', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('verbose', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write('fatal', message, optionalParams);
  }

  private write(level: string, message: unknown, optionalParams: unknown[]): void {
    const context = optionalParams.find((value) => typeof value === 'string');
    const metadata = optionalParams.find((value) => this.isMetadata(value));
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.formatMessage(message),
      ...(context ? { context } : {}),
      ...(metadata ? metadata : {}),
    };
    const output = JSON.stringify(entry);

    if (level === 'error' || level === 'fatal') console.error(output);
    else if (level === 'warn') console.warn(output);
    else console.log(output);
  }

  private formatMessage(message: unknown): string {
    if (message instanceof Error) return message.message;
    if (typeof message === 'string') return message;
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }

  private isMetadata(value: unknown): value is LogMetadata {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Error);
  }
}
