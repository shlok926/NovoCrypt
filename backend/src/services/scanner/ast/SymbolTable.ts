import { NovoNode } from './NovoNode';
import { Scope } from './Scope';
import { Symbol, SymbolKind, Reference } from './Symbol';
import { ScopeManager } from './ScopeManager';

export class SymbolTable {
  private symbols = new Map<string, Symbol>(); // symbolId -> Symbol
  private declarationToSymbol = new Map<NovoNode, Symbol>(); // declaration node -> Symbol
  private references = new Map<NovoNode, Reference>(); // reference node -> Reference
  private symbolCounter = 0;

  constructor() {}

  public createSymbol(
    name: string,
    kind: SymbolKind,
    scope: Scope,
    declarationNode: NovoNode,
    options?: { exported?: boolean; imported?: boolean; metadata?: Map<string, any> }
  ): Symbol {
    const id = `symbol-${++this.symbolCounter}`;
    const symbol: Symbol = {
      id,
      name,
      kind,
      scope,
      declaration: declarationNode,
      references: [],
      exported: !!options?.exported,
      imported: !!options?.imported,
      metadata: options?.metadata || new Map<string, any>()
    };

    this.symbols.set(id, symbol);
    this.declarationToSymbol.set(declarationNode, symbol);
    return symbol;
  }

  public recordReference(node: NovoNode, symbol: Symbol, usage: 'read' | 'write'): Reference {
    const reference: Reference = {
      node,
      symbol,
      usage
    };
    this.references.set(node, reference);
    // Push reference into the mutable references list of the symbol
    (symbol.references as Reference[]).push(reference);
    return reference;
  }

  public resolveIdentifier(name: string, scopeManager: ScopeManager): Symbol | undefined {
    const decl = scopeManager.findNearestDeclaration(name);
    if (!decl) {
      return undefined;
    }
    return this.findByDeclaration(decl.node);
  }

  public findSymbol(id: string): Symbol | undefined {
    return this.symbols.get(id);
  }

  public findByDeclaration(node: NovoNode): Symbol | undefined {
    return this.declarationToSymbol.get(node);
  }

  public findReferences(symbol: Symbol): Reference[] {
    return [...symbol.references];
  }

  public getAllSymbols(): Symbol[] {
    return Array.from(this.symbols.values());
  }

  public getExports(): Symbol[] {
    return this.getAllSymbols().filter(s => s.exported);
  }

  public getImports(): Symbol[] {
    return this.getAllSymbols().filter(s => s.imported);
  }

  public clear(): void {
    this.symbols.clear();
    this.declarationToSymbol.clear();
    this.references.clear();
    this.symbolCounter = 0;
  }
}
