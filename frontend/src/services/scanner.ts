import { api } from '../lib/api';

export interface ScanResult {
  id?: string;
  findings: ScanFinding[];
  metrics: {
    totalFindings: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  overallRiskScore: number;
  quantumReadinessScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  algorithmsFound: string[];
  topRecommendations: string[];
}

export interface ScanFinding {
  id: string;
  ruleId: string;
  detector: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: number;
  evidence: {
    file?: string;
    line?: number;
    snippet: string;
    matchedPattern: string;
    language?: string;
  };
  algorithm?: string;
  currentRisk: string;
  quantumRisk: string;
  recommendation: string;
}

export const scannerApi = {
  scanCode(code: string, fileName?: string): Promise<{ data: ScanResult }> {
    return api.post('/scanner/code', { code, fileName }).then(res => res.data);
  },
  scanUrl(domain: string): Promise<{ data: ScanResult }> {
    return api.post('/scanner/ssl', { domain }).then(res => res.data);
  },
  getHistory(limit = 20): Promise<{ data: any[] }> {
    return api.get(`/scanner/history?limit=${limit}`).then(res => res.data);
  }
};
