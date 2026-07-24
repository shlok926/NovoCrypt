import { DiagnosticModel } from '../core/DiagnosticModel';
import { DiagnosticDiff } from '../core/DiagnosticDiff';

export interface IDEAdapter {
  readonly name: string;
  publishDiagnostics(diagnostics: readonly DiagnosticModel[]): void;
  clearDiagnostics(): void;
  refreshWorkspace(): void;
  updateIncrementally(diff: DiagnosticDiff): void;
}
