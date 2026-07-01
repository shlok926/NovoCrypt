// Community & Leaderboard Service - User profiles, achievements, and rankings

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  joinDate: string;
  avatar: string;
  bio: string;
}

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  score: number;
  completedAssessments: number;
  migrationsInitiated: number;
  achievements: number;
  lastActive: string;
}

export interface CommunityThread {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar: string;
    knowledgeLevel: string;
  };
  category: 'discussion' | 'question' | 'guide' | 'news';
  tags: string[];
  createdAt: string;
  replies: number;
  views: number;
  upvotes: number;
  replyList?: {
    id: string;
    author: { username: string; avatar: string; knowledgeLevel: string };
    content: string;
    createdAt: string;
  }[];
}

const MOCK_USERS: UserProfile[] = [
  {
    id: 'user-1',
    username: 'QuantumVanguard',
    email: 'alice@example.com',
    knowledgeLevel: 'expert',
    joinDate: '2024-01-15',
    avatar: '👩‍💻',
    bio: 'Post-quantum cryptography researcher and enthusiast'
  },
  {
    id: 'user-2',
    username: 'CryptoGuardian',
    email: 'bob@example.com',
    knowledgeLevel: 'advanced',
    joinDate: '2024-02-20',
    avatar: '🔐',
    bio: 'Security engineer focused on quantum threat mitigation'
  },
  {
    id: 'user-3',
    username: 'QuantumExplorer',
    email: 'carol@example.com',
    knowledgeLevel: 'intermediate',
    joinDate: '2024-03-10',
    avatar: '🔬',
    bio: 'Learning about post-quantum algorithms'
  },
  {
    id: 'user-4',
    username: 'SecurityMaven',
    email: 'david@example.com',
    knowledgeLevel: 'expert',
    joinDate: '2023-11-05',
    avatar: '🛡️',
    bio: 'Enterprise security architect'
  }
];

const ACHIEVEMENTS: UserAchievement[] = [
  {
    id: 'ach-1',
    name: 'Quantum Rookie',
    description: 'Complete your first cryptographic assessment',
    icon: '🌱',
    rarity: 'common'
  },
  {
    id: 'ach-2',
    name: 'Algorithm Master',
    description: 'Learn about all major post-quantum algorithms',
    icon: '🧠',
    rarity: 'uncommon'
  },
  {
    id: 'ach-3',
    name: 'Migration Champion',
    description: 'Complete a full quantum-safe migration roadmap',
    icon: '🏆',
    rarity: 'rare'
  },
  {
    id: 'ach-4',
    name: 'Community Hero',
    description: 'Help 10 community members with their questions',
    icon: '⭐',
    rarity: 'rare'
  },
  {
    id: 'ach-5',
    name: 'Compliance Expert',
    description: 'Pass compliance checks against all NIST standards',
    icon: '✅',
    rarity: 'legendary'
  },
  {
    id: 'ach-6',
    name: 'Quantum Advocate',
    description: 'Share 5 guides or tips with the community',
    icon: '📢',
    rarity: 'uncommon'
  }
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: 'user-1',
    username: 'QuantumVanguard',
    avatar: '👩‍💻',
    score: 4850,
    completedAssessments: 28,
    migrationsInitiated: 6,
    achievements: 6,
    lastActive: '2 hours ago'
  },
  {
    rank: 2,
    userId: 'user-4',
    username: 'SecurityMaven',
    avatar: '🛡️',
    score: 4620,
    completedAssessments: 25,
    migrationsInitiated: 5,
    achievements: 5,
    lastActive: '4 hours ago'
  },
  {
    rank: 3,
    userId: 'user-2',
    username: 'CryptoGuardian',
    avatar: '🔐',
    score: 4320,
    completedAssessments: 22,
    migrationsInitiated: 4,
    achievements: 5,
    lastActive: '1 hour ago'
  },
  {
    rank: 4,
    userId: 'user-3',
    username: 'QuantumExplorer',
    avatar: '🔬',
    score: 3850,
    completedAssessments: 18,
    migrationsInitiated: 3,
    achievements: 3,
    lastActive: '30 minutes ago'
  }
];

let MOCK_THREADS: CommunityThread[] = [
  {
    id: 'thread-1',
    title: 'Best practices for ML-KEM integration',
    content: 'What are the recommended best practices when integrating ML-KEM into existing systems? Looking for practical advice...',
    author: {
      id: 'user-1',
      username: 'QuantumVanguard',
      avatar: '👩‍💻',
      knowledgeLevel: 'expert'
    },
    category: 'guide',
    tags: ['ML-KEM', 'Integration', 'Best Practices'],
    createdAt: '2026-05-18T08:00:00Z',
    replies: 12,
    views: 347,
    upvotes: 89
  },
  {
    id: 'thread-2',
    title: 'Migrating from RSA-2048 to ML-DSA - timeline?',
    content: 'We need to migrate our signing infrastructure from RSA-2048 to ML-DSA. What timeline should we plan?',
    author: {
      id: 'user-2',
      username: 'CryptoGuardian',
      avatar: '🔐',
      knowledgeLevel: 'advanced'
    },
    category: 'question',
    tags: ['ML-DSA', 'Migration', 'Timeline'],
    createdAt: '2026-05-17T14:30:00Z',
    replies: 8,
    views: 256,
    upvotes: 64
  },
  {
    id: 'thread-3',
    title: 'NIST Standardization Timeline Update',
    content: 'Latest updates on FIPS 203, 204, and 205 standardization progress...',
    author: {
      id: 'user-4',
      username: 'SecurityMaven',
      avatar: '🛡️',
      knowledgeLevel: 'expert'
    },
    category: 'news',
    tags: ['NIST', 'Standards', 'PQC'],
    createdAt: '2026-05-16T10:15:00Z',
    replies: 5,
    views: 412,
    upvotes: 128
  },
  {
    id: 'thread-4',
    title: 'Understanding lattice-based cryptography',
    content: 'Can someone explain the mathematical foundations of lattice-based cryptography for beginners?',
    author: {
      id: 'user-3',
      username: 'QuantumExplorer',
      avatar: '🔬',
      knowledgeLevel: 'intermediate'
    },
    category: 'discussion',
    tags: ['Lattice', 'Mathematics', 'Education'],
    createdAt: '2026-05-15T16:45:00Z',
    replies: 6,
    views: 189,
    upvotes: 52
  }
];

export const communityService = {
  async getLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
    return MOCK_LEADERBOARD.slice(0, limit);
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return MOCK_USERS.find(u => u.id === userId) || null;
  },

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    // In a real system, this would query user-specific achievements
    return ACHIEVEMENTS.slice(0, 3);
  },

  async getAchievements(): Promise<UserAchievement[]> {
    return ACHIEVEMENTS;
  },

  async getCommunityThreads(category?: string): Promise<CommunityThread[]> {
    if (category) {
      return MOCK_THREADS.filter(t => t.category === category);
    }
    return MOCK_THREADS;
  },

  async getThreadById(threadId: string): Promise<CommunityThread | null> {
    return MOCK_THREADS.find(t => t.id === threadId) || null;
  },

  async searchThreads(query: string): Promise<CommunityThread[]> {
    const lowerQuery = query.toLowerCase();
    return MOCK_THREADS.filter(t =>
      t.title.toLowerCase().includes(lowerQuery) ||
      t.content.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  },

  async getPopularThreads(limit: number = 5): Promise<CommunityThread[]> {
    return [...MOCK_THREADS]
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  },

  async getTrendingTopics(): Promise<{ tag: string; count: number; }[]> {
    const tagCounts: Record<string, number> = {};
    MOCK_THREADS.forEach(thread => {
      thread.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .slice(0, 10);
  },

  async createThread(title: string, content: string, category: string, author: any): Promise<CommunityThread> {
    const newThread: CommunityThread = {
      id: `thread-${Date.now()}`,
      title,
      content,
      category: category as any,
      author,
      createdAt: new Date().toISOString(),
      replies: 0,
      views: 0,
      upvotes: 0,
      tags: [],
    };
    // Insert at beginning
    MOCK_THREADS = [newThread, ...MOCK_THREADS];
    return newThread;
  },

  async upvoteThread(threadId: string): Promise<CommunityThread | null> {
    const thread = MOCK_THREADS.find(t => t.id === threadId);
    if (thread) {
      thread.upvotes += 1;
      return thread;
    }
    return null;
  },

  async replyToThread(threadId: string, author: any, content: string): Promise<CommunityThread | null> {
    const thread = MOCK_THREADS.find(t => t.id === threadId);
    if (thread) {
      const newReply = {
        id: `reply-${Date.now()}`,
        author,
        content,
        createdAt: new Date().toISOString()
      };
      
      thread.replies += 1;
      if (!thread.replyList) {
        thread.replyList = [];
      }
      thread.replyList.push(newReply);
      return thread;
    }
    return null;
  }
};
