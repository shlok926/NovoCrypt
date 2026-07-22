import * as ts from 'typescript';
import { IASTVisitor } from './IASTVisitor';
import { ScopeManager } from './ScopeManager';
import { SymbolTable } from './SymbolTable';
import { TraversalContext } from './TraversalContext';
import { NovoNode } from './NovoNode';
import { SymbolKind } from './Symbol';

export class SymbolVisitor implements IASTVisitor {
  public readonly id = 'symbol-visitor';
  private scopeManager: ScopeManager;
  private symbolTable: SymbolTable;

  constructor(scopeManager: ScopeManager, symbolTable: SymbolTable) {
    this.scopeManager = scopeManager;
    this.symbolTable = symbolTable;
  }

  public beforeTraversal(context: TraversalContext): void {
    this.symbolTable.clear();
  }

  public enterNode(node: NovoNode, context: TraversalContext): void {
    // 1. Register Symbol on Declaration Nodes
    const nativeNode = node.rawReference?.ref;
    const isExported = this.checkIsExported(nativeNode);

    if (node.type === 'VariableDeclaration') {
      const name = node.metadata.get('name');
      if (name) {
        const scope = this.scopeManager.currentScope();
        if (scope) {
          this.symbolTable.createSymbol(name, 'Variable', scope, node, { exported: isExported });
        }
      }
    } 
    else if (node.type === 'Parameter') {
      const name = node.metadata.get('name');
      if (name) {
        const scope = this.scopeManager.currentScope();
        if (scope) {
          this.symbolTable.createSymbol(name, 'Parameter', scope, node);
        }
      }
    } 
    else if (node.type === 'FunctionDeclaration') {
      const name = node.metadata.get('name');
      if (name) {
        const scope = this.scopeManager.currentScope()?.parent || this.scopeManager.currentScope();
        if (scope) {
          this.symbolTable.createSymbol(name, 'Function', scope, node, { exported: isExported });
        }
      }
    } 
    else if (node.type === 'MethodDeclaration') {
      const name = node.metadata.get('name');
      if (name) {
        const scope = this.scopeManager.currentScope()?.parent || this.scopeManager.currentScope();
        if (scope) {
          this.symbolTable.createSymbol(name, 'Method', scope, node);
        }
      }
    } 
    else if (node.type === 'ClassDeclaration') {
      const name = node.metadata.get('name');
      if (name) {
        const scope = this.scopeManager.currentScope()?.parent || this.scopeManager.currentScope();
        if (scope) {
          this.symbolTable.createSymbol(name, 'Class', scope, node, { exported: isExported });
        }
      }
    } 
    else if (node.type === 'ImportSpecifier' || node.type === 'ImportClause' || node.type === 'NamespaceImport') {
      const name = node.metadata.get('name');
      if (name) {
        const scope = this.scopeManager.currentScope();
        if (scope) {
          this.symbolTable.createSymbol(name, 'Import', scope, node, { imported: true });
        }
      }
    } 
    // 2. Track References on Identifier Nodes
    else if (node.type === 'Identifier') {
      const name = node.metadata.get('name');
      if (name && !this.isDeclarationIdentifier(node)) {
        const symbol = this.symbolTable.resolveIdentifier(name, this.scopeManager);
        if (symbol) {
          const usage = this.determineUsage(node);
          this.symbolTable.recordReference(node, symbol, usage);
        }
      }
    }
  }

  private checkIsExported(nativeNode: any): boolean {
    if (!nativeNode) return false;
    try {
      let current = nativeNode;
      while (current) {
        const modifiers = ts.canHaveModifiers(current) ? ts.getModifiers(current) : undefined;
        if (modifiers && modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
          return true;
        }
        if (current.kind === ts.SyntaxKind.VariableStatement || current.kind === ts.SyntaxKind.SourceFile) {
          break;
        }
        current = current.parent;
      }
    } catch (e) {}
    return false;
  }

  private isDeclarationIdentifier(node: NovoNode): boolean {
    const parent = node.parent;
    if (!parent) return false;
    
    const selfName = node.metadata.get('name');
    const parentName = parent.metadata.get('name');

    if (
      (parent.type === 'VariableDeclaration' ||
       parent.type === 'Parameter' ||
       parent.type === 'FunctionDeclaration' ||
       parent.type === 'MethodDeclaration' ||
       parent.type === 'ClassDeclaration' ||
       parent.type === 'ImportSpecifier' ||
       parent.type === 'ImportClause' ||
       parent.type === 'NamespaceImport') &&
      parentName === selfName
    ) {
      return true;
    }
    return false;
  }

  private determineUsage(node: NovoNode): 'read' | 'write' {
    const nativeParent = node.parent?.rawReference?.ref as any;
    const nativeNode = node.rawReference?.ref as any;

    if (nativeParent && nativeNode && ts.isBinaryExpression(nativeParent) && nativeParent.left === nativeNode) {
      const op = nativeParent.operatorToken.kind;
      if (op >= ts.SyntaxKind.FirstAssignment && op <= ts.SyntaxKind.LastAssignment) {
        return 'write';
      }
    }
    return 'read';
  }
}
