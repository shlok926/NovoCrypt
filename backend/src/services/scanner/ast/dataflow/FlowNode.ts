import { NovoNode } from '../NovoNode';

export type FlowNodeKind =
  | 'VariableDeclaration'
  | 'Assignment'
  | 'Parameter'
  | 'Return'
  | 'FunctionCall'
  | 'Literal'
  | 'ObjectCreation'
  | 'ArrayCreation'
  | 'Unknown';

export interface FlowNode {
  readonly id: string;
  readonly kind: FlowNodeKind;
  readonly astNode: NovoNode;
  readonly label: string;
}
