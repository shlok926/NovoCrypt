export interface RemediationConfiguration {
  readonly remediationEnabled?: boolean;
  readonly maxFixCandidates?: number;
  readonly validateFixes?: boolean;
  readonly cacheEnabled?: boolean;
  readonly behaviourPreservationAnalysis?: boolean;
  readonly regressionRiskThreshold?: 'Low' | 'Medium' | 'High';
}
