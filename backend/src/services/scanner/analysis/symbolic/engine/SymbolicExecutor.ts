import { NovoNode } from '../../../ast/NovoNode';
import { SymbolicState } from '../models/SymbolicState';
import { ConstraintBuilder } from './ConstraintBuilder';

export class SymbolicExecutor {
  public static executeNode(
    node: NovoNode,
    state: SymbolicState
  ): SymbolicState {
    const constraint = ConstraintBuilder.buildFromNode(node);
    if (constraint) {
      const nextConstraints = [...state.constraints.constraints, constraint];
      const nextSteps = [...state.trace.steps, `add_constraint:${node.type}`];

      return {
        ...state,
        constraints: {
          constraints: nextConstraints
        },
        trace: {
          traceId: state.trace.traceId,
          steps: nextSteps
        }
      };
    }
    return state;
  }
}
