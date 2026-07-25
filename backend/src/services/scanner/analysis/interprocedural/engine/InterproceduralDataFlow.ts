export interface InterproceduralFlowEdge {
  readonly fromFile: string;
  readonly fromNodeId: string;
  readonly toFile: string;
  readonly toNodeId: string;
}

export class InterproceduralDataFlow {
  private edges = new Set<string>();

  public addEdge(fromFile: string, fromNodeId: string, toFile: string, toNodeId: string): void {
    this.edges.add(`${fromFile}:${fromNodeId} -> ${toFile}:${toNodeId}`);
  }

  public getEdges(): readonly InterproceduralFlowEdge[] {
    return Array.from(this.edges).map(e => {
      const parts = e.split(' -> ');
      const fromParts = parts[0].split(':');
      const toParts = parts[1].split(':');
      return {
        fromFile: fromParts[0],
        fromNodeId: fromParts[1],
        toFile: toParts[0],
        toNodeId: toParts[1]
      };
    });
  }

  public isPathReachable(
    fromFile: string,
    fromNodeId: string,
    toFile: string,
    toNodeId: string
  ): boolean {
    const visited = new Set<string>();
    const queue: string[] = [`${fromFile}:${fromNodeId}`];
    const targetKey = `${toFile}:${toNodeId}`;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === targetKey) return true;

      const outgoing = this.getOutgoing(current);
      for (const edge of outgoing) {
        if (!visited.has(edge)) {
          visited.add(edge);
          queue.push(edge);
        }
      }
    }

    return false;
  }

  private getOutgoing(nodeKey: string): string[] {
    const prefix = `${nodeKey} -> `;
    const outgoing: string[] = [];
    for (const edge of this.edges) {
      if (edge.startsWith(prefix)) {
        outgoing.push(edge.substring(prefix.length));
      }
    }
    return outgoing;
  }
}
