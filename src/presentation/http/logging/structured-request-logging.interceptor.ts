import {
  CallHandler,
  ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { catchError, tap, throwError, type Observable } from 'rxjs';
import { StructuredLogger } from '../../../infrastructure/logging/structured.logger';

@Injectable()
export class StructuredRequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { requestId?: string }>();
    const response = http.getResponse<Response>();
    const requestId = request.headers['x-request-id']?.toString() || randomUUID();
    const startedAt = Date.now();
    const route = request.route?.path?.toString() ?? request.path;
    const analysisId = typeof request.params?.id === 'string' ? request.params.id : undefined;

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);
    this.logger.log('http.request.started', {
      requestId,
      method: request.method,
      path: route,
      queryKeys: Object.keys(request.query),
      ...(analysisId ? { analysisId } : {}),
    });

    const metadata = () => ({
      requestId,
      method: request.method,
      path: route,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt,
      ...(analysisId ? { analysisId } : {}),
    });

    return next.handle().pipe(
      tap(() => this.logger.log('http.request.completed', metadata())),
      catchError((error: unknown) => {
        this.logger.error('http.request.failed', {
          ...metadata(),
          statusCode: typeof error === 'object' && error !== null && 'getStatus' in error
            ? (error as { getStatus: () => number }).getStatus()
            : 500,
        });
        return throwError(() => error);
      }),
    );
  }
}
