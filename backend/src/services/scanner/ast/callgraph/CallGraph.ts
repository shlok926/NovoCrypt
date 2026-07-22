import { CallNode } from './CallNode';
import { CallEdge } from './CallEdge';

export class CallGraph {
  public readonly nodes: ReadonlyMap<string, CallNode>;
  public readonly edges: readonly CallEdge[];
  public readonly incomingIndex: ReadonlyMap<string, readonly CallEdge[]>;
  public readonly outgoingIndex: ReadonlyMap<string, readonly CallEdge[]>;
  public readonly metadata: ReadonlyMap<string, any>;

  constructor(
    nodes: Map<string, CallNode>,
    edges: CallEdge[],
    metadata: Map<string, any>
  ) {
    this.nodes = new Map(nodes);
    this.edges = [...edges];
    this.metadata = new Map(metadata);

    const incoming = new Map<string, CallEdge[]>();
    const outgoing = new Map<string, CallEdge[]>();

    // Initialize indices for all nodes
    for (const nodeId of nodes.keys()) {
      incoming.set(nodeId, []);
      outgoing.set(nodeId, []);
    }

    for (const edge of edges) {
      const srcId = edge.source.id;
      const tgtId = edge.target.id;

      if (!outgoing.has(srcId)) outgoing.set(srcId, []);
      if (!incoming.has(tgtId)) incoming.set(tgtId, []);

      outgoing.get(srcId)!.push(edge);
      incoming.get(tgtId)!.push(edge);
    }

    this.incomingIndex = incoming;
    this.outgoingIndex = outgoing;
  }
}
