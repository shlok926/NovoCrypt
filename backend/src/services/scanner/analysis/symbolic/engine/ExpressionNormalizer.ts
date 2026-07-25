import { SymbolicExpression } from '../models/SymbolicExpression';

export class ExpressionNormalizer {
  public static normalize(expr: SymbolicExpression): SymbolicExpression {
    if (expr.operator === '!' && expr.left) {
      const inner = expr.left as SymbolicExpression;
      if (inner.operator === '==') {
        return {
          left: inner.left,
          operator: '!=',
          right: inner.right
        };
      }
    }

    if (expr.operator === '>' && typeof expr.right === 'number') {
      return {
        left: {
          left: expr.left,
          operator: '-',
          right: expr.right
        },
        operator: '>',
        right: 0
      };
    }

    return expr;
  }
}
