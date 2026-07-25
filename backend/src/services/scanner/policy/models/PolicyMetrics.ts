export interface PolicyMetrics {
  readonly rulesEvaluated: number;
  readonly findingsSuppressed: number;
  readonly overridesApplied: number;
  readonly complianceMappingsAdded: number;
  readonly evaluationTimeMs: number;
  readonly policiesLoaded: number;
}
