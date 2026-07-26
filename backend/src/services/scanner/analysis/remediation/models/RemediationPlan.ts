import { PatchStrategy } from './PatchStrategy';
import { PatchCandidate } from './PatchCandidate';
import { PatchConflict } from './PatchConflict';
import { PatchConfidence } from './PatchConfidence';
import { RegressionRisk } from './RegressionRisk';

export interface RemediationPlan {
  readonly planId: string;
  readonly strategy: PatchStrategy;
  readonly candidatePatches: readonly PatchCandidate[];
  readonly conflicts: readonly PatchConflict[];
  readonly confidence: PatchConfidence;
  readonly regressionRisk: RegressionRisk;
}
