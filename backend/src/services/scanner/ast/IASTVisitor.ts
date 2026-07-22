import { NovoNode } from './NovoNode';
import { TraversalContext } from './TraversalContext';

export interface IASTVisitor {
  readonly id: string;
  readonly nodeTypes?: string[]; // Optional node filtering list (e.g. ['CallExpression', 'Identifier'])
  
  beforeTraversal?(context: TraversalContext): void;
  afterTraversal?(context: TraversalContext): void;
  
  enterNode?(node: NovoNode, context: TraversalContext): void;
  leaveNode?(node: NovoNode, context: TraversalContext): void;
  
  onError?(error: Error, node: NovoNode, context: TraversalContext): void;
}
