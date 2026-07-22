import { CallNode } from './CallNode';
import { CallEdge } from './CallEdge';
import { CallGraph } from './CallGraph';
import { ReachabilityCache } from './ReachabilityCache';

export class CallGraphAlgorithms {
  public static isReachable(
    source: CallNode,
    target: CallNode,
    graph: CallGraph,
    cache: ReachabilityCache
  ): boolean {
    if (source.id === target.id) return true;

    if (cache.has(source.id)) {
      return cache.get(source.id)!.has(target.id);
    }

    const reachable = new Set<string>();
    const visited = new Set<string>();
    const queue: string[] = [source.id];
    visited.add(source.id);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const outEdges = graph.outgoingIndex.get(curr) || [];
      for (const edge of outEdges) {
        const nextId = edge.target.id;
        if (!visited.has(nextId)) {
          visited.add(nextId);
          reachable.add(nextId);
          queue.push(nextId);
        }
      }
    }

    cache.set(source.id, reachable);
    return reachable.has(target.id);
  }

  public static isRecursive(node: CallNode, graph: CallGraph): boolean {
    const outEdges = graph.outgoingIndex.get(node.id) || [];
    const hasSelfLoop = outEdges.some(e => e.target.id === node.id);
    if (hasSelfLoop) return true;

    const sccs = CallGraphAlgorithms.findSCCs(graph);
    const nodeScc = sccs.find(scc => scc.includes(node.id));
    if (nodeScc && nodeScc.length > 1) {
      return true;
    }

    return false;
  }

  public static findSCCs(graph: CallGraph): string[][] {
    let index = 0;
    const stack: string[] = [];
    const inStack = new Set<string>();
    const indices = new Map<string, number>();
    const lowlinks = new Map<string, number>();
    const sccs: string[][] = [];

    const strongconnect = (nodeId: string) => {
      indices.set(nodeId, index);
      lowlinks.set(nodeId, index);
      index++;
      stack.push(nodeId);
      inStack.add(nodeId);

      const outEdges = graph.outgoingIndex.get(nodeId) || [];
      for (const edge of outEdges) {
        const nextId = edge.target.id;
        if (!indices.has(nextId)) {
          strongconnect(nextId);
          lowlinks.set(nodeId, Math.min(lowlinks.get(nodeId)!, lowlinks.get(nextId)!));
        } else if (inStack.has(nextId)) {
          lowlinks.set(nodeId, Math.min(lowlinks.get(nodeId)!, indices.get(nextId)!));
        }
      }

      if (lowlinks.get(nodeId) === indices.get(nodeId)) {
        const component: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          inStack.delete(w);
          component.push(w);
        } while (w !== nodeId);
        sccs.push(component);
      }
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!indices.has(nodeId)) {
        strongconnect(nodeId);
      }
    }

    return sccs;
  }

  public static topologicalSort(graph: CallGraph): CallNode[] | null {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: CallNode[] = [];
    let hasCycle = false;

    const visit = (nodeId: string) => {
      if (hasCycle) return;
      if (temp.has(nodeId)) {
        hasCycle = true;
        return;
      }
      if (!visited.has(nodeId)) {
        temp.add(nodeId);
        const outEdges = graph.outgoingIndex.get(nodeId) || [];
        for (const edge of outEdges) {
          visit(edge.target.id);
        }
        temp.delete(nodeId);
        visited.add(nodeId);
        const node = graph.nodes.get(nodeId);
        if (node) {
          order.unshift(node);
        }
      }
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }

    if (hasCycle) return null;
    return order;
  }

  public static findEntryPoints(graph: CallGraph): CallNode[] {
    const entries: CallNode[] = [];
    for (const node of graph.nodes.values()) {
      const incoming = graph.incomingIndex.get(node.id) || [];
      if (incoming.length === 0) {
        entries.push(node);
      }
    }
    return entries;
  }

  public static findUnreachable(graph: CallGraph, entryPoints: CallNode[]): CallNode[] {
    const reachableFromAllEntries = new Set<string>();

    for (const entry of entryPoints) {
      const visited = new Set<string>();
      const queue: string[] = [entry.id];
      visited.add(entry.id);
      reachableFromAllEntries.add(entry.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const outEdges = graph.outgoingIndex.get(curr) || [];
        for (const edge of outEdges) {
          const nextId = edge.target.id;
          if (!visited.has(nextId)) {
            visited.add(nextId);
            reachableFromAllEntries.add(nextId);
            queue.push(nextId);
          }
        }
      }
    }

    const unreachable: CallNode[] = [];
    for (const node of graph.nodes.values()) {
      if (!reachableFromAllEntries.has(node.id)) {
        unreachable.push(node);
      }
    }

    return unreachable;
  }
}
