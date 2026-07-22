import { NovoNode } from './NovoNode';
import { ASTContext } from './ASTContext';

export interface LanguageAdapter {
  supportedLanguages: string[];
  parse(source: string, filename: string, options?: any): ASTContext;
  normalizeNode(nativeNode: any, language: string, source: string, parent?: NovoNode): NovoNode;
}
