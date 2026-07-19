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
  column?: number;
  snippet: string;
  matchedPattern: string;
  language?: string;
  qualityScore: number;
}

export interface ConfidenceExplanation {
  level: 'Critical' | 'High' | 'Medium' | 'Low';
  reason: string;
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
  detectorId: string;
  detectorVersion: string;
  title: string;
  description: string;
  category: string;
  severity: Severity;
  confidence: number; // 0-100%
  confidenceExplanation: ConfidenceExplanation;
  evidence: Evidence;
  algorithm?: string;
  keySize?: number;
  currentRisk: string;
  quantumRisk: string;
  recommendation: string;
  references: string[];
  fingerprint: string;
  timestamp: string;
}

export interface DetectorHealth {
  status: 'healthy' | 'degraded' | 'failed';
  errorCount: number;
  lastError?: string;
  averageRuntimeMs: number;
}

export interface DetectorMetadata {
  version: string;
  author: string;
  ruleVersion: string;
  category: string;
  documentationUrl: string;
  supportedLanguages: string[];
  supportedExtensions: string[];
}

export interface CryptoDetector {
  id: string;
  name: string;
  version: string;
  category: string;
  supportedLanguages: string[];
  supportedExtensions: string[];
  metadata: DetectorMetadata;
  supportedTargets: TargetType[];
  detect(context: ScanContext): Promise<ScanFinding[]>;
  health(): DetectorHealth;
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
