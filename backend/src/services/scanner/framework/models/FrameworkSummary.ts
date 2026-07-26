export interface FrameworkSummary {
  readonly frameworks: readonly string[];
  readonly endpointsCount: number;
  readonly middlewaresCount: number;
  readonly sanitizersCount: number;
}
