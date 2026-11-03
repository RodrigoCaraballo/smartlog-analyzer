import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { jest } from '@jest/globals';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/persistence/prisma/prisma.service';

describe('CreateLog (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
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
        findUnique: jest.fn(async () => null),
      },
      analysisLog: {
        createMany: jest.fn(async () => ({ count: 1 })),
      },
      $transaction: jest.fn(async (callback: (transaction: unknown) => unknown) => callback(prismaMock)),
    };
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
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

  it('rejects an analysis without logIds or filters', async () => {
    await request(app.getHttpServer())
      .post('/api/logs/analyze')
      .send({})
      .expect(400);
  });
});
