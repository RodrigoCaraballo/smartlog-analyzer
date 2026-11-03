require('dotenv/config');

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to run the Prisma seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const logs = [
    {
      id: '11111111-1111-4111-8111-111111111111',
      service: 'payments',
      level: 'ERROR',
      message: 'Connection timeout',
      timestamp: new Date(Date.now() - 120000),
      traceId: 'trace-001',
      metadata: { endpoint: '/payments' },
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      service: 'payments',
      level: 'WARN',
      message: 'Retrying payment provider request',
      timestamp: new Date(Date.now() - 60000),
      traceId: 'trace-001',
      metadata: { attempt: 2 },
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      service: 'catalog',
      level: 'INFO',
      message: 'Product cache refreshed',
      timestamp: new Date(Date.now() - 30000),
      metadata: { items: 120 },
    },
  ];

  const generatedLogs = [];
  const services = ['payments', 'catalog', 'auth', 'orders'];
  const messages = [
    'Connection timeout',
    'Connection refused by upstream',
    'Request completed successfully',
    'User session refreshed',
    'Order received',
  ];

  for (let index = 1; index <= 36; index += 1) {
    const service = services[index % services.length];
    const isError = index <= 12 || index % 9 === 0;
    const message = index <= 6 ? 'Connection timeout' : messages[index % messages.length];
    generatedLogs.push({
      id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      service,
      level: isError ? 'ERROR' : index % 4 === 0 ? 'WARN' : 'INFO',
      message,
      timestamp: new Date(Date.now() - index * 15000),
      traceId: `seed-trace-${String((index % 8) + 1).padStart(3, '0')}`,
      metadata: { source: 'development-seed', sequence: index },
    });
  }

  logs.push(...generatedLogs);

  for (const log of logs) {
    await prisma.log.upsert({ where: { id: log.id }, update: {}, create: log });
  }
}

main().finally(() => prisma.$disconnect());
