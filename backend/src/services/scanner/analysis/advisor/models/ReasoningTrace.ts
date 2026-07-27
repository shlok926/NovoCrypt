export interface ReasoningTrace {
  readonly traceId: string;
  readonly findingId: string;
  readonly steps: readonly string[];
}
