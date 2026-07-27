import { Recommendation } from '../models/Recommendation';

export class RecommendationCache {
  private cache = new Map<string, Recommendation>();

  public get(key: string): Recommendation | undefined {
    return this.cache.get(key);
  }

  public set(key: string, rec: Recommendation): void {
    this.cache.set(key, rec);
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}
