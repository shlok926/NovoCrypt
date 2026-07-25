import { CallContext } from '../models/CallContext';

export class ContextCache {
  private cache = new Map<string, CallContext>();

  public get(key: string): CallContext | undefined {
    return this.cache.get(key);
  }

  public set(key: string, context: CallContext): void {
    this.cache.set(key, context);
  }

  public clear(): void {
    this.cache.clear();
  }
}
