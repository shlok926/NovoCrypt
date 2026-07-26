import { RemediationPlan } from '../models/RemediationPlan';

export class RemediationCache {
  private cache = new Map<string, RemediationPlan>();

  public get(key: string): RemediationPlan | undefined {
    return this.cache.get(key);
  }

  public set(key: string, plan: RemediationPlan): void {
    this.cache.set(key, plan);
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}
