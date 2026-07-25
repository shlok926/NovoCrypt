import { SolverResult } from '../models/SolverResult';

export class ConstraintCache {
  private cache = new Map<string, SolverResult>();

  public get(key: string): SolverResult | undefined {
    return this.cache.get(key);
  }

  public set(key: string, result: SolverResult): void {
    this.cache.set(key, result);
  }

  public clear(): void {
    this.cache.clear();
  }
}
