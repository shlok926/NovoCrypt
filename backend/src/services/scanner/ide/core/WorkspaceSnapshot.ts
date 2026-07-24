import { DiagnosticModel } from './DiagnosticModel';

export interface WorkspaceSnapshot {
  readonly workspaceId: string;
  readonly diagnostics: readonly DiagnosticModel[];
  readonly timestamp: number;
  readonly version: string;
  readonly scanId: string;
}
