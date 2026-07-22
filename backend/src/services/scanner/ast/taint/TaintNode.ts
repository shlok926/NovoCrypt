import { FlowNode } from '../dataflow/FlowNode';

export type TaintNodeKind = 'Source' | 'Propagation' | 'Sanitizer' | 'Sink' | 'Unknown';

export interface TaintNode {
  readonly id: string;
  readonly kind: TaintNodeKind;
  readonly flowNode: FlowNode;
  readonly label: string;
  readonly tainted: boolean;
  readonly sanitizerName?: string;
  readonly sourceName?: string;
  readonly sinkName?: string;
}
