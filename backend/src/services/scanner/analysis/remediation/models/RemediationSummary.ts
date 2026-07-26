import { RemediationPlan } from './RemediationPlan';

export interface RemediationSummary {
  readonly plans: readonly RemediationPlan[];
  readonly averageConfidenceScore: number;
  readonly highestRiskCount: number;
}
