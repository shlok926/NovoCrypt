import { performance } from 'perf_hooks';
import { SymbolicConfiguration } from './SymbolicConfiguration';
import { SymbolicMetrics } from './report/SymbolicMetrics';
import { SymbolicState } from './models/SymbolicState';
import { ConstraintSet } from './models/ConstraintSet';
import { SolverResult } from './models/SolverResult';
import { ConstraintSolver } from './engine/ConstraintSolver';
import { StateMerger } from './engine/StateMerger';
import { BranchPruner } from './engine/BranchPruner';
import { SymbolicTaint } from './engine/SymbolicTaint';
import { SymbolicExecutor } from './engine/SymbolicExecutor';

export class SymbolicEngine {
  private solver = new ConstraintSolver();

  constructor(private config: SymbolicConfiguration = {}) {}

  public getSolver(): ConstraintSolver {
    return this.solver;
  }

  public executeSymbolically(node: any, state: SymbolicState): SymbolicState {
    return SymbolicExecutor.executeNode(node, state);
  }

  public solveConstraints(constraints: ConstraintSet): SolverResult {
    return this.solver.solveConstraints(constraints);
  }

  public mergeStates(s1: SymbolicState, s2: SymbolicState): SymbolicState | undefined {
    return StateMerger.merge(s1, s2);
  }

  public explorePaths(state: SymbolicState): { feasible: boolean } {
    const prune = BranchPruner.shouldPrune(state.constraints, this.solver);
    return { feasible: !prune };
  }

  public analyseSymbolicTaint(
    varName: string,
    taintedVars: ReadonlySet<string>,
    constraints: ConstraintSet
  ): boolean {
    return SymbolicTaint.isTainted(varName, taintedVars, constraints);
  }

  public async analyseSymbolically(
    nodes: any[],
    initialState: SymbolicState
  ): Promise<{ finalState: SymbolicState; metrics: SymbolicMetrics }> {
    const start = performance.now();
    let currentState = initialState;
    let constraintsSolved = 0;
    let infeasiblePathsPruned = 0;

    for (const node of nodes) {
      currentState = this.executeSymbolically(node, currentState);
      
      if (this.config.branchPruningEnabled) {
        const feasible = this.explorePaths(currentState).feasible;
        constraintsSolved++;
        if (!feasible) {
          infeasiblePathsPruned++;
        }
      }
    }

    const elapsed = performance.now() - start;

    const metrics: SymbolicMetrics = {
      symbolicStatesExplored: nodes.length,
      constraintsGenerated: currentState.constraints.constraints.length,
      constraintsSolved,
      infeasiblePathsPruned,
      mergedStates: 0,
      cacheHits: 0,
      cacheMisses: constraintsSolved,
      loopSummaries: 0,
      averagePathDepth: currentState.trace.steps.length,
      satCount: constraintsSolved - infeasiblePathsPruned,
      unsatCount: infeasiblePathsPruned,
      unknownCount: 0,
      executionTimeMs: elapsed
    };

    return {
      finalState: currentState,
      metrics
    };
  }
}
