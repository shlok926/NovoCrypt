import { FrameworkSemanticModel } from '../models/FrameworkSemanticModel';

export class SemanticCache {
  private cache = new Map<string, FrameworkSemanticModel>();

  public get(key: string): FrameworkSemanticModel | undefined {
    return this.cache.get(key);
  }

  public set(key: string, model: FrameworkSemanticModel): void {
    this.cache.set(key, model);
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}
