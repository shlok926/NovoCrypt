export interface FrameworkMetrics {
  readonly frameworksDetected: number;
  readonly endpointsAnalysed: number;
  readonly middlewareChains: number;
  readonly apiBehavioursModelled: number;
  readonly lifecycleTransitions: number;
  readonly frameworkObjectsAnalysed: number;
  readonly sanitizersRecognised: number;
  readonly sourcesDetected: number;
  readonly sinksDetected: number;
  readonly cacheHits: number;
  readonly executionTimeMs: number;
}
