export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type ThreatCategory = 'quantum-progress' | 'standards' | 'attack' | 'vulnerability' | 'regulation' | 'trend' | 'positive-news';

export interface ThreatIntelligence {
  id: string;
  title: string;
  description: string;
  source: string;
  severity: Severity;
  category: ThreatCategory;
  date: string;
  affectedAlgorithms: string[];
  recommendation: string | null;
  impact: string | null;
  cveId?: string | null;
  source_url: string;
}

export interface MigrationStep {
  number: number;
  title: string;
  description: string;
  duration: string;
  tasks: string[];
  resources: string[];
  deliverables: string[];
  estimatedCost: number;
  status: 'not-started' | 'in-progress' | 'completed';
}

export interface MigrationPlan {
  id: string;
  organizationSize: 'small' | 'medium' | 'large' | 'enterprise';
  industry: 'finance' | 'healthcare' | 'government' | 'retail' | 'technology' | 'other';
  currentAlgorithms: string[];
  recommendedAlgorithms: string[];
  steps: MigrationStep[];
  timeline: string;
  estimatedCost: {
    total: number;
    perStep: Record<number, number>;
  };
  risks: string[];
  successCriteria: string[];
  createdAt: string;
  completionDate: string;
}

export interface MigrationTemplates {
  organizationSizes: string[];
  industries: string[];
  budgetLevels: string[];
  timelines: string[];
  commonCryptoAlgorithms: string[];
}

export interface CryptoValidation {
  algorithm: string;
  isVulnerable: boolean;
  riskLevel: Severity;
  recommendation: string;
}

export interface ValidationResult {
  vulnerabilities: CryptoValidation[];
  summary: {
    totalAlgorithms: number;
    vulnerableCount: number;
    riskScore: number;
    mitigationUrgency: Severity;
  };
}
