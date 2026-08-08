import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { logger } from '../middleware/logger';

const TOKEN_BLACKLIST_PREFIX = 'token:blacklist:';
const DEFAULT_TTL_SECONDS = 28800; // 8 hours

export const sessionService = {
  async createSession(
    userId: string,
    tokenJti: string,
    ipAddress?: string,
    userAgent?: string,
    expiresInSeconds: number = DEFAULT_TTL_SECONDS
  ) {
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    return await prisma.userSession.create({
      data: {
        userId,
        tokenJti,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt,
      },
    });
  },

  async blacklistToken(tokenJti: string, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        await redis.set(`${TOKEN_BLACKLIST_PREFIX}${tokenJti}`, 'revoked', 'EX', ttlSeconds);
      }
    } catch (error) {
      logger.warn({ error, tokenJti }, 'Redis token blacklisting failed; falling back to DB tracking');
    }
  },

  async isTokenBlacklisted(tokenJti: string): Promise<boolean> {
    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        const result = await redis.get(`${TOKEN_BLACKLIST_PREFIX}${tokenJti}`);
        if (result === 'revoked') return true;
      }
    } catch (error) {
      logger.warn({ error, tokenJti }, 'Redis blacklist lookup failed; checking DB session status');
    }

    // Database fallback
    const session = await prisma.userSession.findUnique({
      where: { tokenJti },
      select: { isRevoked: true },
    });

    return session?.isRevoked ?? false;
  },

  async revokeSession(userId: string, tokenJti: string): Promise<void> {
    await this.blacklistToken(tokenJti);

    await prisma.userSession.updateMany({
      where: { userId, tokenJti },
      data: { isRevoked: true },
    });
  },

  async revokeAllSessions(userId: string): Promise<void> {
    const activeSessions = await prisma.userSession.findMany({
      where: { userId, isRevoked: false },
      select: { tokenJti: true },
    });

    for (const session of activeSessions) {
      await this.blacklistToken(session.tokenJti);
    }

    await prisma.userSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  },

  async getUserSessions(userId: string) {
    return await prisma.userSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },
};
