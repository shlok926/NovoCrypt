import { NovoNode } from './NovoNode';
import { Scope } from './Scope';

export type SymbolKind = 'Variable' | 'Parameter' | 'Function' | 'Class' | 'Method' | 'Import' | 'Export';

export interface Reference {
  readonly node: NovoNode;
  readonly symbol: Symbol;
  readonly usage: 'read' | 'write';
}

export interface Symbol {
  readonly id: string;
  readonly name: string;
  readonly kind: SymbolKind;
  readonly scope: Scope;
  readonly declaration: NovoNode;
  readonly references: Reference[];
  readonly exported: boolean;
  readonly imported: boolean;
  readonly metadata: Map<string, any>;
}
