import { Evidence, Rule, ScanFinding } from './types';
import crypto from 'crypto';

export class RuleEngine {
  public createFinding(detectorId: string, rule: Rule, evidence: Evidence, confidence: number): ScanFinding {
    return {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      detector: detectorId,
      title: rule.title,
      description: rule.description,
      severity: rule.severity,
      confidence,
      evidence,
      algorithm: rule.algorithm,
      keySize: rule.keySize,
      currentRisk: rule.currentRisk,
      quantumRisk: rule.quantumRisk,
      recommendation: rule.recommendation,
      references: rule.references,
    };
  }
}
