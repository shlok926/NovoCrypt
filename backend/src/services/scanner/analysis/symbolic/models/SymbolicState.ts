import { SymbolicMemory } from './SymbolicMemory';
import { ConstraintSet } from './ConstraintSet';
import { PathState } from './PathState';
import { ExecutionTrace } from './ExecutionTrace';

export interface SymbolicState {
  readonly id: string;
  readonly memory: SymbolicMemory;
  readonly constraints: ConstraintSet;
  readonly pathState: PathState;
  readonly trace: ExecutionTrace;
  readonly taintedVariables: ReadonlySet<string>;
}
