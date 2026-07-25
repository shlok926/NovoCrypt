import { SymbolicValue } from './SymbolicValue';

export interface SymbolicExpression {
  readonly left: SymbolicValue | SymbolicExpression;
  readonly operator: string;
  readonly right: SymbolicValue | SymbolicExpression | number | string | boolean | null;
}
