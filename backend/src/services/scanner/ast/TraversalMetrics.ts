export interface TraversalMetrics {
  nodesVisited: number;
  nodesSkipped: number;
  visitorInvocations: number;
  executionTimeMs: number;
  maxDepth: number;
  earlyExit: boolean;
  errorCount: number;
}
