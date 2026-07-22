import { NovoNode } from '../NovoNode';
import { CallNode } from './CallNode';

export type CallEdgeKind =
  | 'DirectCall'
  | 'MethodCall'
  | 'ConstructorCall'
  | 'RecursiveCall'
  | 'CallbackRegistration'
  | 'ArrowInvocation';

export interface CallEdge {
  readonly id: string;
  readonly kind: CallEdgeKind;
  readonly source: CallNode;
  readonly target: CallNode;
  readonly callSite: NovoNode;
  readonly metadata: Map<string, any>;
}
