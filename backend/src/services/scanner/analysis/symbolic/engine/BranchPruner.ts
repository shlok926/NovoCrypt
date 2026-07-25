import { ConstraintSet } from '../models/ConstraintSet';
import { ConstraintSolver } from './ConstraintSolver';

export class BranchPruner {
  public static shouldPrune(
    constraints: ConstraintSet,
    solver: ConstraintSolver
  ): boolean {
    const res = solver.solveConstraints(constraints);
    return res.status === 'unsat';
  }
}
