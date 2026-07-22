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

    // 1. Create nodes for all declarations, parameters, literals, and property accesses recursively
    const visitNode = (node: NovoNode) => {
      if (node.type === 'VariableDeclaration') {
        const name = node.metadata.get('name') || 'var';
        this.createNode('VariableDeclaration', node, name, graph);
      } 
      else if (node.type === 'Parameter') {
        const name = node.metadata.get('name') || 'param';
        this.createNode('Parameter', node, name, graph);
      }
      else if (node.type === 'CallExpression') {
        const native = node.rawReference?.ref as any;
        const label = native ? native.getText() : 'call';
        this.createNode('FunctionCall', node, label, graph);
      }
      else if (node.type === 'PropertyAccessExpression') {
        const native = node.rawReference?.ref as any;
        const label = native ? native.getText() : 'property';
        this.createNode('VariableDeclaration', node, label, graph);
      }
      else if (node.type === 'StringLiteral' || node.type === 'NumericLiteral' || node.type === 'TrueKeyword' || node.type === 'FalseKeyword') {
        const native = node.rawReference?.ref as any;
        const label = native ? native.getText() : 'literal';
        this.createNode('Literal', node, label, graph);
      }
      else if (node.type === 'BinaryExpression') {
        const native = node.rawReference?.ref as any;
        if (native && (native.operatorToken.kind === ts.SyntaxKind.EqualsToken)) {
          this.createNode('Assignment', node, native.getText(), graph);
        }
      }

      node.children.forEach(visitNode);
    };
    visitNode(astContext.root);

    // 2. Connect variable initializers
    const declarations: NovoNode[] = [];
    const collectDecls = (n: NovoNode) => {
      if (n.type === 'VariableDeclaration' || n.type === 'Parameter') declarations.push(n);
      n.children.forEach(collectDecls);
    };
    collectDecls(astContext.root);

    for (const decl of declarations) {
      const nativeDecl = decl.rawReference?.ref as any;
      if (nativeDecl && nativeDecl.initializer) {
        const initNovo = this.findNovoNode(nativeDecl.initializer, decl);
        if (initNovo) {
          const initFlow = graph.findNodesByAstNode(initNovo)[0] || this.createNodeForExpression(initNovo, graph);
          const declFlow = graph.findNodesByAstNode(decl)[0];
          if (declFlow && initFlow) {
            this.createEdge(initFlow, declFlow, 'Initializer', graph);
          }
        }
      }
    }

    // 3. Track references
    for (const symbol of allSymbols) {
      const declFlow = graph.findNodesByAstNode(symbol.declaration)[0];
      if (!declFlow) continue;

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
                const rightFlow = graph.findNodesByAstNode(rightNovo)[0] || this.createNodeForExpression(rightNovo, graph);
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

    // 4. Track parameter passing and returns across calls
    const callNodes: NovoNode[] = [];
    const collectCalls = (n: NovoNode) => {
      if (n.type === 'CallExpression') callNodes.push(n);
      n.children.forEach(collectCalls);
    };
    collectCalls(astContext.root);

    for (const call of callNodes) {
      const nativeCall = call.rawReference?.ref as any;
      if (!nativeCall) continue;

      const callFlow = graph.findNodesByAstNode(call)[0] || this.createNode('FunctionCall', call, nativeCall.getText(), graph);

      // Connect each argument to the FunctionCall node
      if (nativeCall.arguments) {
        for (const arg of nativeCall.arguments) {
          const argNovo = this.findNovoNode(arg, call);
          if (argNovo) {
            const argFlow = graph.findNodesByAstNode(argNovo)[0] || this.createNodeForExpression(argNovo, graph);
            this.createEdge(argFlow, callFlow, 'FunctionArgument', graph);
          }
        }
      }

      const expr = nativeCall.expression;
      if (ts.isIdentifier(expr)) {
        const targetSymbol = allSymbols.find(s => s.name === expr.text && (s.kind === 'Function' || s.kind === 'Method'));
        if (targetSymbol) {
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
                  const argFlow = graph.findNodesByAstNode(argNovo)[0] || this.createNodeForExpression(argNovo, graph);
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
                const retValFlow = graph.findNodesByAstNode(retValNovo)[0] || this.createNodeForExpression(retValNovo, graph);
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
    } else if (node.type === 'PropertyAccessExpression') {
      kind = 'VariableDeclaration';
    }

    const native = node.rawReference?.ref as ts.Node;
    const label = native ? native.getText() : (node.metadata.get('name') || node.metadata.get('value') || 'expr');
    return this.createNode(kind, node, label, graph);
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
