import { ReasoningTrace } from '../models/ReasoningTrace';

export class EvidenceLinker {
  public static link(findingId: string, steps: string[]): ReasoningTrace {
    return {
      traceId: `trace-${findingId}`,
      findingId,
      steps
    };
  }
}
