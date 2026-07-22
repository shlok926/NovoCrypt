import { FlowNode } from './FlowNode';
import { FlowEdge } from './FlowEdge';

export class FlowGraph {
  public nodes: FlowNode[] = [];
  public edges: FlowEdge[] = [];
  
  private incoming = new Map<string, FlowEdge[]>();
  private outgoing = new Map<string, FlowEdge[]>();
  private nodeById = new Map<string, FlowNode>();
  private astNodeToNode = new Map<any, FlowNode[]>();

  public addNode(node: FlowNode): void {
    this.nodes.push(node);
    this.nodeById.set(node.id, node);
    
    const list = this.astNodeToNode.get(node.astNode) || [];
    list.push(node);
    this.astNodeToNode.set(node.astNode, list);
  }

  public addEdge(edge: FlowEdge): void {
    this.edges.push(edge);
    
    const srcList = this.outgoing.get(edge.source.id) || [];
    srcList.push(edge);
    this.outgoing.set(edge.source.id, srcList);

    const tgtList = this.incoming.get(edge.target.id) || [];
    tgtList.push(edge);
    this.incoming.set(edge.target.id, tgtList);
  }

  public getIncomingEdges(nodeId: string): FlowEdge[] {
    return this.incoming.get(nodeId) || [];
  }

  public getOutgoingEdges(nodeId: string): FlowEdge[] {
    return this.outgoing.get(nodeId) || [];
  }

  public findNodesByAstNode(astNode: any): FlowNode[] {
    return this.astNodeToNode.get(astNode) || [];
  }

  public findNodeById(nodeId: string): FlowNode | undefined {
    return this.nodeById.get(nodeId);
  }

  public clear(): void {
    this.nodes = [];
    this.edges = [];
    this.incoming.clear();
    this.outgoing.clear();
    this.nodeById.clear();
    this.astNodeToNode.clear();
  }
}
