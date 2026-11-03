import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('CreateLog (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await NestFactory.create(AppModule);
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
