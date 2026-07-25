export interface SolverResult {
  readonly status: 'sat' | 'unsat' | 'unknown';
  readonly model?: ReadonlyMap<string, any>;
}
