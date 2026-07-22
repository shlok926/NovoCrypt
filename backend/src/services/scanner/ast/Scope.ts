import { NovoNode } from './NovoNode';

export type ScopeType = 'global' | 'module' | 'function' | 'block' | 'class' | 'closure';

export interface Declaration {
  name: string;
  type: string; // 'variable' | 'parameter' | 'function' | 'class' | 'import'
  node: NovoNode;
  shadowed?: boolean;
  shadowedDeclaration?: Declaration;
}

export interface Scope {
  readonly id: string;
  readonly type: ScopeType;
  readonly parent?: Scope;
  readonly children: Scope[];
  readonly depth: number;
  readonly declarations: Map<string, Declaration>;
  readonly creationNode?: NovoNode;
}
