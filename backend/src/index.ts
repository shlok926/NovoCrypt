import { createServer } from 'http';
import app from './app';
import { prisma } from './config/database';
import { env } from './config/env';
import { redis } from './config/redis';
import { initializeWebSocket } from './config/websocket';
import { initializeCronJobs } from './jobs/cron';
import { logger } from './middleware/logger';

const start = async (): Promise<void> => {
  try {
    // Try to connect to Prisma (optional for now)
    try {
      await prisma.$connect();
      logger.info('Database connected');
    } catch (dbError) {
      logger.warn('Database connection failed - running in mock mode');
    }

    // Try to connect to Redis (optional for now)
    try {
      await redis.connect();
      logger.info('Redis connected');
    } catch (redisError) {
      logger.warn('Redis connection failed - using in-memory cache');
    }

    // Create HTTP server with Express app
    const server = createServer(app);

    // Initialize WebSocket
    initializeWebSocket(server);
    logger.info('WebSocket initialized');

    // Initialize Cron Jobs
    initializeCronJobs();

    server.listen(env.PORT, () => {
      logger.info(`Backend running on http://localhost:${env.PORT}`);
      logger.info(`Real-time updates enabled via WebSocket`);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

void start();
