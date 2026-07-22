import * as ts from 'typescript';
import { NovoNode } from '../NovoNode';
import { Symbol } from '../Symbol';
import { SymbolTable } from '../SymbolTable';
import { ScopeManager } from '../ScopeManager';
import { FlowNode, FlowNodeKind } from './FlowNode';
import { FlowEdge, FlowEdgeKind } from './FlowEdge';
import { FlowGraph } from './FlowGraph';
import { ASTContext } from '../ASTContext';

export class DataFlowEngine {
  private cache = new Map<ASTContext, FlowGraph>();
  private nodeCounter = 0;

  public buildFlowGraph(
    astContext: ASTContext,
    scopeManager: ScopeManager,
    symbolTable: SymbolTable
  ): FlowGraph {
    const cached = this.cache.get(astContext);
    if (cached) return cached;

    const graph = new FlowGraph();
    this.nodeCounter = 0;

    const allSymbols = symbolTable.getAllSymbols();

    // 1. Create nodes for all declarations & initializers
    for (const symbol of allSymbols) {
      const declNode = symbol.declaration;
      const declKind: FlowNodeKind = symbol.kind === 'Parameter' ? 'Parameter' : 'VariableDeclaration';
      
      const declFlow = this.createNode(declKind, declNode, symbol.name, graph);

      // Initializer connection
      const nativeDecl = declNode.rawReference?.ref as any;
      if (nativeDecl && nativeDecl.initializer) {
        const initNovo = this.findNovoNode(nativeDecl.initializer, declNode);
        if (initNovo) {
          const initFlow = this.createNodeForExpression(initNovo, graph);
          this.createEdge(initFlow, declFlow, 'Initializer', graph);
        }
      }

      // 2. Track references
      for (const ref of symbol.references) {
        if (ref.usage === 'write') {
          const assignNode = ref.node.parent;
          if (assignNode) {
            const assignFlow = this.createNode('Assignment', assignNode, `${symbol.name} = ...`, graph);
            this.createEdge(assignFlow, declFlow, 'Assignment', graph);

            const nativeAssign = assignNode.rawReference?.ref as any;
            if (nativeAssign && nativeAssign.right) {
              const rightNovo = this.findNovoNode(nativeAssign.right, assignNode);
              if (rightNovo) {
                const rightFlow = this.createNodeForExpression(rightNovo, graph);
                this.createEdge(rightFlow, assignFlow, 'Assignment', graph);
              }
            }
          }
        } else {
          const readFlow = this.createNode('VariableDeclaration', ref.node, symbol.name, graph);
          this.createEdge(declFlow, readFlow, 'Alias', graph);
        }
      }
    }

    // 3. Track parameter passing and returns across calls
    const callNodes: NovoNode[] = [];
    const collectCalls = (n: NovoNode) => {
      if (n.type === 'CallExpression') callNodes.push(n);
      n.children.forEach(collectCalls);
    };
    collectCalls(astContext.root);

    for (const call of callNodes) {
      const nativeCall = call.rawReference?.ref as any;
      if (!nativeCall) continue;

      const expr = nativeCall.expression;
      if (ts.isIdentifier(expr)) {
        const targetSymbol = allSymbols.find(s => s.name === expr.text && (s.kind === 'Function' || s.kind === 'Method'));
        if (targetSymbol) {
          const callFlow = this.createNode('FunctionCall', call, `${targetSymbol.name}()`, graph);

          // Parameter passing
          const paramSymbols = allSymbols.filter(s => s.scope.creationNode === targetSymbol.declaration && s.kind === 'Parameter');
          const nativeParams = (targetSymbol.declaration.rawReference?.ref as any)?.parameters || [];
          const sortedParams = nativeParams.map((p: any) => paramSymbols.find(s => s.name === p.name.text)).filter(Boolean) as Symbol[];

          if (nativeCall.arguments && nativeCall.arguments.length > 0) {
            nativeCall.arguments.forEach((arg: any, index: number) => {
              const paramSymbol = sortedParams[index];
              if (paramSymbol) {
                const argNovo = this.findNovoNode(arg, call);
                if (argNovo) {
                  const argFlow = this.createNodeForExpression(argNovo, graph);
                  const paramFlow = graph.findNodesByAstNode(paramSymbol.declaration)[0];
                  if (paramFlow) {
                    this.createEdge(argFlow, paramFlow, 'ParameterPassing', graph);
                  }
                }
              }
            });
          }

          // Function returns
          const retNodes: NovoNode[] = [];
          const collectReturns = (n: NovoNode) => {
            if (n.type === 'ReturnStatement' || n.kind === 'ReturnStatement') retNodes.push(n);
            n.children.forEach(collectReturns);
          };
          collectReturns(targetSymbol.declaration);

          for (const retNode of retNodes) {
            const nativeRet = retNode.rawReference?.ref as any;
            if (nativeRet && nativeRet.expression) {
              const retValNovo = this.findNovoNode(nativeRet.expression, retNode);
              if (retValNovo) {
                const retValFlow = this.createNodeForExpression(retValNovo, graph);
                const retFlow = this.createNode('Return', retNode, 'return ...', graph);
                
                this.createEdge(retValFlow, retFlow, 'Return', graph);
                this.createEdge(retFlow, callFlow, 'FunctionResult', graph);
              }
            }
          }
        }
      }
    }

    this.cache.set(astContext, graph);
    return graph;
  }

  private createNode(kind: FlowNodeKind, astNode: NovoNode, label: string, graph: FlowGraph): FlowNode {
    const existing = graph.findNodesByAstNode(astNode).find(n => n.kind === kind);
    if (existing) return existing;

    const node: FlowNode = {
      id: `flownode-${++this.nodeCounter}`,
      kind,
      astNode,
      label
    };
    graph.addNode(node);
    return node;
  }

  private createNodeForExpression(node: NovoNode, graph: FlowGraph): FlowNode {
    let kind: FlowNodeKind = 'Unknown';
    if (node.type === 'StringLiteral' || node.type === 'NumericLiteral' || node.type === 'TrueKeyword' || node.type === 'FalseKeyword') {
      kind = 'Literal';
    } else if (node.type === 'ArrayLiteralExpression') {
      kind = 'ArrayCreation';
    } else if (node.type === 'ObjectLiteralExpression') {
      kind = 'ObjectCreation';
    } else if (node.type === 'CallExpression') {
      kind = 'FunctionCall';
    } else if (node.type === 'Identifier') {
      kind = 'VariableDeclaration';
    }

    return this.createNode(kind, node, node.metadata.get('name') || node.metadata.get('value') || 'expr', graph);
  }

  private createEdge(source: FlowNode, target: FlowNode, kind: FlowEdgeKind, graph: FlowGraph): void {
    const duplicate = graph.edges.some(e => e.source.id === source.id && e.target.id === target.id && e.kind === kind);
    if (!duplicate) {
      const edge: FlowEdge = { source, target, kind };
      graph.addEdge(edge);
    }
  }

  public traceForward(startNode: FlowNode, graph: FlowGraph): FlowNode[] {
    const visited = new Set<string>();
    const result: FlowNode[] = [];
    const queue: FlowNode[] = [startNode];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (visited.has(curr.id)) continue;
      visited.add(curr.id);

      if (curr.id !== startNode.id) {
        result.push(curr);
      }

      const outEdges = graph.getOutgoingEdges(curr.id);
      for (const edge of outEdges) {
        queue.push(edge.target);
      }
    }

    return result;
  }

  public traceBackward(startNode: FlowNode, graph: FlowGraph): FlowNode[] {
    const visited = new Set<string>();
    const result: FlowNode[] = [];
    const queue: FlowNode[] = [startNode];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (visited.has(curr.id)) continue;
      visited.add(curr.id);

      if (curr.id !== startNode.id) {
        result.push(curr);
      }

      const inEdges = graph.getIncomingEdges(curr.id);
      for (const edge of inEdges) {
        queue.push(edge.source);
      }
    }

    return result;
  }

  public findOrigins(node: FlowNode, graph: FlowGraph): FlowNode[] {
    const backward = this.traceBackward(node, graph);
    return backward.filter(n => graph.getIncomingEdges(n.id).length === 0);
  }

  public findConsumers(node: FlowNode, graph: FlowGraph): FlowNode[] {
    const forward = this.traceForward(node, graph);
    return forward.filter(n => graph.getOutgoingEdges(n.id).length === 0);
  }

  public findAliases(node: FlowNode, graph: FlowGraph): FlowNode[] {
    const aliases: FlowNode[] = [];
    const collect = (curr: FlowNode, visited: Set<string>) => {
      if (visited.has(curr.id)) return;
      visited.add(curr.id);

      if (curr.id !== node.id && (curr.kind === 'VariableDeclaration' || curr.kind === 'Parameter')) {
        aliases.push(curr);
      }

      const outgoing = graph.getOutgoingEdges(curr.id);
      const incoming = graph.getIncomingEdges(curr.id);

      for (const edge of [...outgoing, ...incoming]) {
        if (edge.kind === 'Alias' || edge.kind === 'Assignment' || edge.kind === 'Initializer' || edge.kind === 'ParameterPassing') {
          const next = edge.source.id === curr.id ? edge.target : edge.source;
          collect(next, visited);
        }
      }
    };

    collect(node, new Set<string>());
    return aliases;
  }

  public findAssignments(node: FlowNode, graph: FlowGraph): FlowNode[] {
    const backward = this.traceBackward(node, graph);
    return backward.filter(n => n.kind === 'Assignment');
  }

  private findNovoNode(nativeTarget: ts.Node, startNode: NovoNode): NovoNode | undefined {
    const visit = (curr: NovoNode): NovoNode | undefined => {
      if (curr.rawReference?.ref === nativeTarget) {
        return curr;
      }
      for (const child of curr.children) {
        const res = visit(child);
        if (res) return res;
      }
      return undefined;
    };

    let root = startNode;
    while (root.parent) {
      root = root.parent;
    }
    return visit(root);
  }

  public clear(): void {
    this.cache.clear();
  }
}
