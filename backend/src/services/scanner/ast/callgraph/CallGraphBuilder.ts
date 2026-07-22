import * as ts from 'typescript';
import { NovoNode } from '../NovoNode';
import { Symbol } from '../Symbol';
import { SymbolTable } from '../SymbolTable';
import { ScopeManager } from '../ScopeManager';
import { ASTContext } from '../ASTContext';
import { CallNode, CallNodeKind } from './CallNode';
import { CallEdge, CallEdgeKind } from './CallEdge';
import { CallGraph } from './CallGraph';

export class CallGraphBuilder {
  private nodeCounter = 0;
  private edgeCounter = 0;

  public build(
    astContext: ASTContext,
    scopeManager: ScopeManager,
    symbolTable: SymbolTable
  ): CallGraph {
    this.nodeCounter = 0;
    this.edgeCounter = 0;

    const nodesMap = new Map<string, CallNode>();
    const astToNodeMap = new Map<NovoNode, CallNode>();
    const edges: CallEdge[] = [];
    const metadata = new Map<string, any>();

    // 1. Collect all function-like nodes recursively
    const functionNodes: NovoNode[] = [];
    this.findFunctionNodes(astContext.root, functionNodes);

    // 2. Create CallNode for each function-like node
    for (const node of functionNodes) {
      const id = `callnode-${++this.nodeCounter}`;
      const name = this.getFunctionName(node);
      const kind = this.getCallNodeKind(node);
      const symbol = symbolTable.findByDeclaration(node) || null;

      const callNode: CallNode = { id, name, kind, astNode: node, symbol };
      nodesMap.set(id, callNode);
      astToNodeMap.set(node, callNode);
    }

    // Helper to add edges
    const addEdge = (source: CallNode, target: CallNode, kind: CallEdgeKind, callSite: NovoNode) => {
      const id = `calledge-${++this.edgeCounter}`;
      const edge: CallEdge = {
        id,
        kind,
        source,
        target,
        callSite,
        metadata: new Map<string, any>()
      };
      edges.push(edge);
    };

    // 3. For each caller node, find call sites directly enclosed in its body
    for (const callerNode of functionNodes) {
      const caller = astToNodeMap.get(callerNode)!;
      const callSites = this.collectEnclosedCalls(callerNode);

      for (const callSiteInfo of callSites) {
        const callSite = callSiteInfo.node;

        // Check for normal call target
        const callee = this.resolveCallee(callSite, symbolTable, scopeManager, astToNodeMap);
        if (callee) {
          let edgeKind: CallEdgeKind = 'DirectCall';
          if (callee.id === caller.id) {
            edgeKind = 'RecursiveCall';
          } else if (callee.kind === 'Method') {
            edgeKind = 'MethodCall';
          } else if (callee.kind === 'Constructor') {
            edgeKind = 'ConstructorCall';
          } else if (callee.kind === 'ArrowFunction') {
            edgeKind = 'ArrowInvocation';
          }
          addEdge(caller, callee, edgeKind, callSite);
        }

        // Check for callback registrations in call arguments
        this.checkCallbackRegistrations(caller, callSite, symbolTable, scopeManager, astToNodeMap, (target, kind) => {
          addEdge(caller, target, kind, callSite);
        });
      }
    }

    return new CallGraph(nodesMap, edges, metadata);
  }

  private findFunctionNodes(node: NovoNode, list: NovoNode[]): void {
    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'MethodDeclaration' ||
      node.type === 'Constructor' ||
      node.type === 'ArrowFunction' ||
      node.type === 'FunctionExpression'
    ) {
      list.push(node);
    }
    node.children.forEach(c => this.findFunctionNodes(c, list));
  }

  private getFunctionName(node: NovoNode): string {
    if (node.type === 'Constructor') return 'constructor';
    
    const name = node.metadata.get('name');
    if (name) return name;

    if (node.parent && node.parent.type === 'VariableDeclaration') {
      const parentName = node.parent.metadata.get('name');
      if (parentName) return parentName;
    }

    return 'anonymous';
  }

  private getCallNodeKind(node: NovoNode): CallNodeKind {
    switch (node.type) {
      case 'FunctionDeclaration':
      case 'FunctionExpression':
        return 'Function';
      case 'MethodDeclaration':
        return 'Method';
      case 'Constructor':
        return 'Constructor';
      case 'ArrowFunction':
        return 'ArrowFunction';
      default:
        return 'Anonymous';
    }
  }

  private collectEnclosedCalls(root: NovoNode): { node: NovoNode; kind: 'call' | 'new' }[] {
    const calls: { node: NovoNode; kind: 'call' | 'new' }[] = [];
    const visit = (n: NovoNode) => {
      if (n === root) {
        n.children.forEach(visit);
        return;
      }
      if (
        n.type === 'FunctionDeclaration' ||
        n.type === 'MethodDeclaration' ||
        n.type === 'Constructor' ||
        n.type === 'ArrowFunction' ||
        n.type === 'FunctionExpression'
      ) {
        return;
      }
      if (n.type === 'CallExpression') {
        calls.push({ node: n, kind: 'call' });
      }
      if (n.type === 'NewExpression') {
        calls.push({ node: n, kind: 'new' });
      }
      n.children.forEach(visit);
    };
    visit(root);
    return calls;
  }

  private resolveIdentifierPostTraversal(
    name: string,
    callSite: NovoNode,
    scopeManager: ScopeManager,
    symbolTable: SymbolTable
  ): NovoNode | null {
    const rootScope = scopeManager.rootScope();
    if (!rootScope) return null;

    const findScope = (s: any, targetNode: NovoNode): any => {
      if (s.creationNode === targetNode) return s;
      for (const child of s.children) {
        const found = findScope(child, targetNode);
        if (found) return found;
      }
      return null;
    };

    let curr: NovoNode | undefined = callSite;
    while (curr) {
      const scope = findScope(rootScope, curr);
      if (scope) {
        const decl = scope.declarations.get(name);
        if (decl && decl.node) {
          return decl.node;
        }
      }
      curr = curr.parent;
    }

    const rootDecl = rootScope.declarations.get(name);
    if (rootDecl && rootDecl.node) return rootDecl.node;

    for (const child of rootScope.children) {
      if (child.type === 'module') {
        const moduleDecl = child.declarations.get(name);
        if (moduleDecl && moduleDecl.node) return moduleDecl.node;
      }
    }

    return null;
  }

  private resolveCallee(
    callSite: NovoNode,
    symbolTable: SymbolTable,
    scopeManager: ScopeManager,
    astToNodeMap: Map<NovoNode, CallNode>
  ): CallNode | null {
    const native = callSite.rawReference?.ref as any;
    if (!native) return null;

    if (callSite.type === 'NewExpression') {
      const expr = native.expression;
      if (expr && ts.isIdentifier(expr)) {
        const declNode = this.resolveIdentifierPostTraversal(expr.text, callSite, scopeManager, symbolTable);
        if (declNode) {
          const constructorNode = declNode.children.find(
            c => c.type === 'Constructor' || c.kind === 'Constructor'
          );
          if (constructorNode) {
            const callee = astToNodeMap.get(constructorNode);
            if (callee) return callee;
          }
        }
      }
      return null;
    }

    const expr = native.expression;
    if (!expr) return null;

    // 1. Direct identifier call
    if (ts.isIdentifier(expr)) {
      const declNode = this.resolveIdentifierPostTraversal(expr.text, callSite, scopeManager, symbolTable);
      if (declNode) {
        if (declNode.type === 'VariableDeclaration') {
          const nativeDecl = declNode.rawReference?.ref as any;
          if (nativeDecl && nativeDecl.initializer) {
            const initNovo = this.findNovoNode(nativeDecl.initializer, declNode);
            if (initNovo) {
              const callee = astToNodeMap.get(initNovo);
              if (callee) return callee;
            }
          }
        }
        const callee = astToNodeMap.get(declNode);
        if (callee) return callee;
      }
    }

    // 2. Property access method call
    if (ts.isPropertyAccessExpression(expr)) {
      const propName = expr.name.text;
      const methodSymbols = symbolTable.getAllSymbols().filter(
        s => s.name === propName && s.kind === 'Method'
      );
      if (methodSymbols.length > 0) {
        const callee = astToNodeMap.get(methodSymbols[0].declaration);
        if (callee) return callee;
      }
    }

    return null;
  }

  private checkCallbackRegistrations(
    caller: CallNode,
    callSite: NovoNode,
    symbolTable: SymbolTable,
    scopeManager: ScopeManager,
    astToNodeMap: Map<NovoNode, CallNode>,
    addEdge: (target: CallNode, kind: CallEdgeKind) => void
  ): void {
    const native = callSite.rawReference?.ref as any;
    if (!native || !native.arguments) return;

    for (const arg of native.arguments) {
      const argNovo = this.findNovoNode(arg, callSite);
      if (!argNovo) continue;

      if (
        argNovo.type === 'ArrowFunction' ||
        argNovo.type === 'FunctionExpression' ||
        argNovo.type === 'FunctionDeclaration'
      ) {
        const cbNode = astToNodeMap.get(argNovo);
        if (cbNode) {
          addEdge(cbNode, 'CallbackRegistration');
        }
      } else if (argNovo.type === 'Identifier') {
        const declNode = this.resolveIdentifierPostTraversal(arg.text, callSite, scopeManager, symbolTable);
        if (declNode) {
          if (declNode.type === 'VariableDeclaration') {
            const nativeDecl = declNode.rawReference?.ref as any;
            if (nativeDecl && nativeDecl.initializer) {
              const initNovo = this.findNovoNode(nativeDecl.initializer, declNode);
              if (initNovo) {
                const cbNode = astToNodeMap.get(initNovo);
                if (cbNode) addEdge(cbNode, 'CallbackRegistration');
              }
            }
          }
          const cbNode = astToNodeMap.get(declNode);
          if (cbNode) {
            addEdge(cbNode, 'CallbackRegistration');
          }
        }
      }
    }
  }

  private findNovoNode(nativeNode: ts.Node, context: NovoNode): NovoNode | null {
    if (context.rawReference?.ref === nativeNode) return context;
    for (const child of context.children) {
      const found = this.findNovoNode(nativeNode, child);
      if (found) return found;
    }
    return null;
  }
}
