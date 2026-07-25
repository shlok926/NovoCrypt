import { FunctionSummary } from '../models/FunctionSummary';

export class SummaryCache {
  private cache = new Map<string, FunctionSummary>();

  public get(id: string): FunctionSummary | undefined {
    return this.cache.get(id);
  }

  public set(id: string, summary: FunctionSummary): void {
    this.cache.set(id, summary);
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}
