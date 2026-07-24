export interface RuleExecutionMetrics {
  readonly executionTimeMs: number;
  readonly evaluatedRoutesCount: number;
  readonly findingsCount: number;
  readonly skippedPipelinesCount: number;
}
