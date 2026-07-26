export interface RemediationMetrics {
  readonly remediationPlansGenerated: number;
  readonly securePatchesGenerated: number;
  readonly patchValidationSuccessRate: number;
  readonly frameworkAwareFixesGenerated: number;
  readonly secureApiRecommendations: number;
  readonly regressionAnalysesPerformed: number;
  readonly behaviourPreservationChecks: number;
  readonly patchConflictsDetected: number;
  readonly dependencyChainsResolved: number;
  readonly remediationCacheHits: number;
  readonly executionTimeMs: number;
}
