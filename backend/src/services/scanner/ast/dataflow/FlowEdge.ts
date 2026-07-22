import { FlowNode } from './FlowNode';

export type FlowEdgeKind =
  | 'Assignment'
  | 'ParameterPassing'
  | 'Return'
  | 'Alias'
  | 'Initializer'
  | 'FunctionArgument'
  | 'FunctionResult';

export interface FlowEdge {
  readonly source: FlowNode;
  readonly target: FlowNode;
  readonly kind: FlowEdgeKind;
}
