export interface FlowMetrics {
  readonly functionsAnalysed: number;
  readonly summariesCreated: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly contextsAnalysed: number;
  readonly aliasesDetected: number;
  readonly taintPropagations: number;
  readonly pathsExplored: number;
  readonly precisionImprovements: number;
  readonly executionTimeMs: number;
  readonly recursionDepthMax: number;
}
