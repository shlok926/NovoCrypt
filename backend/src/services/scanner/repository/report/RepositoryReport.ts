import { RepositoryMetrics } from './RepositoryMetrics';

export interface RepositoryReport {
  readonly workspaceSummary: {
    readonly root: string;
    readonly totalFiles: number;
  };
  readonly languageStatistics: Readonly<Record<string, number>>;
  readonly frameworkSummary: readonly string[];
  readonly findings: readonly any[];
  readonly ruleStatistics: Readonly<Record<string, number>>;
  readonly metrics: RepositoryMetrics;
}
