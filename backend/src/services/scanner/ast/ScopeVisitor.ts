import { IASTVisitor } from './IASTVisitor';
import { ScopeManager } from './ScopeManager';
import { TraversalContext } from './TraversalContext';
import { NovoNode } from './NovoNode';

export class ScopeVisitor implements IASTVisitor {
  public readonly id = 'scope-visitor';
  private scopeManager: ScopeManager;

  constructor(scopeManager: ScopeManager) {
    this.scopeManager = scopeManager;
  }

  public beforeTraversal(context: TraversalContext): void {
    this.scopeManager.clear();
  }

  public enterNode(node: NovoNode, context: TraversalContext): void {
    if (node.type === 'SourceFile') {
      const globalScope = this.scopeManager.createScope('global', node);
      this.scopeManager.pushScope(globalScope);
      
      const moduleScope = this.scopeManager.createScope('module', node);
      this.scopeManager.pushScope(moduleScope);
    } 
    else if (node.type === 'FunctionDeclaration' || node.type === 'MethodDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunction') {
      // Register function name in current (parent) scope
      const nameMeta = node.metadata.get('name');
      if (nameMeta) {
        this.scopeManager.registerDeclaration(nameMeta, 'function', node);
      }
      
      const funcScope = this.scopeManager.createScope('function', node);
      this.scopeManager.pushScope(funcScope);
    } 
    else if (node.type === 'Block') {
      const blockScope = this.scopeManager.createScope('block', node);
      this.scopeManager.pushScope(blockScope);
    } 
    else if (node.type === 'ClassDeclaration') {
      const nameMeta = node.metadata.get('name');
      if (nameMeta) {
        this.scopeManager.registerDeclaration(nameMeta, 'class', node);
      }
      
      const classScope = this.scopeManager.createScope('class', node);
      this.scopeManager.pushScope(classScope);
    } 
    else if (node.type === 'VariableDeclaration') {
      const nameMeta = node.metadata.get('name');
      if (nameMeta) {
        this.scopeManager.registerDeclaration(nameMeta, 'variable', node);
      } else {
        const idChild = node.children.find(c => c.type === 'Identifier');
        const idName = idChild?.metadata.get('name');
        if (idName) {
          this.scopeManager.registerDeclaration(idName, 'variable', node);
        }
      }
    } 
    else if (node.type === 'Parameter') {
      const nameMeta = node.metadata.get('name');
      if (nameMeta) {
        this.scopeManager.registerDeclaration(nameMeta, 'parameter', node);
      } else {
        const idChild = node.children.find(c => c.type === 'Identifier');
        const idName = idChild?.metadata.get('name');
        if (idName) {
          this.scopeManager.registerDeclaration(idName, 'parameter', node);
        }
      }
    } 
    else if (node.type === 'ImportDeclaration') {
      const extractImports = (n: NovoNode) => {
        if (n.type === 'ImportSpecifier' || n.type === 'ImportClause' || n.type === 'NamespaceImport' || n.type === 'Identifier') {
          const nameMeta = n.metadata.get('name');
          if (nameMeta) {
            this.scopeManager.registerDeclaration(nameMeta, 'import', n);
          }
        }
        for (const child of n.children) {
          extractImports(child);
        }
      };
      extractImports(node);
    }
  }

  public leaveNode(node: NovoNode, context: TraversalContext): void {
    if (node.type === 'SourceFile') {
      this.scopeManager.popScope(); // Pop Module scope
      this.scopeManager.popScope(); // Pop Global scope
    } 
    else if (node.type === 'FunctionDeclaration' || node.type === 'MethodDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunction') {
      this.scopeManager.popScope();
    } 
    else if (node.type === 'Block') {
      this.scopeManager.popScope();
    } 
    else if (node.type === 'ClassDeclaration') {
      this.scopeManager.popScope();
    }
  }
}
