import { NovoNode } from '../../../ast/NovoNode';
import { Constraint } from '../models/Constraint';
import { SymbolicValue } from '../models/SymbolicValue';
import { ExpressionNormalizer } from './ExpressionNormalizer';

export class ConstraintBuilder {
  public static buildFromNode(node: NovoNode): Constraint | undefined {
    if (node.type === 'BinaryExpression') {
      const leftNode = node.children[0];
      const rightNode = node.children[1];
      const op = node.metadata.get('operator') || '==';

      if (leftNode && rightNode) {
        const leftVal: SymbolicValue = {
          name: leftNode.metadata.get('name') || 'alpha',
          type: 'integer'
        };
        const rightVal = rightNode.metadata.get('value') ?? rightNode.metadata.get('name');

        const rawExpr = {
          left: leftVal,
          operator: op,
          right: rightVal
        };

        return {
          expression: ExpressionNormalizer.normalize(rawExpr),
          negate: false
        };
      }
    }
    return undefined;
  }
}
