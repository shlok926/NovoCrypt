export interface FrameworkConfiguration {
  readonly enabledFrameworks?: readonly string[];
  readonly adapterPriority?: readonly string[];
  readonly semanticCacheEnabled?: boolean;
  readonly endpointDiscovery?: boolean;
  readonly middlewareAnalysis?: boolean;
  readonly lifecycleAnalysis?: boolean;
  readonly dependencyInjectionAnalysis?: boolean;
  readonly sanitizerRecognition?: boolean;
}
