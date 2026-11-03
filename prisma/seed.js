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

  for (const log of logs) {
    await prisma.log.upsert({ where: { id: log.id }, update: {}, create: log });
  }
}

main().finally(() => prisma.$disconnect());
