import { ASTContext } from './ASTContext';

export interface CacheMetrics {
  hits: number;
  misses: number;
  size: number;
}

export class ASTCache {
  private cache: Map<string, ASTContext> = new Map();
  private hits = 0;
  private misses = 0;

  public get(key: string): ASTContext | undefined {
    const hit = this.cache.get(key);
    if (hit) {
      this.hits++;
    } else {
      this.misses++;
    }
    return hit;
  }

  public set(key: string, context: ASTContext): void {
    this.cache.set(key, context);
  }

  public clear(): void {
    this.cache.clear();
  }

  public getMetrics(): CacheMetrics {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size
    };
  }
}
