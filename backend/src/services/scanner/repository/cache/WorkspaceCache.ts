import { WorkspaceSnapshot } from '../workspace/WorkspaceSnapshot';

export class WorkspaceCache {
  private cache = new Map<string, WorkspaceSnapshot>();

  public get(workspaceId: string): WorkspaceSnapshot | undefined {
    return this.cache.get(workspaceId.replace(/\\/g, '/'));
  }

  public set(workspaceId: string, snapshot: WorkspaceSnapshot): void {
    this.cache.set(workspaceId.replace(/\\/g, '/'), snapshot);
  }

  public delete(workspaceId: string): void {
    this.cache.delete(workspaceId.replace(/\\/g, '/'));
  }

  public clear(): void {
    this.cache.clear();
  }
}
