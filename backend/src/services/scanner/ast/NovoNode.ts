export interface NodeLocation {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  pos: number;
  end: number;
}

export interface NovoNode {
  type: string;        // Normalized type: e.g., 'Identifier', 'CallExpression', 'VariableDeclarator', 'SourceFile'
  kind: string;        // Language-specific node kind/name: e.g. ts.SyntaxKind name
  location: NodeLocation;
  children: NovoNode[];
  parent?: NovoNode;
  metadata: Map<string, any>;
  language: string;
  rawReference: any;   // Reference to the original native compiler node
}
