import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sessionService } from '../../src/services/session.service';
import { prisma } from '../../src/config/database';
import { redis } from '../../src/config/redis';
import { logger } from '../../src/middleware/logger';

vi.mock('../../src/config/database', () => ({
  prisma: {
    userSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('../../src/config/redis', () => ({
  redis: {
    status: 'ready',
    set: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('../../src/middleware/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Session Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (redis as any).status = 'ready';
  });

  it('should create user session with custom or default parameters', async () => {
    vi.mocked(prisma.userSession.create).mockResolvedValue({ id: 'sess-1' } as any);

    await sessionService.createSession('user-1', 'jti-1', '127.0.0.1', 'Agent', 3600);

    expect(prisma.userSession.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        tokenJti: 'jti-1',
        ipAddress: '127.0.0.1',
        userAgent: 'Agent',
        expiresAt: expect.any(Date),
      },
    });
  });

  it('should create user session with null ip and userAgent if omitted', async () => {
    vi.mocked(prisma.userSession.create).mockResolvedValue({ id: 'sess-2' } as any);

    await sessionService.createSession('user-2', 'jti-2');

    expect(prisma.userSession.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-2',
        tokenJti: 'jti-2',
        ipAddress: null,
        userAgent: null,
        expiresAt: expect.any(Date),
      },
    });
  });

  it('should blacklist token in Redis when Redis is ready', async () => {
    vi.mocked(redis.set).mockResolvedValue('OK');

    await sessionService.blacklistToken('jti-123', 600);

    expect(redis.set).toHaveBeenCalledWith('token:blacklist:jti-123', 'revoked', 'EX', 600);
  });

  it('should skip Redis set if Redis status is disconnected', async () => {
    (redis as any).status = 'end';

    await sessionService.blacklistToken('jti-123');

    expect(redis.set).not.toHaveBeenCalled();
  });

  it('should log warning if Redis set fails during blacklisting', async () => {
    (redis as any).status = 'ready';
    const redisErr = new Error('Redis connection drop');
    vi.mocked(redis.set).mockRejectedValue(redisErr);

    await sessionService.blacklistToken('jti-err');

    expect(logger.warn).toHaveBeenCalledWith(
      { error: redisErr, tokenJti: 'jti-err' },
      'Redis token blacklisting failed; falling back to DB tracking'
    );
  });

  it('should return true if token is blacklisted in Redis', async () => {
    (redis as any).status = 'ready';
    vi.mocked(redis.get).mockResolvedValue('revoked');

    const result = await sessionService.isTokenBlacklisted('jti-revoked');

    expect(result).toBe(true);
    expect(prisma.userSession.findUnique).not.toHaveBeenCalled();
  });

  it('should fallback to DB if Redis returns non-revoked or is disconnected', async () => {
    (redis as any).status = 'end';
    vi.mocked(prisma.userSession.findUnique).mockResolvedValue({ isRevoked: true } as any);

    const result = await sessionService.isTokenBlacklisted('jti-db-revoked');

    expect(result).toBe(true);
    expect(prisma.userSession.findUnique).toHaveBeenCalledWith({
      where: { tokenJti: 'jti-db-revoked' },
      select: { isRevoked: true },
    });
  });

  it('should return false if DB session is missing or not revoked', async () => {
    (redis as any).status = 'ready';
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.userSession.findUnique).mockResolvedValue(null);

    const result = await sessionService.isTokenBlacklisted('jti-not-found');

    expect(result).toBe(false);
  });

  it('should catch Redis lookup errors, log warning, and check DB fallback', async () => {
    (redis as any).status = 'ready';
    const redisErr = new Error('Redis lookup error');
    vi.mocked(redis.get).mockRejectedValue(redisErr);
    vi.mocked(prisma.userSession.findUnique).mockResolvedValue({ isRevoked: false } as any);

    const result = await sessionService.isTokenBlacklisted('jti-err');

    expect(logger.warn).toHaveBeenCalledWith(
      { error: redisErr, tokenJti: 'jti-err' },
      'Redis blacklist lookup failed; checking DB session status'
    );
    expect(result).toBe(false);
  });

  it('should revoke a single session by blacklisting token and updating DB', async () => {
    vi.mocked(redis.set).mockResolvedValue('OK');
    vi.mocked(prisma.userSession.updateMany).mockResolvedValue({ count: 1 } as any);

    await sessionService.revokeSession('user-1', 'jti-1');

    expect(redis.set).toHaveBeenCalledWith('token:blacklist:jti-1', 'revoked', 'EX', 28800);
    expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', tokenJti: 'jti-1' },
      data: { isRevoked: true },
    });
  });

  it('should revoke all active sessions for a user', async () => {
    vi.mocked(prisma.userSession.findMany).mockResolvedValue([
      { tokenJti: 'jti-a' },
      { tokenJti: 'jti-b' },
    ] as any);
    vi.mocked(redis.set).mockResolvedValue('OK');
    vi.mocked(prisma.userSession.updateMany).mockResolvedValue({ count: 2 } as any);

    await sessionService.revokeAllSessions('user-1');

    expect(prisma.userSession.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isRevoked: false },
      select: { tokenJti: true },
    });
    expect(redis.set).toHaveBeenCalledTimes(2);
    expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isRevoked: false },
      data: { isRevoked: true },
    });
  });

  it('should get user sessions ordered by createdAt desc', async () => {
    const mockSessions = [{ id: 'sess-1' }];
    vi.mocked(prisma.userSession.findMany).mockResolvedValue(mockSessions as any);

    const result = await sessionService.getUserSessions('user-1');

    expect(prisma.userSession.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual(mockSessions);
  });
});
