export interface CachedFileAnalysis {
  readonly fingerprint: string;
  readonly ast: any;
  readonly scopes: any;
  readonly symbols: any;
  readonly callGraph: any;
  readonly dataFlow: any;
  readonly metadata: any;
  readonly imports: readonly string[];
  readonly exports: readonly string[];
  readonly frameworks: readonly string[];
  readonly findings: readonly any[];
}

export class AnalysisCache {
  private cache = new Map<string, CachedFileAnalysis>();

  public get(filePath: string): CachedFileAnalysis | undefined {
    return this.cache.get(filePath.replace(/\\/g, '/'));
  }

  public set(filePath: string, analysis: CachedFileAnalysis): void {
    this.cache.set(filePath.replace(/\\/g, '/'), analysis);
  }

  public delete(filePath: string): void {
    this.cache.delete(filePath.replace(/\\/g, '/'));
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}
