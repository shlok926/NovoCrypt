import { NovoNode } from './NovoNode';

export interface ASTStatistics {
  nodeCount: number;
  parseTimeMs: number;
  lineCount: number;
}

export interface ASTDiagnostic {
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning';
}

export interface ASTContext {
  root: NovoNode;
  language: string;
  filename: string;
  statistics: ASTStatistics;
  parserMetadata: Map<string, any>;
  diagnostics: ASTDiagnostic[];
}
