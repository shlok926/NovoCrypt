export interface RepositoryMetrics {
  readonly filesScanned: number;
  readonly filesSkipped: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly languages: Readonly<Record<string, number>>;
  readonly frameworks: readonly string[];
  readonly findingsCount: number;
  readonly scanDurationMs: number;
  readonly incrementalUpdatesCount: number;
  readonly workerUtilization: number;
  readonly parsingTimeMs: number;
  readonly semanticTimeMs: number;
  readonly taintTimeMs: number;
  readonly frameworkTimeMs: number;
  readonly policyTimeMs: number;
  readonly reportGenerationTimeMs: number;
}
