import { NovoNode } from '../../../ast/NovoNode';
import { FunctionSummary } from '../models/FunctionSummary';

export class FunctionSummaryBuilder {
  public static buildSummary(funcNode: NovoNode): FunctionSummary {
    const id = funcNode.metadata.get('name') || `func-${Math.random().toString(36).substring(7)}`;
    const parameters: string[] = [];

    if (funcNode.children) {
      funcNode.children.forEach(child => {
        if (child.type === 'Parameter') {
          const paramName = child.metadata.get('name');
          if (paramName) parameters.push(paramName);
        }
      });
    }

    const sideEffects: string[] = [];
    const objectMutations: string[] = [];
    const calls: string[] = [];
    const taintSinks: string[] = [];
    const pathConstraints: string[] = [];

    const traverse = (node: NovoNode) => {
      if (node.type === 'CallExpression') {
        const native = node.rawReference?.ref as any;
        if (native && native.expression) {
          const called = native.expression.text || (native.expression.name && native.expression.name.text);
          if (called) calls.push(called);
        }
      }
      if (node.type === 'BinaryExpression') {
        const op = node.metadata.get('operator');
        if (op === '=' || op === '+=') {
          const leftNode = node.children[0];
          if (leftNode && leftNode.type === 'PropertyAccessExpression') {
            const propName = leftNode.metadata.get('name') || 'prop';
            objectMutations.push(`mutation:${propName}`);
          }
        }
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(funcNode);

    return {
      id,
      parameters,
      returnTainted: false,
      taintSources: [],
      taintSinks,
      sideEffects,
      objectMutations,
      calls,
      pathConstraints
    };
  }
}
