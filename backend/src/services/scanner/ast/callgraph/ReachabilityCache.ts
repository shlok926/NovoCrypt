export class ReachabilityCache {
  private cache = new Map<string, Set<string>>();

  public has(sourceId: string): boolean {
    return this.cache.has(sourceId);
  }

  public get(sourceId: string): Set<string> | undefined {
    return this.cache.get(sourceId);
  }

  public set(sourceId: string, reachableIds: Set<string>): void {
    this.cache.set(sourceId, new Set(reachableIds));
  }

  public clear(): void {
    this.cache.clear();
  }
}
