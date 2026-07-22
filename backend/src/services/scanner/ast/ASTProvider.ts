import { ASTContext } from './ASTContext';
import { ParserManager } from './ParserManager';
import { ASTCache } from './ASTCache';
import { ScanContext } from '../types';

export class ASTProvider {
  private parserManager: ParserManager;
  private requestCache: ASTCache;

  constructor(parserManager: ParserManager, cache?: ASTCache) {
    this.parserManager = parserManager;
    this.requestCache = cache || new ASTCache();
  }

  public getAST(context: ScanContext, options?: any): ASTContext | undefined {
    if (!context.fileName || !context.language) {
      return undefined;
    }

    const sourceHash = context.target.length;
    const cacheKey = `${context.fileName}-${sourceHash}`;

    let ast = this.requestCache.get(cacheKey);
    if (ast) {
      return ast;
    }

    const adapter = this.parserManager.getAdapter(context.language);
    if (!adapter) {
      return undefined;
    }

    try {
      ast = this.parserManager.parse(context.target, context.fileName, context.language, options);
      this.requestCache.set(cacheKey, ast);
      return ast;
    } catch (err) {
      context.services.logger.error(`ASTProvider failed to parse target file: ${context.fileName}`, err);
      return undefined;
    }
  }

  public getCache(): ASTCache {
    return this.requestCache;
  }

  public clearCache(): void {
    this.requestCache.clear();
  }
}
