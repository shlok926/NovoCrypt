import { ConstraintSet } from '../models/ConstraintSet';
import { SolverResult } from '../models/SolverResult';

export interface SolverAdapter {
  solve(constraints: ConstraintSet): SolverResult;
}
export class MockSolverAdapter implements SolverAdapter {
  public solve(constraints: ConstraintSet): SolverResult {
    let contradictory = false;

    // Check for contradictory constraints like "x > 5" and "x < 5"
    for (const c of constraints.constraints) {
      const leftName = (c.expression.left as any).name || '';
      const op = c.expression.operator;
      const right = c.expression.right;

      // Simplistic contradictory checks
      if (leftName === 'x' && op === '<' && right === 5) {
        // If there's another constraint saying x is greater than 10
        const hasGreater = constraints.constraints.some(other => {
          const otherLeft = (other.expression.left as any).name || '';
          return otherLeft === 'x' && other.expression.operator === '>' && (other.expression.right as number) >= 5;
        });
        if (hasGreater) {
          contradictory = true;
          break;
        }
      }
    }

    if (contradictory) {
      return { status: 'unsat' };
    }
    return { status: 'sat', model: new Map() };
  }
}
