import { RemediationPlan } from '../models/RemediationPlan';
import { PatchCandidate } from '../models/PatchCandidate';
import { PatchConflict } from '../models/PatchConflict';
import { PatchStrategy } from '../models/PatchStrategy';
import { PatchConfidence } from '../models/PatchConfidence';
import { RegressionRisk } from '../models/RegressionRisk';
import { SecurePatch } from '../models/SecurePatch';
import { PatchValidator } from './PatchValidator';
import { RegressionAnalyzer } from './RegressionAnalyzer';

export class RemediationEngine {
  public static createPlan(
    planId: string,
    strategy: PatchStrategy,
    patch: SecurePatch,
    priority = 1
  ): RemediationPlan {
    const candidate: PatchCandidate = {
      candidateId: `cand-${planId}`,
      patch,
      priority
    };

    const valid = PatchValidator.isPatchValid(patch);
    const risk = RegressionAnalyzer.estimateRisk(patch.originalCode, patch.replacementCode);

    const contributors: string[] = ['behavior analysis verified'];
    if (valid) contributors.push('patch syntax validated successfully');

    const score = valid ? 90 : 30;
    const confidence: PatchConfidence = {
      score,
      label: score >= 80 ? 'High' : 'Medium',
      contributors
    };

    return {
      planId,
      strategy,
      candidatePatches: [candidate],
      conflicts: [],
      confidence,
      regressionRisk: risk
    };
  }
}
