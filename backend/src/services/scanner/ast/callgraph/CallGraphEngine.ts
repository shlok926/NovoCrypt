import { ASTContext } from '../ASTContext';
import { ScopeManager } from '../ScopeManager';
import { SymbolTable } from '../SymbolTable';
import { CallNode } from './CallNode';
import { CallGraph } from './CallGraph';
import { CallGraphBuilder } from './CallGraphBuilder';
import { CallGraphAlgorithms } from './CallGraphAlgorithms';
import { ReachabilityCache } from './ReachabilityCache';

export class CallGraphEngine {
  private builder = new CallGraphBuilder();
  private reachabilityCaches = new Map<CallGraph, ReachabilityCache>();

  public buildCallGraph(
    astContext: ASTContext,
    scopeManager: ScopeManager,
    symbolTable: SymbolTable
  ): CallGraph {
    const graph = this.builder.build(astContext, scopeManager, symbolTable);
    this.reachabilityCaches.set(graph, new ReachabilityCache());
    return graph;
  }

  private getOrCreateCache(graph: CallGraph): ReachabilityCache {
    let cache = this.reachabilityCaches.get(graph);
    if (!cache) {
      cache = new ReachabilityCache();
      this.reachabilityCaches.set(graph, cache);
    }
    return cache;
  }

  public findCallers(node: CallNode, graph: CallGraph): CallNode[] {
    const incoming = graph.incomingIndex.get(node.id) || [];
    return incoming.map(e => e.source);
  }

  public findCallees(node: CallNode, graph: CallGraph): CallNode[] {
    const outgoing = graph.outgoingIndex.get(node.id) || [];
    return outgoing.map(e => e.target);
  }

  public isReachable(source: CallNode, target: CallNode, graph: CallGraph): boolean {
    const cache = this.getOrCreateCache(graph);
    return CallGraphAlgorithms.isReachable(source, target, graph, cache);
  }

  public isRecursive(node: CallNode, graph: CallGraph): boolean {
    return CallGraphAlgorithms.isRecursive(node, graph);
  }

  public findEntryPoints(graph: CallGraph): CallNode[] {
    return CallGraphAlgorithms.findEntryPoints(graph);
  }

  public findUnreachable(graph: CallGraph): CallNode[] {
    const entries = this.findEntryPoints(graph);
    return CallGraphAlgorithms.findUnreachable(graph, entries);
  }

  public getAllFunctions(graph: CallGraph): CallNode[] {
    return Array.from(graph.nodes.values());
  }

  public findSCCs(graph: CallGraph): string[][] {
    return CallGraphAlgorithms.findSCCs(graph);
  }

  public topologicalSort(graph: CallGraph): CallNode[] | null {
    return CallGraphAlgorithms.topologicalSort(graph);
  }

  public clearCache(graph: CallGraph): void {
    this.reachabilityCaches.delete(graph);
  }
}
