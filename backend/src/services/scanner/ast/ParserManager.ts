import * as ts from 'typescript';
import { LanguageAdapter } from './LanguageAdapter';
import { TypeScriptAdapter } from './TypeScriptAdapter';
import { ASTContext } from './ASTContext';

export class ParserManager {
  private adapters: Map<string, LanguageAdapter> = new Map();
  private defaultCompilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    allowJs: true,
    checkJs: false
  };

  constructor() {
    // Register standard adapters
    this.registerAdapter(new TypeScriptAdapter());
  }

  public registerAdapter(adapter: LanguageAdapter): void {
    for (const lang of adapter.supportedLanguages) {
      this.adapters.set(lang.toLowerCase(), adapter);
    }
  }

  public getAdapter(language: string): LanguageAdapter | undefined {
    return this.adapters.get(language.toLowerCase());
  }

  public parse(source: string, filename: string, language: string, options?: any): ASTContext {
    const adapter = this.getAdapter(language);
    if (!adapter) {
      throw new Error(`ParserManager: No registered adapter for language '${language}'`);
    }

    const compileOpts = { ...this.defaultCompilerOptions, ...options };
    return adapter.parse(source, filename, compileOpts);
  }

  public getCompilerOptions(): ts.CompilerOptions {
    return this.defaultCompilerOptions;
  }
}
