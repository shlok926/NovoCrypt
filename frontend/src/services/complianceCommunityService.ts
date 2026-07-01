// Frontend services for Compliance Checker, Community, and QuantumBot

import { api } from '@/lib/api';
import type {
  ComplianceCheck,
  ComplianceStandard,
  LeaderboardEntry,
  UserProfile,
  UserAchievement,
  CommunityThread,
  TrendingTopic,
  ChatMessage
} from '@/types/compliance-community-chatbot.types';

const COMPLIANCE_API_BASE = '/compliance';
const COMMUNITY_API_BASE = '/community';
const CHATBOT_API_BASE = '/chatbot';

// =====================================================
// COMPLIANCE CHECKER SERVICE
// =====================================================

export const complianceService = {
  async getStandards(): Promise<ComplianceStandard[]> {
    try {
      const response = await api.get(`${COMPLIANCE_API_BASE}/standards`);
      return response.data.data || [];
    } catch (error) {
      console.warn('Compliance standards API unavailable, using default standards');
      return [
        { id: 'nist-800-175b', name: 'NIST SP 800-175B', description: 'Federal Cryptographic Standards', requirements: [], year: 2019, applicableIndustries: ['government', 'finance'] },
        { id: 'fips-203', name: 'FIPS 203 (ML-KEM)', description: 'Post-Quantum Key Encapsulation', requirements: [], year: 2024, applicableIndustries: ['all'] },
        { id: 'fips-204', name: 'FIPS 204 (ML-DSA)', description: 'Post-Quantum Signatures', requirements: [], year: 2024, applicableIndustries: ['all'] },
        { id: 'fips-205', name: 'FIPS 205 (SLH-DSA)', description: 'Hash-Based Signatures', requirements: [], year: 2024, applicableIndustries: ['all'] }
      ];
    }
  },

  async checkCompliance(input: {
    organizationName: string;
    currentAlgorithms: string[];
    targetStandards: string[];
    industry?: string;
  }): Promise<ComplianceCheck | null> {
    try {
      const response = await api.post(`${COMPLIANCE_API_BASE}/check`, input);
      return response.data.data || null;
    } catch (error) {
      console.warn('Compliance check API unavailable, using mock data');
      // Return mock compliance check
      return {
        id: `compliance-${Date.now()}`,
        organizationName: input.organizationName,
        currentAlgorithms: input.currentAlgorithms,
        targetStandards: input.targetStandards,
        timestamp: new Date().toISOString(),
        results: input.targetStandards.map(std => ({
          standardId: std,
          standardName: std.toUpperCase(),
          compliant: false,
          score: 45,
          gaps: input.currentAlgorithms.includes('SHA-1') || input.currentAlgorithms.includes('MD5')
            ? [{
                requirement: 'Use approved cryptographic algorithms',
                currentState: `Using deprecated algorithms`,
                requiredState: 'Use NIST-approved algorithms',
                severity: 'critical' as const,
                remediationSteps: ['Replace deprecated algorithms', 'Update dependencies', 'Test thoroughly']
              }]
            : [],
          recommendations: ['Implement ML-KEM for key establishment', 'Use ML-DSA for signatures', 'Plan quantum-safe migration']
        })),
        overallCompliance: 45
      };
    }
  }
};

// =====================================================
// COMMUNITY SERVICE
// =====================================================

export const communityService = {
  async getLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
    try {
      const response = await api.get(`${COMMUNITY_API_BASE}/leaderboard?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.warn('Leaderboard API unavailable, using mock data');
      return [
        { rank: 1, userId: 'user-1', username: 'QuantumVanguard', avatar: '👩‍💻', score: 4850, completedAssessments: 28, migrationsInitiated: 6, achievements: 6, lastActive: '2 hours ago' },
        { rank: 2, userId: 'user-4', username: 'SecurityMaven', avatar: '🛡️', score: 4620, completedAssessments: 25, migrationsInitiated: 5, achievements: 5, lastActive: '4 hours ago' },
        { rank: 3, userId: 'user-2', username: 'CryptoGuardian', avatar: '🔐', score: 4320, completedAssessments: 22, migrationsInitiated: 4, achievements: 5, lastActive: '1 hour ago' }
      ];
    }
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await api.get(`${COMMUNITY_API_BASE}/users/${userId}`);
      return response.data.data || null;
    } catch (error) {
      console.warn('User profile API unavailable');
      return null;
    }
  },

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const response = await api.get(`${COMMUNITY_API_BASE}/users/${userId}/achievements`);
      return response.data.data || [];
    } catch (error) {
      console.warn('Achievements API unavailable, using mock data');
      return [
        { id: 'ach-1', name: 'Quantum Rookie', description: 'Complete your first assessment', icon: '🌱', rarity: 'common' },
        { id: 'ach-2', name: 'Algorithm Master', description: 'Learn all major PQC algorithms', icon: '🧠', rarity: 'uncommon' }
      ];
    }
  },

  async getThreads(category?: string): Promise<CommunityThread[]> {
    try {
      const url = category 
        ? `${COMMUNITY_API_BASE}/threads?category=${category}`
        : `${COMMUNITY_API_BASE}/threads`;
      const response = await api.get(url);
      return response.data.data || [];
    } catch (error) {
      console.warn('Community threads API unavailable, using mock data');
      return [
        {
          id: 'thread-1',
          title: 'Best practices for ML-KEM integration',
          content: 'What are the recommended best practices when integrating ML-KEM?',
          author: { id: 'user-1', username: 'QuantumVanguard', avatar: '👩‍💻', knowledgeLevel: 'expert' },
          category: 'guide',
          tags: ['ML-KEM', 'Integration', 'Best Practices'],
          createdAt: '2026-05-18T08:00:00Z',
          replies: 12,
          views: 347,
          upvotes: 89
        }
      ];
    }
  },

  async createThread(title: string, content: string, category: string): Promise<CommunityThread | null> {
    try {
      // Mock user author for now until full auth is wired in the frontend state
      const author = {
        id: 'user-current',
        username: 'You',
        avatar: '👤',
        knowledgeLevel: 'intermediate'
      };
      
      const response = await api.post(`${COMMUNITY_API_BASE}/threads/create`, {
        title,
        content,
        category,
        author
      });
      return response.data.data;
    } catch (error) {
      console.warn('Failed to create thread', error);
      return null;
    }
  },

  async upvoteThread(threadId: string): Promise<CommunityThread | null> {
    try {
      const response = await api.post(`${COMMUNITY_API_BASE}/threads/${threadId}/upvote`);
      return response.data.data;
    } catch (error) {
      console.warn('Failed to upvote thread', error);
      return null;
    }
  },

  async getPopularThreads(limit: number = 5): Promise<CommunityThread[]> {
    try {
      const response = await api.get(`${COMMUNITY_API_BASE}/threads-popular?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.warn('Popular threads API unavailable');
      return [];
    }
  },

  async getTrendingTopics(): Promise<TrendingTopic[]> {
    try {
      const response = await api.get(`${COMMUNITY_API_BASE}/trending`);
      return response.data.data || [];
    } catch (error) {
      console.warn('Trending topics API unavailable, using default');
      return [
        { tag: 'ML-KEM', count: 24 },
        { tag: 'Migration', count: 18 },
        { tag: 'NIST', count: 15 },
        { tag: 'Quantum', count: 42 }
      ];
    }
  }
};

// =====================================================
// CHATBOT SERVICE
// =====================================================

export const chatbotService = {
  async sendMessage(message: string): Promise<ChatMessage | null> {
    try {
      const response = await api.post(`${CHATBOT_API_BASE}/message`, { message });
      return response.data.data || null;
    } catch (error) {
      console.warn('Chatbot API unavailable');
      return null;
    }
  },

  async getSuggestions(): Promise<string[]> {
    try {
      const response = await api.get(`${CHATBOT_API_BASE}/suggestions`);
      return response.data.data || [];
    } catch (error) {
      console.warn('Chatbot suggestions API unavailable, using defaults');
      return [
        'What is ML-KEM and why should I care?',
        'How do I migrate from RSA to post-quantum?',
        'What are the NIST standards for quantum-safe crypto?',
        'Is my current encryption vulnerable to quantum attacks?'
      ];
    }
  }
};
