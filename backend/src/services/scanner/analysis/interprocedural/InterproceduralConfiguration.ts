export interface InterproceduralConfiguration {
  readonly maxCallDepth?: number;
  readonly recursionLimit?: number;
  readonly contextSensitivity?: boolean;
  readonly aliasTracking?: boolean;
  readonly objectTracking?: boolean;
  readonly pathSensitivity?: boolean;
  readonly summaryCacheEnabled?: boolean;
  readonly asyncAnalysis?: boolean;
  readonly timeoutMs?: number;
}
