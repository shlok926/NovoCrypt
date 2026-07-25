import { ConstraintSet } from '../models/ConstraintSet';
import { SolverResult } from '../models/SolverResult';
import { SolverAdapter, MockSolverAdapter } from './SolverAdapter';
import { ConstraintCache } from '../cache/ConstraintCache';

export class ConstraintSolver {
  private adapter: SolverAdapter = new MockSolverAdapter();
  private cache = new ConstraintCache();

  public solveConstraints(constraints: ConstraintSet): SolverResult {
    const key = constraints.constraints
      .map(c => `${(c.expression.left as any).name || ''}:${c.expression.operator}:${c.expression.right}:${c.negate}`)
      .join(' && ');

    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const result = this.adapter.solve(constraints);
    this.cache.set(key, result);
    return result;
  }

  public getCache(): ConstraintCache {
    return this.cache;
  }
}
