import { api } from '@/lib/api';
import {
  ThreatIntelligence,
  MigrationPlan,
  MigrationTemplates,
  ValidationResult
} from '@/types/threat-migration.types';

const THREAT_API_BASE = '/threats';
const MIGRATION_API_BASE = '/migration';

// No mock threats

// Threat Intelligence Service
export const threatService = {
  async getAllThreats(filters?: {
    severity?: string;
    category?: string;
    limit?: number;
  }): Promise<ThreatIntelligence[]> {
    try {
      // Try the existing threat feed endpoint first
      const [feedResponse, liveResponse] = await Promise.allSettled([
        api.get(`${THREAT_API_BASE}/feed?page=1&limit=${filters?.limit || 50}`),
        api.get(`${THREAT_API_BASE}/live`)
      ]);
      
      let threats: ThreatIntelligence[] = [];

      // Add Live RSS News first
      if (liveResponse.status === 'fulfilled' && liveResponse.value.data.data) {
        const liveItems = liveResponse.value.data.data.map((item: any) => ({
          id: item.id || `live-${Math.random()}`,
          title: item.title,
          description: item.summary || item.description || 'No description available',
          source: item.source,
          severity: item.severity,
          category: item.category,
          date: item.publishedAt || item.date,
          affectedAlgorithms: item.affectedAlgorithms || ['Unknown'],
          recommendation: item.recommendation || 'Monitor for updates',
          impact: item.impact || 'Unknown impact',
          source_url: item.url || item.source_url || '#'
        }));
        threats = [...threats, ...liveItems];
      }

      // Add Database Feed items
      if (feedResponse.status === 'fulfilled' && feedResponse.value.data.data && Array.isArray(feedResponse.value.data.data.items)) {
        const feedItems = feedResponse.value.data.data.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.summary || item.description || 'No description available',
          source: item.source,
          severity: item.severity,
          category: item.category,
          date: item.publishedAt || item.date,
          affectedAlgorithms: item.affectedAlgorithms || ['RSA', 'ECDSA'],
          recommendation: item.recommendation || 'Monitor for updates',
          impact: item.impact || 'Unknown impact',
          source_url: item.url || item.source_url || '#'
        }));
        threats = [...threats, ...feedItems];
      }

      if (threats.length > 0) {
        // Apply filters
        if (filters?.severity) {
          threats = threats.filter((t: ThreatIntelligence) => t.severity === filters.severity);
        }
        if (filters?.category) {
          threats = threats.filter((t: ThreatIntelligence) => t.category === filters.category);
        }

        return threats.slice(0, filters?.limit || 50);
      }
      return [];
    } catch (error) {
      console.error('Threat API failed:', error);
      throw error;
    }
  },

  async getThreatById(id: string): Promise<ThreatIntelligence | null> {
    try {
      const response = await api.get(`${THREAT_API_BASE}/${id}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Threat API failed:', error);
      throw error;
    }
  },

  async getThreatStatistics(): Promise<any> {
    try {
      const response = await api.get(`${THREAT_API_BASE}/stats`);
      const data = response.data.data || response.data;
      
      return {
        totalThreats: data.totalThreats || 0,
        bySeverity: data.bySeverity || { critical: 0, high: 0, medium: 0, low: 0 },
        byCategory: data.byCategory || {},
        lastUpdated: data.lastUpdated || new Date().toISOString()
      };
    } catch (error) {
      console.error('Threat stats API failed:', error);
      throw error;
    }
  },

  async searchThreats(query: string): Promise<ThreatIntelligence[]> {
    try {
      const response = await api.get(`${THREAT_API_BASE}/search?q=${encodeURIComponent(query)}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Threat search API failed:', error);
      throw error;
    }
  }
};

// Migration Planner Service
export const migrationService = {
  async generateMigrationPlan(input: {
    organizationSize: string;
    industry: string;
    currentCrypto: string[];
    budget?: string;
    timeline?: string;
  }): Promise<MigrationPlan | null> {
    try {
      const response = await api.post(`${MIGRATION_API_BASE}/plan`, {
        organizationSize: input.organizationSize,
        industry: input.industry,
        currentCrypto: input.currentCrypto,
        budget: input.budget || 'medium',
        timeline: input.timeline || 'standard'
      });
      return response.data.data || null;
    } catch (error) {
      console.warn('Migration plan API unavailable, generating mock migration plan');
      
      // Determine recommended algorithms based on industry
      let recommendedAlgos: string[] = [];
      if (['finance', 'healthcare', 'government'].includes(input.industry)) {
        recommendedAlgos = ['ML-KEM', 'ML-DSA', 'SLH-DSA'];
      } else {
        recommendedAlgos = ['ML-KEM', 'ML-DSA'];
      }
      
      // Generate realistic migration plan based on organization size and budget
      const timelineMultiplier = input.timeline === 'urgent' ? 0.7 : input.timeline === 'flexible' ? 1.5 : 1;
      const budgetMultiplier = input.budget === 'low' ? 0.6 : input.budget === 'high' ? 2 : 1;
      
      const baseCost = input.organizationSize === 'small' ? 50000 : 
                       input.organizationSize === 'medium' ? 200000 : 
                       input.organizationSize === 'large' ? 800000 : 2000000;
      
      const step1Cost = Math.round(baseCost * 0.1 * budgetMultiplier);
      const step2Cost = Math.round(baseCost * 0.2 * budgetMultiplier);
      const step3Cost = Math.round(baseCost * 0.5 * budgetMultiplier);
      const step4Cost = Math.round(baseCost * 0.15 * budgetMultiplier);
      const step5Cost = Math.round(baseCost * 0.05 * budgetMultiplier);
      const totalCost = step1Cost + step2Cost + step3Cost + step4Cost + step5Cost;
      
      const startDate = new Date();
      const monthsToAdd = Math.round(16 * timelineMultiplier);
      const completionDate = new Date(startDate);
      completionDate.setMonth(completionDate.getMonth() + monthsToAdd);
      
      return {
        id: `plan-${Date.now()}`,
        organizationSize: input.organizationSize as 'small' | 'medium' | 'large' | 'enterprise',
        industry: input.industry as 'finance' | 'healthcare' | 'government' | 'retail' | 'technology' | 'other',
        recommendedAlgorithms: recommendedAlgos,
        currentAlgorithms: input.currentCrypto,
        timeline: `${Math.round(12 * timelineMultiplier)}-${Math.round(18 * timelineMultiplier)} months`,
        estimatedCost: {
          total: totalCost,
          perStep: {
            1: step1Cost,
            2: step2Cost,
            3: step3Cost,
            4: step4Cost,
            5: step5Cost
          }
        },
        risks: [
          'Compatibility issues with legacy systems',
          'Vendor dependency on quantum-safe library updates',
          'Performance overhead from larger key sizes',
          'Training and skills gaps in quantum cryptography',
          'Regulatory compliance during transition'
        ],
        successCriteria: [
          'All cryptographic keys migrated to quantum-safe algorithms',
          'Legacy systems updated or decommissioned',
          'Zero reported cryptographic vulnerabilities',
          'Team certified in quantum-safe cryptography',
          'Audit validation of migration completion'
        ],
        steps: [
          {
            number: 1,
            title: 'Cryptographic Inventory & Assessment',
            description: 'Conduct comprehensive audit of all cryptographic implementations and identify quantum-vulnerable algorithms',
            duration: `${Math.round(1 * timelineMultiplier)} months`,
            tasks: [
              'Scan all systems for current cryptographic usage',
              'Document encryption algorithms and key sizes',
              'Identify legacy systems and dependencies',
              'Evaluate replacement options'
            ],
            resources: ['Security audit team', 'Cryptography experts', 'Scanning tools'],
            deliverables: ['Cryptographic inventory report', 'Risk assessment', 'Gap analysis'],
            estimatedCost: step1Cost,
            status: 'not-started'
          },
          {
            number: 2,
            title: 'Quantum-Safe Library & Tool Implementation',
            description: 'Procure and test quantum-safe cryptographic libraries and development tools',
            duration: `${Math.round(2 * timelineMultiplier)} months`,
            tasks: [
              'Evaluate quantum-safe library options',
              'Set up development environment',
              'Create code migration templates',
              'Conduct proof-of-concept testing'
            ],
            resources: ['Development team', 'Security consultants', 'Test infrastructure'],
            deliverables: ['Selected libraries', 'Integration guide', 'POC results'],
            estimatedCost: step2Cost,
            status: 'not-started'
          },
          {
            number: 3,
            title: 'Code Migration & Refactoring',
            description: 'Systematically migrate all code to use quantum-safe cryptographic algorithms',
            duration: `${Math.round(6 * timelineMultiplier)} months`,
            tasks: [
              'Migrate authentication systems',
              'Update encryption implementations',
              'Refactor key management',
              'Update certificate handling'
            ],
            resources: ['Development team (expanded)', 'Code review board', 'Automation tools'],
            deliverables: ['Migrated codebase', 'Updated documentation', 'Code reviews completed'],
            estimatedCost: step3Cost,
            status: 'not-started'
          },
          {
            number: 4,
            title: 'Testing, Validation & Compliance',
            description: 'Comprehensive testing to ensure functionality, performance, and regulatory compliance',
            duration: `${Math.round(4 * timelineMultiplier)} months`,
            tasks: [
              'Functional testing with quantum-safe algorithms',
              'Performance benchmarking',
              'Security penetration testing',
              'Compliance validation (NIST, FIPS 203-205)'
            ],
            resources: ['QA team', 'Security testers', 'Compliance officers'],
            deliverables: ['Test reports', 'Performance analysis', 'Compliance certification'],
            estimatedCost: step4Cost,
            status: 'not-started'
          },
          {
            number: 5,
            title: 'Deployment, Training & Operations',
            description: 'Roll out quantum-safe systems to production and train teams for ongoing operations',
            duration: `${Math.round(3 * timelineMultiplier)} months`,
            tasks: [
              'Phased production deployment',
              'Staff training programs',
              'Incident response procedures',
              'Post-deployment monitoring'
            ],
            resources: ['DevOps team', 'Training team', 'Operations staff'],
            deliverables: ['Deployed systems', 'Training materials', 'Operations guide'],
            estimatedCost: step5Cost,
            status: 'not-started'
          }
        ],
        createdAt: new Date().toISOString(),
        completionDate: completionDate.toISOString().split('T')[0]
      };
    }
  },

  async getMigrationTemplates(): Promise<MigrationTemplates | null> {
    try {
      const response = await api.get(`${MIGRATION_API_BASE}/templates`);
      return response.data.data || null;
    } catch (error) {
      console.warn('Migration templates API unavailable, using default templates');
      
      // Return default templates
      return {
        organizationSizes: ['small', 'medium', 'large', 'enterprise'],
        industries: ['finance', 'healthcare', 'government', 'retail', 'technology', 'other'],
        budgetLevels: ['low', 'medium', 'high'],
        timelines: ['urgent', 'standard', 'flexible'],
        commonCryptoAlgorithms: [
          'RSA-2048',
          'RSA-4096',
          'ECDSA',
          'SHA-1',
          'SHA-256',
          'AES-128',
          'AES-256',
          'DES',
          'MD5'
        ]
      };
    }
  },

  async validateCryptoSetup(algorithms: string[]): Promise<ValidationResult | null> {
    try {
      const response = await api.post(`${MIGRATION_API_BASE}/validate`, {
        algorithms
      });
      return response.data.data || null;
    } catch (error) {
      console.error('Error validating crypto setup:', error);
      return null;
    }
  }
};

