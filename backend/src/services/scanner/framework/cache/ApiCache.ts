import { ApiBehavior } from '../models/ApiBehavior';

export class ApiCache {
  private cache = new Map<string, ApiBehavior>();

  public get(key: string): ApiBehavior | undefined {
    return this.cache.get(key);
  }

  public set(key: string, behavior: ApiBehavior): void {
    this.cache.set(key, behavior);
  }

  public clear(): void {
    this.cache.clear();
  }
}
