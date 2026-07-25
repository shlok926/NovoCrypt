import { FlowGraph } from '../../ast/dataflow/FlowGraph';

import { CrossFileResolver } from './CrossFileResolver';

export class RepositoryTaintAnalyzer {
  private flowEdges = new Set<string>();

  public resolveTaintPaths(
    flowGraphs: Map<string, FlowGraph>,
    resolver: CrossFileResolver
  ): void {
    this.flowEdges.clear();

    for (const [file, fg] of flowGraphs.entries()) {
      fg.edges.forEach((edge: any) => {
        this.flowEdges.add(`${file}:${edge.source.id} -> ${file}:${edge.target.id}`);
      });
    }

    for (const [file, fg] of flowGraphs.entries()) {
      fg.nodes.forEach((node: any) => {
        if (node.type === 'CallExpression') {
          const native = node.rawReference?.ref as any;
          if (native && native.expression) {
            const funcName = native.expression.text || (native.expression.name && native.expression.name.text);
            if (funcName) {
              const link = resolver.getLink(file, funcName);
              if (link) {
                this.flowEdges.add(`${file}:${node.id} -> ${link.targetFile}:${link.targetSymbol}`);
              }
            }
          }
        }
      });
    }
  }

  public isTaintReachable(
    sourceFile: string,
    sourceNodeId: string,
    sinkFile: string,
    sinkNodeId: string
  ): boolean {
    const visited = new Set<string>();
    const queue: string[] = [`${sourceFile.replace(/\\/g, '/')}:${sourceNodeId}`];
    const target = `${sinkFile.replace(/\\/g, '/')}:${sinkNodeId}`;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === target) return true;

      const outgoing = this.getOutgoingFlows(current);
      for (const flow of outgoing) {
        if (!visited.has(flow)) {
          visited.add(flow);
          queue.push(flow);
        }
      }
    }

    return false;
  }

  private getOutgoingFlows(nodeKey: string): string[] {
    const prefix = `${nodeKey} -> `;
    const outgoing: string[] = [];
    for (const edge of this.flowEdges) {
      if (edge.startsWith(prefix)) {
        outgoing.push(edge.substring(prefix.length));
      }
    }
    return outgoing;
  }
}
