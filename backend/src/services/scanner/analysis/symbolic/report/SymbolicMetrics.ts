export interface SymbolicMetrics {
  readonly symbolicStatesExplored: number;
  readonly constraintsGenerated: number;
  readonly constraintsSolved: number;
  readonly infeasiblePathsPruned: number;
  readonly mergedStates: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly loopSummaries: number;
  readonly averagePathDepth: number;
  readonly satCount: number;
  readonly unsatCount: number;
  readonly unknownCount: number;
  readonly executionTimeMs: number;
}
