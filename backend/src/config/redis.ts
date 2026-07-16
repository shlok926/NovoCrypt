import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null, // Disable reconnection if Redis is not available
});

// Prevent unhandled error crashes
redis.on('error', (err) => {
  // Silent catch to prevent console spam when running without Redis
});
