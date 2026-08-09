import { describe, it, expect, vi } from 'vitest';
import { redis } from '../../src/config/redis';

describe('Redis Config - Unit Tests', () => {
  it('should handle redis error event without throwing uncaught exceptions', () => {
    expect(() => {
      redis.emit('error', new Error('Simulated Redis Connection Error'));
    }).not.toThrow();
  });

  it('should return null in retryStrategy to disable auto reconnect when redis is unreachable', () => {
    const options = (redis as any).options;
    if (typeof options?.retryStrategy === 'function') {
      const retry = options.retryStrategy(1);
      expect(retry).toBeNull();
    }
  });
});
