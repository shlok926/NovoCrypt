export interface ExecutionState {
  readonly currentFunction: string;
  readonly currentBlock: string;
  readonly symbolicVariables: readonly string[];
  readonly pathHistory: readonly string[];
  readonly callStack: readonly string[];
  readonly recursionDepth: number;
}
