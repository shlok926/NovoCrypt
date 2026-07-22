import { NovoNode } from './NovoNode';
import { Scope, ScopeType, Declaration } from './Scope';

export class ScopeManager {
  private stack: Scope[] = [];
  private allScopes: Scope[] = [];
  private scopeCounter = 0;
  private root: Scope | null = null;

  constructor() {}

  public createScope(type: ScopeType, node?: NovoNode): Scope {
    const parent = this.currentScope();
    const depth = parent ? parent.depth + 1 : 0;
    const id = `scope-${++this.scopeCounter}`;
    
    const scope: Scope = {
      id,
      type,
      parent,
      children: [],
      depth,
      declarations: new Map<string, Declaration>(),
      creationNode: node
    };

    if (parent) {
      parent.children.push(scope);
    } else {
      this.root = scope;
    }

    this.allScopes.push(scope);
    return scope;
  }

  public pushScope(scope: Scope): void {
    this.stack.push(scope);
  }

  public popScope(): Scope | undefined {
    return this.stack.pop();
  }

  public currentScope(): Scope | undefined {
    return this.stack[this.stack.length - 1];
  }

  public rootScope(): Scope | undefined {
    return this.root || undefined;
  }

  public registerDeclaration(name: string, type: string, node: NovoNode): Declaration {
    const scope = this.currentScope();
    if (!scope) {
      throw new Error(`ScopeManager: Attempted to register declaration '${name}' outside of active lexical scope`);
    }

    const parentDecl = this.findNearestDeclaration(name);
    
    const declaration: Declaration = {
      name,
      type,
      node,
      shadowed: parentDecl !== undefined,
      shadowedDeclaration: parentDecl
    };

    scope.declarations.set(name, declaration);
    return declaration;
  }

  public findDeclarationInCurrentScope(name: string): Declaration | undefined {
    const scope = this.currentScope();
    return scope ? scope.declarations.get(name) : undefined;
  }

  public findNearestDeclaration(name: string): Declaration | undefined {
    let current = this.currentScope();
    while (current) {
      const decl = current.declarations.get(name);
      if (decl) {
        return decl;
      }
      current = current.parent;
    }
    return undefined;
  }

  public isShadowed(name: string): boolean {
    const decl = this.findDeclarationInCurrentScope(name);
    return decl ? !!decl.shadowed : false;
  }

  public findParentScope(type?: ScopeType): Scope | undefined {
    let current = this.currentScope()?.parent;
    if (!type) {
      return current;
    }
    while (current) {
      if (current.type === type) {
        return current;
      }
      current = current.parent;
    }
    return undefined;
  }

  public findChildScopes(scope: Scope, recursive = false): Scope[] {
    if (!recursive) {
      return [...scope.children];
    }
    const children: Scope[] = [];
    const collect = (s: Scope) => {
      for (const child of s.children) {
        children.push(child);
        collect(child);
      }
    };
    collect(scope);
    return children;
  }

  public getScopes(): Scope[] {
    return [...this.allScopes];
  }

  public clear(): void {
    this.stack = [];
    this.allScopes = [];
    this.scopeCounter = 0;
    this.root = null;
  }
}
