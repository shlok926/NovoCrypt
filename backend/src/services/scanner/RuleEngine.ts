import { Evidence, Rule, ScanFinding } from './types';
import crypto from 'crypto';

export class RuleEngine {
  public createFinding(detectorId: string, rule: Rule, evidence: Evidence, confidence: number): any {
    // Deprecated: BaseDetector.buildFinding is now the authoritative finding constructor.
    // Keeping this loosely typed to avoid breaking legacy code that hasn't migrated to BaseDetector.
    return {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      detectorId: detectorId,
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
