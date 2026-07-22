import { NovoNode } from '../NovoNode';
import { Symbol } from '../Symbol';

export type CallNodeKind = 'Function' | 'Method' | 'ArrowFunction' | 'Constructor' | 'Anonymous';

export interface CallNode {
  readonly id: string;
  readonly name: string;
  readonly kind: CallNodeKind;
  readonly astNode: NovoNode;
  readonly symbol: Symbol | null;
}
