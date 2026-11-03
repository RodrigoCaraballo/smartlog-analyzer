import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { jest } from '@jest/globals';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/persistence/prisma/prisma.service';
import { HEALTH_CHECKS } from '../src/domain/health/ports/health-check.port';
import { StructuredLogger } from '../src/infrastructure/logging/structured.logger';
import { StructuredRequestLoggingInterceptor } from '../src/presentation/http/logging/structured-request-logging.interceptor';

describe('CreateLog (e2e)', () => {
  let app: INestApplication;
  let analysisLookup: Record<string, unknown> | null;
  let dependenciesAvailable = true;

  beforeEach(async () => {
    analysisLookup = null;
    dependenciesAvailable = true;
    const prismaMock = {
      log: {
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => data),
        findMany: jest.fn(async () => [{
          id: '11111111-1111-4111-8111-111111111111', service: 'payments', level: 'ERROR', message: 'Connection timeout',
          timestamp: new Date('2026-11-02T14:00:00.000Z'),
          receivedAt: new Date('2026-11-02T14:00:01.000Z'), traceId: null, metadata: {},
        }]),
        count: jest.fn(async () => 1),
      },
      analysis: {
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          ...data,
          createdAt: data.createdAt ?? new Date(),
          completedAt: data.completedAt ?? new Date(),
          result: data.result ?? null,
        })),
        findUnique: jest.fn(async () => analysisLookup),
      },
      analysisLog: {
        createMany: jest.fn(async () => ({ count: 1 })),
      },
      $transaction: jest.fn(async (callback: (transaction: unknown) => unknown) => callback(prismaMock)),
    };
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(HEALTH_CHECKS)
      .useValue([
        { name: 'database', check: { check: jest.fn(async () => { if (!dependenciesAvailable) throw new Error('down'); }) } },
        { name: 'redis', check: { check: jest.fn(async () => { if (!dependenciesAvailable) throw new Error('down'); }) } },
      ])
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useLogger(new StructuredLogger());
    app.useGlobalInterceptors(new StructuredRequestLoggingInterceptor(new StructuredLogger()));
    await app.init();
  });

  afterEach(async () => app.close());

  it('creates a log and generates receivedAt on the server', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/logs')
      .send({
        service: 'payments',
        level: 'ERROR',
        message: 'Connection timeout',
        timestamp: '2026-11-02T14:00:00.000Z',
        metadata: { endpoint: '/payments' },
      })
      .expect(201);

    expect(response.body).toMatchObject({
      service: 'payments', level: 'ERROR', message: 'Connection timeout',
      timestamp: '2026-11-02T14:00:00.000Z', metadata: { endpoint: '/payments' },
    });
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.receivedAt).toEqual(expect.any(String));
  });

  it('rejects invalid payloads', async () => {
    await request(app.getHttpServer())
      .post('/api/logs')
      .send({ service: 'p', level: 'TRACE', message: '', timestamp: 'invalid' })
      .expect(400);
  });

  it('rejects unknown properties', async () => {
    await request(app.getHttpServer())
      .post('/api/logs')
      .send({ service: 'payments', level: 'INFO', message: 'ok', timestamp: new Date().toISOString(), unknown: true })
      .expect(400);
  });

  it('lists logs with filters and pagination', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/logs?service=payments&level=ERROR&page=1&limit=20')
      .expect(200);

    expect(response.body).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({ id: '11111111-1111-4111-8111-111111111111', service: 'payments', level: 'ERROR' });
  });

  it('rejects invalid list filters', async () => {
    await request(app.getHttpServer())
      .get('/api/logs?level=TRACE&limit=101')
      .expect(400);
  });

  it('schedules the analysis and returns 202 without running the pipeline', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/logs/analyze')
      .send({ logIds: ['11111111-1111-4111-8111-111111111111'] })
      .expect(202);

    expect(response.body).toMatchObject({
      status: 'PENDING',
    });
    expect(response.body.id).toEqual(expect.any(String));
  });

  it('returns 404 for an unknown analysis', async () => {
    await request(app.getHttpServer())
      .get('/api/analysis/11111111-1111-4111-8111-111111111111')
      .expect(404);
  });

  it('returns a completed analysis report', async () => {
    analysisLookup = {
      id: '11111111-1111-4111-8111-111111111111', status: 'COMPLETED',
      createdAt: new Date('2026-11-03T10:00:00.000Z'), completedAt: new Date('2026-11-03T10:01:00.000Z'),
      filters: {}, model: 'fake-rule-based-summarizer', summary: 'One incident',
      result: { anomalies: [], incidents: [], recommendations: [] }, errorCode: null,
      logs: [],
    };

    const response = await request(app.getHttpServer())
      .get('/api/analysis/11111111-1111-4111-8111-111111111111/report')
      .expect(200);

    expect(response.body).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111', status: 'COMPLETED',
      summary: 'One incident', result: { anomalies: [], incidents: [], recommendations: [] },
    });
  });

  it('reports healthy dependencies', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(({ body, headers }) => {
        expect(body.status).toBe('ok');
        expect(body.checks).toEqual({ database: 'up', redis: 'up' });
        expect(headers['x-request-id']).toEqual(expect.any(String));
      });
  });

  it('reports unavailable dependencies with 503', async () => {
    dependenciesAvailable = false;
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(503)
      .expect(({ body }) => {
        expect(body.status).toBe('degraded');
        expect(body.checks).toEqual({ database: 'down', redis: 'down' });
      });
  });

  it('rejects an analysis without logIds or filters', async () => {
    await request(app.getHttpServer())
      .post('/api/logs/analyze')
      .send({})
      .expect(400);
  });
});
