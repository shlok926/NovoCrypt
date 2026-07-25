import { SymbolicExpression } from './SymbolicExpression';

export interface Constraint {
  readonly expression: SymbolicExpression;
  readonly negate: boolean;
}
