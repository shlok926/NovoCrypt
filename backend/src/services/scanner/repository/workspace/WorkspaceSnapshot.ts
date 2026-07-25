export interface WorkspaceSnapshot {
  readonly scanId: string;
  readonly timestamp: number;
  readonly repositoryVersion: string;
  readonly metrics: any;
  readonly findings: readonly any[];
  readonly policiesApplied: readonly string[];
}
