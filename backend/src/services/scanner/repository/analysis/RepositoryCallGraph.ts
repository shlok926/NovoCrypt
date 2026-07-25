import { CallGraph } from '../../ast/callgraph/CallGraph';

import { CrossFileResolver } from './CrossFileResolver';

export class RepositoryCallGraph {
  private callEdges = new Set<string>();

  public buildCallGraph(
    callGraphs: Map<string, CallGraph>,
    resolver: CrossFileResolver
  ): void {
    this.callEdges.clear();

    for (const [file, cg] of callGraphs.entries()) {
      cg.edges.forEach((edge: any) => {
        const importedLink = resolver.getLink(file, edge.target.id);
        if (importedLink) {
          this.callEdges.add(`${file}:${edge.source.id} -> ${importedLink.targetFile}:${importedLink.targetSymbol}`);
        } else {
          this.callEdges.add(`${file}:${edge.source.id} -> ${file}:${edge.target.id}`);
        }
      });
    }
  }

  public getCallEdges(): readonly string[] {
    return Array.from(this.callEdges);
  }

  public isReachable(
    fromFile: string,
    fromFunc: string,
    toFile: string,
    toFunc: string
  ): boolean {
    const visited = new Set<string>();
    const queue: string[] = [`${fromFile.replace(/\\/g, '/')}:${fromFunc}`];
    const target = `${toFile.replace(/\\/g, '/')}:${toFunc}`;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === target) return true;

      const outgoing = this.getOutgoingCalls(current);
      for (const call of outgoing) {
        if (!visited.has(call)) {
          visited.add(call);
          queue.push(call);
        }
      }
    }

    return false;
  }

  private getOutgoingCalls(nodeKey: string): string[] {
    const prefix = `${nodeKey} -> `;
    const outgoing: string[] = [];
    for (const edge of this.callEdges) {
      if (edge.startsWith(prefix)) {
        outgoing.push(edge.substring(prefix.length));
      }
    }
    return outgoing;
  }
}
