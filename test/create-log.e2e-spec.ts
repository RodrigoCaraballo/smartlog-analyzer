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
          id: 'log-1', service: 'payments', level: 'ERROR', message: 'Connection timeout',
          timestamp: new Date('2026-11-02T14:00:00.000Z'),
          receivedAt: new Date('2026-11-02T14:00:01.000Z'), traceId: null, metadata: {},
        }]),
        count: jest.fn(async () => 1),
      },
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
    expect(response.body.items[0]).toMatchObject({ id: 'log-1', service: 'payments', level: 'ERROR' });
  });

  it('rejects invalid list filters', async () => {
    await request(app.getHttpServer())
      .get('/api/logs?level=TRACE&limit=101')
      .expect(400);
  });
});
