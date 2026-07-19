export type TargetType = 'code' | 'url' | 'config' | 'archive';

export interface ScanContext {
  targetType: TargetType;
  target: string; // The code content, URL, or filepath
  fileName?: string;
  language?: string;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Evidence {
  file?: string;
  line?: number;
  snippet: string;
  matchedPattern: string;
  language?: string;
}

export interface Rule {
  id: string; // e.g., 'RULE_RSA_001'
  title: string;
  description: string;
  severity: Severity;
  algorithm?: string;
  keySize?: number;
  currentRisk: string;
  quantumRisk: string;
  recommendation: string;
  references: string[];
}

export interface ScanFinding {
  id: string; // uuid
  ruleId: string;
  detector: string;
  title: string;
  description: string;
  severity: Severity;
  confidence: number; // 0-100%
  evidence: Evidence;
  algorithm?: string;
  keySize?: number;
  currentRisk: string;
  quantumRisk: string;
  recommendation: string;
  references: string[];
}

export interface DetectorMetadata {
  version: string;
  author: string;
  ruleVersion: string;
  category: string;
  documentationUrl: string;
}

export interface CryptoDetector {
  id: string;
  name: string;
  metadata: DetectorMetadata;
  supportedTargets: TargetType[];
  detect(context: ScanContext): Promise<ScanFinding[]>;
}

export interface ScanMetrics {
  totalFindings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface ScanResultData {
  findings: ScanFinding[];
  metrics: ScanMetrics;
  overallRiskScore: number; // 0-100
  quantumReadinessScore: number; // 0-100
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  criticalFindings: ScanFinding[];
  topRecommendations: string[];
  algorithmsFound: string[];
}
