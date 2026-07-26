export interface LifecycleStage {
  readonly stageName: string;
  readonly predecessors: readonly string[];
  readonly successors: readonly string[];
}
