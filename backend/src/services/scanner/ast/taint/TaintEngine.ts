import { FlowGraph } from '../dataflow/FlowGraph';
import { FlowNode } from '../dataflow/FlowNode';
import { TaintNode, TaintNodeKind } from './TaintNode';
import { TaintRegistry } from './TaintRules';

export interface TaintFinding {
  readonly id: string;
  readonly source: TaintNode;
  readonly sink: TaintNode;
  readonly path: TaintNode[];
  readonly sanitized: boolean;
  readonly sanitizer?: TaintNode;
}

export class TaintEngine {
  private cache = new Map<FlowGraph, TaintFinding[]>();

  public analyze(graph: FlowGraph, registry: TaintRegistry): TaintFinding[] {
    const cached = this.cache.get(graph);
    if (cached) return cached;

    // 1. Classify FlowNodes into TaintNodes
    const taintNodes = new Map<string, TaintNode>();
    for (const flowNode of graph.nodes) {
      let kind: TaintNodeKind = 'Unknown';
      let label = flowNode.label;
      let tainted = false;
      let sourceName: string | undefined;
      let sanitizerName: string | undefined;
      let sinkName: string | undefined;

      const matchingSource = registry.sources.find(s => s.match(label));
      const matchingSanitizer = registry.sanitizers.find(s => s.match(label));
      const matchingSink = registry.sinks.find(s => s.match(label));

      if (matchingSource) {
        kind = 'Source';
        tainted = true;
        sourceName = matchingSource.name;
      } else if (matchingSanitizer) {
        kind = 'Sanitizer';
        sanitizerName = matchingSanitizer.name;
      } else if (matchingSink) {
        kind = 'Sink';
        sinkName = matchingSink.name;
      } else {
        kind = 'Propagation';
      }

      taintNodes.set(flowNode.id, {
        id: flowNode.id,
        kind,
        flowNode,
        label,
        tainted,
        sourceName,
        sanitizerName,
        sinkName
      });
    }

    const findings: TaintFinding[] = [];
    const sources = Array.from(taintNodes.values()).filter(n => n.kind === 'Source');
    const sinks = Array.from(taintNodes.values()).filter(n => n.kind === 'Sink');

    for (const source of sources) {
      for (const sink of sinks) {
        const path = this.findPath(source, sink, graph, taintNodes);
        if (path) {
          const sanitizerNode = path.find(n => n.kind === 'Sanitizer');
          findings.push({
            id: `taint-${source.id}-${sink.id}`,
            source,
            sink,
            path,
            sanitized: !!sanitizerNode,
            sanitizer: sanitizerNode
          });
        }
      }
    }

    this.cache.set(graph, findings);
    return findings;
  }

  private findPath(
    source: TaintNode,
    sink: TaintNode,
    graph: FlowGraph,
    taintNodes: Map<string, TaintNode>
  ): TaintNode[] | null {
    const visited = new Set<string>();
    const parent = new Map<string, string>();

    const queue: string[] = [source.id];
    visited.add(source.id);

    let reached = false;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === sink.id) {
        reached = true;
        break;
      }

      const outEdges = graph.getOutgoingEdges(curr);
      for (const edge of outEdges) {
        const nextId = edge.target.id;
        if (!visited.has(nextId)) {
          visited.add(nextId);
          parent.set(nextId, curr);
          queue.push(nextId);
        }
      }
    }

    if (!reached) return null;

    const pathIds: string[] = [];
    let currId: string | undefined = sink.id;
    while (currId) {
      pathIds.push(currId);
      currId = parent.get(currId);
    }
    pathIds.reverse();

    return pathIds.map(id => taintNodes.get(id) as TaintNode);
  }

  public propagate(graph: FlowGraph, registry: TaintRegistry): Map<string, boolean> {
    const taintMap = new Map<string, boolean>();
    const findings = this.analyze(graph, registry);

    for (const finding of findings) {
      if (!finding.sanitized) {
        for (const node of finding.path) {
          taintMap.set(node.id, true);
        }
      }
    }

    return taintMap;
  }

  public traceTaint(finding: TaintFinding): TaintNode[] {
    return finding.path;
  }

  public findSources(graph: FlowGraph, registry: TaintRegistry): TaintNode[] {
    const findings = this.analyze(graph, registry);
    return findings.map(f => f.source);
  }

  public findSinks(graph: FlowGraph, registry: TaintRegistry): TaintNode[] {
    const findings = this.analyze(graph, registry);
    return findings.map(f => f.sink);
  }

  public findSanitizers(graph: FlowGraph, registry: TaintRegistry): TaintNode[] {
    const findings = this.analyze(graph, registry);
    return findings.map(f => f.sanitizer).filter(Boolean) as TaintNode[];
  }

  public isTainted(node: FlowNode, graph: FlowGraph, registry: TaintRegistry): boolean {
    const map = this.propagate(graph, registry);
    return !!map.get(node.id);
  }

  public clear(): void {
    this.cache.clear();
  }
}
