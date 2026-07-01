// Types for Compliance Checker, Community & Leaderboard, and QuantumBot Chatbot

// =====================================================
// COMPLIANCE CHECKER TYPES
// =====================================================

export interface ComplianceStandard {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  year: number;
  applicableIndustries: string[];
}

export interface ComplianceGap {
  requirement: string;
  currentState: string;
  requiredState: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  remediationSteps: string[];
}

export interface ComplianceResult {
  standardId: string;
  standardName: string;
  compliant: boolean;
  score: number;
  gaps: ComplianceGap[];
  recommendations: string[];
}

export interface ComplianceCheck {
  id: string;
  organizationName: string;
  currentAlgorithms: string[];
  targetStandards: string[];
  timestamp: string;
  results: ComplianceResult[];
  overallCompliance: number;
}

// =====================================================
// COMMUNITY & LEADERBOARD TYPES
// =====================================================

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

export interface ThreadAuthor {
  id: string;
  username: string;
  avatar: string;
  knowledgeLevel: string;
}

export interface CommunityThread {
  id: string;
  title: string;
  content: string;
  author: ThreadAuthor;
  category: 'discussion' | 'question' | 'guide' | 'news';
  tags: string[];
  createdAt: string;
  replies: number;
  views: number;
  upvotes: number;
  replyList?: {
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      username: string;
      avatar: string;
      knowledgeLevel: string;
    };
  }[];
}

export interface TrendingTopic {
  tag: string;
  count: number;
}

// =====================================================
// QUANTUMBOT CHATBOT TYPES
// =====================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  startedAt: string;
}
