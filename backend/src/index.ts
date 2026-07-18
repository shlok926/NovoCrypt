import { createServer } from 'http';
import app from './app';
import { prisma } from './config/database';
import { env } from './config/env';
import { redis } from './config/redis';
import { initializeWebSocket } from './config/websocket';
import { initializeCronJobs } from './jobs/cron';

const start = async (): Promise<void> => {
  try {
    // Try to connect to Prisma (optional for now)
    try {
      await prisma.$connect();
      // eslint-disable-next-line no-console
      console.log('✓ Database connected');
    } catch (dbError) {
      // eslint-disable-next-line no-console
      console.warn('⚠ Database connection failed - running in mock mode');
    }

    // Try to connect to Redis (optional for now)
    try {
      await redis.connect();
      // eslint-disable-next-line no-console
      console.log('✓ Redis connected');
    } catch (redisError) {
      // eslint-disable-next-line no-console
      console.warn('⚠ Redis connection failed - using in-memory cache');
    }

    // Create HTTP server with Express app
    const server = createServer(app);

    // Initialize WebSocket
    initializeWebSocket(server);
    // eslint-disable-next-line no-console
    console.log('✓ WebSocket initialized');

    // Initialize Cron Jobs
    initializeCronJobs();

    server.listen(env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`✓ Backend running on http://localhost:${env.PORT}`);
      // eslint-disable-next-line no-console
      console.log(`✓ Real-time updates enabled via WebSocket`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

void start();
