import { ConstraintSet } from '../models/ConstraintSet';

export class SymbolicTaint {
  public static isTainted(
    varName: string,
    taintedVars: ReadonlySet<string>,
    constraints: ConstraintSet
  ): boolean {
    if (!taintedVars.has(varName)) {
      return false;
    }

    for (const c of constraints.constraints) {
      const leftName = (c.expression.left as any).name || '';
      if (leftName === varName && c.expression.operator === '==' && c.expression.right === true) {
        return false;
      }
    }

    return true;
  }
}
