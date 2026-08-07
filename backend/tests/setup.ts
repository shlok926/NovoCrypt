import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock Redis globally to prevent external cache dependencies
vi.mock('ioredis', () => {
  return { default: require('ioredis-mock') };
});

// Mock Pino to prevent log noise during tests
vi.mock('pino', () => {
  const pinoMock = () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
  });
  pinoMock.stdTimeFunctions = { isoTime: vi.fn() };
  
  return {
    default: pinoMock,
    pino: pinoMock,
  };
});

vi.mock('pino-http', () => {
  return {
    default: () => (req: any, res: any, next: any) => next(),
  };
});

// Mock prom-client to avoid metrics conflicts
vi.mock('prom-client', () => {
  class MockRegistry {
    metrics = vi.fn();
    clear = vi.fn();
    setDefaultLabels = vi.fn();
  }
  class MockCounter { inc = vi.fn(); }
  class MockHistogram { observe = vi.fn(); startTimer = vi.fn(() => vi.fn()); }
  class MockGauge { set = vi.fn(); inc = vi.fn(); dec = vi.fn(); }
  class MockSummary { observe = vi.fn(); }

  const mockProm = {
    Registry: MockRegistry,
    collectDefaultMetrics: vi.fn(),
    Counter: MockCounter,
    Histogram: MockHistogram,
    Gauge: MockGauge,
    Summary: MockSummary,
  };
  return {
    ...mockProm,
    default: mockProm,
  };
});

// If executing integration tests, wipe the DB between suites
afterEach(async () => {
  if (process.env.TEST_ENV === 'integration') {
    const tableNames = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tableNames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    if (tables.length > 0) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
      } catch (error) {
        console.error({ error });
      }
    }
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
