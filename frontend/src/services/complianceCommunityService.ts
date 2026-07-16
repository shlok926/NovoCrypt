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
      console.error('Compliance standards API failed:', error);
      throw error;
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
      console.error('Compliance check API failed:', error);
      throw error;
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
      console.error('Leaderboard API failed:', error);
      throw error;
    }
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await api.get(`${COMMUNITY_API_BASE}/users/${userId}`);
      return response.data.data || null;
    } catch (error) {
      console.error('User profile API failed:', error);
      throw error;
    }
  },

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const response = await api.get(`${COMMUNITY_API_BASE}/users/${userId}/achievements`);
      return response.data.data || [];
    } catch (error) {
      console.error('Achievements API failed:', error);
      throw error;
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
      console.error('Community threads API failed:', error);
      throw error;
    }
  },

  async createThread(title: string, content: string, category?: string): Promise<CommunityThread | null> {
    try {
      const response = await api.post(`${COMMUNITY_API_BASE}/threads/create`, {
        title,
        content,
        category
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create thread:', error);
      throw error;
    }
  },

  async upvoteThread(threadId: string): Promise<CommunityThread | null> {
    try {
      const response = await api.post(`${COMMUNITY_API_BASE}/threads/${threadId}/upvote`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to upvote thread:', error);
      throw error;
    }
  },

  async replyToThread(threadId: string, content: string): Promise<CommunityThread | null> {
    try {
      const response = await api.post(`${COMMUNITY_API_BASE}/threads/${threadId}/reply`, {
        content
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to reply to thread:', error);
      throw error;
    }
  },

  async getPopularThreads(limit: number = 5): Promise<CommunityThread[]> {
    try {
      const response = await api.get(`${COMMUNITY_API_BASE}/threads-popular?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Popular threads API failed:', error);
      throw error;
    }
  },

  async getTrendingTopics(): Promise<TrendingTopic[]> {
    try {
      const response = await api.get(`${COMMUNITY_API_BASE}/trending`);
      return response.data.data || [];
    } catch (error) {
      console.error('Trending topics API failed:', error);
      throw error;
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
      console.error('Chatbot API failed:', error);
      throw error;
    }
  },

  async getSuggestions(): Promise<string[]> {
    try {
      const response = await api.get(`${CHATBOT_API_BASE}/suggestions`);
      return response.data.data || [];
    } catch (error) {
      console.error('Chatbot suggestions API failed:', error);
      throw error;
    }
  }
};
