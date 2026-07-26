import { SecurePatch } from '../models/SecurePatch';

export class PatchCache {
  private cache = new Map<string, SecurePatch>();

  public get(key: string): SecurePatch | undefined {
    return this.cache.get(key);
  }

  public set(key: string, patch: SecurePatch): void {
    this.cache.set(key, patch);
  }

  public clear(): void {
    this.cache.clear();
  }
}
