export interface AdvisorMetrics {
  readonly explanationsGenerated: number;
  readonly reasoningTracesGenerated: number;
  readonly evidenceLinksCreated: number;
  readonly recommendationsGenerated: number;
  readonly recommendationConflictsDetected: number;
  readonly knowledgeReferencesResolved: number;
  readonly developerGuidanceGenerated: number;
  readonly explanationCacheHits: number;
  readonly explanationCacheMisses: number;
  readonly recommendationCacheHits: number;
  readonly recommendationCacheMisses: number;
  readonly averageExplanationGenerationTimeMs: number;
  readonly executionTimeMs: number;
}
