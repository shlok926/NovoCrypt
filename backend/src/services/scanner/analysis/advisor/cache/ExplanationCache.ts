import { SecurityExplanation } from '../models/SecurityExplanation';

export class ExplanationCache {
  private cache = new Map<string, SecurityExplanation>();

  public get(key: string): SecurityExplanation | undefined {
    return this.cache.get(key);
  }

  public set(key: string, exp: SecurityExplanation): void {
    this.cache.set(key, exp);
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}
