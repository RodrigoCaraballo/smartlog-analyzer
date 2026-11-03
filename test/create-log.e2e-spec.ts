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
});
