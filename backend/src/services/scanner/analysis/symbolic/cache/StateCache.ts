import { SymbolicState } from '../models/SymbolicState';

export class StateCache {
  private cache = new Map<string, SymbolicState>();

  public get(key: string): SymbolicState | undefined {
    return this.cache.get(key);
  }

  public set(key: string, state: SymbolicState): void {
    this.cache.set(key, state);
  }

  public clear(): void {
    this.cache.clear();
  }
}
