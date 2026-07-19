import { api } from '../lib/api';

export interface ThreatRule {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  severity: string;
  priority: number;
}

export interface ThreatMatch {
  id: string;
  correlationId: string;
  algorithm: string;
  algorithmFamily: string;
  threatSource: string;
  confidence: number;
  severity: string;
  impact: string;
  affectedComponent: string;
  rule?: ThreatRule;
}

export interface ThreatRecommendation {
  id: string;
  correlationId: string;
  recommendationType: string;
  priority: number;
  title: string;
  description: string;
  estimatedEffort: string;
  estimatedRiskReduction: number;
}

export interface ThreatCorrelation {
  id: string;
  assetId: string;
  status: string;
  overallSeverity: string;
  overallPriority: number;
  overallConfidence: number;
  correlatedAt: string;
  matches: ThreatMatch[];
  recommendations: ThreatRecommendation[];
}

export const correlationApi = {
  listCorrelations(limit = 50): Promise<{ data: ThreatCorrelation[] }> {
    return api.get(`/correlations?limit=${limit}`).then(res => res.data);
  },
  getAssetCorrelations(assetId: string, limit = 20): Promise<{ data: ThreatCorrelation[] }> {
    return api.get(`/correlations/asset/${assetId}?limit=${limit}`).then(res => res.data);
  }
};
