export type RepositoryEventType =
  | 'RepositoryLoaded'
  | 'FileChanged'
  | 'ScanStarted'
  | 'ScanCompleted'
  | 'CacheInvalidated';

export interface RepositoryEvent {
  readonly type: RepositoryEventType;
  readonly payload?: any;
  readonly timestamp: number;
}

export type RepositoryEventListener = (event: RepositoryEvent) => void;

export class RepositoryEvents {
  private static listeners = new Map<RepositoryEventType, Set<RepositoryEventListener>>();

  public static subscribe(type: RepositoryEventType, listener: RepositoryEventListener): () => void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set<RepositoryEventListener>();
      this.listeners.set(type, set);
    }
    set.add(listener);

    return () => {
      set?.delete(listener);
    };
  }

  public static emit(type: RepositoryEventType, payload?: any): void {
    const event: RepositoryEvent = {
      type,
      payload,
      timestamp: Date.now()
    };

    const set = this.listeners.get(type);
    if (set) {
      for (const listener of set) {
        try {
          listener(event);
        } catch (e) {
          console.error(`Error executing event listener for ${type}:`, e);
        }
      }
    }
  }
}
