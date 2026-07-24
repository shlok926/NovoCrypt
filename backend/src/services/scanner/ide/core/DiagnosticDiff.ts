import { DiagnosticModel } from './DiagnosticModel';

export interface DiagnosticDiff {
  readonly added: readonly DiagnosticModel[];
  readonly updated: readonly DiagnosticModel[];
  readonly removed: readonly DiagnosticModel[];
}
