export interface FunctionSummary {
  readonly id: string;
  readonly parameters: readonly string[];
  readonly returnTainted: boolean;
  readonly taintSources: readonly string[];
  readonly taintSinks: readonly string[];
  readonly sideEffects: readonly string[];
  readonly objectMutations: readonly string[];
  readonly calls: readonly string[];
  readonly pathConstraints: readonly string[];
}
