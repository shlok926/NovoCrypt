import { prisma } from '../config/database';
import { LeaderboardEntry, UserProfile, UserAchievement } from '../types';

export const communityService = {
  // Mock data preserved for parts not yet migrated to Prisma
  async getLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
    return [];
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return null;
  },

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return [];
  },

  async getAchievements(): Promise<UserAchievement[]> {
    return [];
  },

  async getCommunityThreads(category?: string) {
    const where = category ? { category } : {};
    const threads = await prisma.communityThread.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { 
        author: true, 
        replies: { include: { author: true } },
        _count: { select: { replies: true, userUpvotes: true } }
      }
    });

    return threads.map((t: any) => ({
      id: t.id,
      title: t.title,
      content: t.content,
      category: t.category,
      tags: t.tags,
      createdAt: t.createdAt.toISOString(),
      views: t.views,
      upvotes: t._count.userUpvotes,
      replies: t._count.replies,
      author: {
        id: t.author.id,
        username: t.author.name || 'User',
        avatar: t.author.avatar || '👤',
        knowledgeLevel: t.author.knowledgeLevel || 'beginner'
      },
      replyList: t.replies.map((r: any) => ({
        id: r.id,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        author: {
          id: r.author.id,
          username: r.author.name || 'User',
          avatar: r.author.avatar || '👤',
          knowledgeLevel: r.author.knowledgeLevel || 'beginner'
        }
      }))
    }));
  },

  async getThreadById(threadId: string) {
    const t = await prisma.communityThread.findUnique({
      where: { id: threadId },
      include: { 
        author: true, 
        replies: { include: { author: true } },
        _count: { select: { replies: true, userUpvotes: true } }
      }
    });
    if (!t) return null;
    return {
      id: t.id,
      title: t.title,
      content: t.content,
      category: t.category,
      tags: t.tags,
      createdAt: t.createdAt.toISOString(),
      views: t.views,
      upvotes: t._count.userUpvotes,
      replies: t._count.replies,
      author: {
        id: t.author.id,
        username: t.author.name || 'User',
        avatar: t.author.avatar || '👤',
        knowledgeLevel: t.author.knowledgeLevel || 'beginner'
      },
      replyList: t.replies.map((r: any) => ({
        id: r.id,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        author: {
          id: r.author.id,
          username: r.author.name || 'User',
          avatar: r.author.avatar || '👤',
          knowledgeLevel: r.author.knowledgeLevel || 'beginner'
        }
      }))
    };
  },

  async searchThreads(query: string) {
    // For simplicity, just fetch all and filter in memory since we don't have full-text search setup
    const threads = await this.getCommunityThreads();
    const lowerQuery = query.toLowerCase();
    return threads.filter(t => 
      t.title.toLowerCase().includes(lowerQuery) || 
      t.content.toLowerCase().includes(lowerQuery)
    );
  },

  async getPopularThreads(limit: number = 5) {
    const threads = await this.getCommunityThreads();
    return threads.sort((a, b) => b.views - a.views).slice(0, limit);
  },

  async getTrendingTopics() {
    return [];
  },

  async createThread(title: string, content: string, category: string, authorPayload: any) {
    // Upsert a dummy user based on authorPayload to satisfy Foreign Keys until Auth is real
    // Use a fixed valid UUID for the dummy user to avoid Prisma UUID validation errors
    const dummyUserId = '00000000-0000-0000-0000-000000000001';
    const email = `dummy1@temp.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: dummyUserId,
        email,
        passwordHash: 'dummy',
        name: authorPayload.username || 'User',
        avatar: authorPayload.avatar || '👤',
        knowledgeLevel: authorPayload.knowledgeLevel || 'beginner'
      }
    });

    const t = await prisma.communityThread.create({
      data: {
        title,
        content,
        category,
        authorId: user.id,
        tags: []
      },
      include: { author: true, replies: { include: { author: true } }, _count: { select: { replies: true, userUpvotes: true } } }
    });

    return {
      id: t.id,
      title: t.title,
      content: t.content,
      category: t.category,
      tags: t.tags,
      createdAt: t.createdAt.toISOString(),
      views: t.views,
      upvotes: t._count.userUpvotes,
      replies: t._count.replies,
      author: {
        id: t.author.id,
        username: t.author.name || 'User',
        avatar: t.author.avatar || '👤',
        knowledgeLevel: t.author.knowledgeLevel || 'beginner'
      },
      replyList: []
    };
  },

  async upvoteThread(threadId: string) {
    // Without a real user, we just return the thread and pretend it worked for now, or just increment
    // Actually, we can increment upvotes natively in Prisma if we had an upvotes count column
    // For now we'll do an update
    const t = await prisma.communityThread.update({
      where: { id: threadId },
      data: { upvotes: { increment: 1 } },
      include: { author: true, replies: { include: { author: true } }, _count: { select: { replies: true, userUpvotes: true } } }
    });
    
    // We return a mapped thread
    return await this.getThreadById(threadId);
  },

  async replyToThread(threadId: string, authorPayload: any, content: string) {
    const dummyUserId = '00000000-0000-0000-0000-000000000001';
    const email = `dummy1@temp.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: dummyUserId,
        email,
        passwordHash: 'dummy',
        name: authorPayload.username || 'User',
        avatar: authorPayload.avatar || '👤',
        knowledgeLevel: authorPayload.knowledgeLevel || 'beginner'
      }
    });

    await prisma.communityReply.create({
      data: {
        content,
        threadId,
        authorId: user.id
      }
    });

    return await this.getThreadById(threadId);
  }
};
