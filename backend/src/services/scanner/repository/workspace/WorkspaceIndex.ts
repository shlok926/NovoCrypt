import { WorkspaceGraphNode } from './WorkspaceGraph';

export class WorkspaceIndex {
  private byFile = new Map<string, Set<WorkspaceGraphNode>>();
  private byType = new Map<string, Set<WorkspaceGraphNode>>();
  private byName = new Map<string, Set<WorkspaceGraphNode>>();

  public indexNode(node: WorkspaceGraphNode): void {
    this.addToIndex(this.byFile, node.file, node);
    this.addToIndex(this.byType, node.type, node);
    this.addToIndex(this.byName, node.label, node);
  }

  public getByFile(file: string): readonly WorkspaceGraphNode[] {
    const normalized = file.replace(/\\/g, '/');
    return Array.from(this.byFile.get(normalized) || []);
  }

  public getByType(type: string): readonly WorkspaceGraphNode[] {
    return Array.from(this.byType.get(type) || []);
  }

  public getByName(name: string): readonly WorkspaceGraphNode[] {
    return Array.from(this.byName.get(name) || []);
  }

  public clear(): void {
    this.byFile.clear();
    this.byType.clear();
    this.byName.clear();
  }

  private addToIndex(map: Map<string, Set<WorkspaceGraphNode>>, key: string, node: WorkspaceGraphNode): void {
    let set = map.get(key);
    if (!set) {
      set = new Set<WorkspaceGraphNode>();
      map.set(key, set);
    }
    set.add(node);
  }
}
