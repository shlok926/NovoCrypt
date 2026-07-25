export interface SymbolicConfiguration {
  readonly maxSymbolicStates?: number;
  readonly maxRecursion?: number;
  readonly maxLoopIterations?: number;
  readonly constraintSolvingTimeoutMs?: number;
  readonly branchPruningEnabled?: boolean;
  readonly symbolicHeapEnabled?: boolean;
  readonly stateMergingEnabled?: boolean;
  readonly solverBackend?: string;
  readonly cacheEnabled?: boolean;
}
