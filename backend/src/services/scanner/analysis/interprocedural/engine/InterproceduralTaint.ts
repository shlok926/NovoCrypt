import { InterproceduralDataFlow } from './InterproceduralDataFlow';

export class InterproceduralTaint {
  constructor(private flowGraph: InterproceduralDataFlow) {}

  public isTainted(
    sourceFile: string,
    sourceNodeId: string,
    sinkFile: string,
    sinkNodeId: string
  ): boolean {
    return this.flowGraph.isPathReachable(sourceFile, sourceNodeId, sinkFile, sinkNodeId);
  }
}
