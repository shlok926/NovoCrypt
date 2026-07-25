export type WorkspaceGraphNodeType =
  | 'file'
  | 'import'
  | 'export'
  | 'class'
  | 'interface'
  | 'function'
  | 'method'
  | 'variable';

export type WorkspaceGraphEdgeType =
  | 'import'
  | 'export'
  | 'inheritance'
  | 'implementation'
  | 'call'
  | 'dependency';

export interface WorkspaceGraphNode {
  readonly id: string;
  readonly type: WorkspaceGraphNodeType;
  readonly label: string;
  readonly file: string;
  readonly metadata: ReadonlyMap<string, any>;
}

export interface WorkspaceGraphEdge {
  readonly source: string;
  readonly target: string;
  readonly type: WorkspaceGraphEdgeType;
}

export class WorkspaceGraph {
  private nodesMap = new Map<string, WorkspaceGraphNode>();
  private edgesList: WorkspaceGraphEdge[] = [];
  private outgoingEdges = new Map<string, Set<WorkspaceGraphEdge>>();
  private incomingEdges = new Map<string, Set<WorkspaceGraphEdge>>();

  public addNode(node: WorkspaceGraphNode): void {
    this.nodesMap.set(node.id, node);
  }

  public addEdge(edge: WorkspaceGraphEdge): void {
    this.edgesList.push(edge);
    this.addToIndex(this.outgoingEdges, edge.source, edge);
    this.addToIndex(this.incomingEdges, edge.target, edge);
  }

  public getNode(id: string): WorkspaceGraphNode | undefined {
    return this.nodesMap.get(id);
  }

  public getNodes(): readonly WorkspaceGraphNode[] {
    return Array.from(this.nodesMap.values());
  }

  public getEdges(): readonly WorkspaceGraphEdge[] {
    return this.edgesList;
  }

  public getOutgoing(nodeId: string): readonly WorkspaceGraphEdge[] {
    return Array.from(this.outgoingEdges.get(nodeId) || []);
  }

  public getIncoming(nodeId: string): readonly WorkspaceGraphEdge[] {
    return Array.from(this.incomingEdges.get(nodeId) || []);
  }

  public clear(): void {
    this.nodesMap.clear();
    this.edgesList = [];
    this.outgoingEdges.clear();
    this.incomingEdges.clear();
  }

  private addToIndex(map: Map<string, Set<WorkspaceGraphEdge>>, key: string, edge: WorkspaceGraphEdge): void {
    let set = map.get(key);
    if (!set) {
      set = new Set<WorkspaceGraphEdge>();
      map.set(key, set);
    }
    set.add(edge);
  }
}
