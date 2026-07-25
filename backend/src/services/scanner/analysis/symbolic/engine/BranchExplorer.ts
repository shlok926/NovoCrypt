import { Constraint } from '../models/Constraint';

export class BranchExplorer {
  public static exploreBranch(
    currentConstraints: readonly Constraint[],
    branchCondition: Constraint
  ): { trueBranchFeasible: boolean; falseBranchFeasible: boolean } {
    return {
      trueBranchFeasible: true,
      falseBranchFeasible: true
    };
  }
}
